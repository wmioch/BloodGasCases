"""
Blood Gas Generator

Main generation engine that orchestrates all components to produce
physiologically accurate blood gas values.
"""

from typing import Dict, List, Optional, Union
from bloodgas.models.disorders import (
    Disorder,
    Severity,
    Compensation,
    Duration,
    ClinicalCondition,
)
from bloodgas.models.blood_gas_result import (
    BloodGasResult,
    ClinicalInterpretation,
    GenerationParams,
)
from bloodgas.models.patient_state import PatientFactors
from bloodgas.physiology.acid_base import AcidBaseEngine
from bloodgas.physiology.oxygenation import OxygenationEngine
from bloodgas.physiology.electrolytes import ElectrolyteEngine
from bloodgas.physiology.variability import VariabilityEngine, create_variability_engine
from bloodgas.scenarios.scenario_mapper import ScenarioMapper
from bloodgas.scenarios.clinical_conditions import get_condition_effect


def generate_blood_gas(
    # Disorder-based mode parameters
    primary_disorder: Optional[Disorder] = None,
    severity: Optional[Severity] = None,
    compensation: Compensation = Compensation.APPROPRIATE,
    secondary_disorder: Optional[Disorder] = None,
    duration: Duration = Duration.ACUTE,
    
    # Clinical scenario mode parameters
    conditions: Optional[List[ClinicalCondition]] = None,
    condition_severities: Optional[Dict[ClinicalCondition, Severity]] = None,
    
    # Patient factors
    patient_factors: Optional[PatientFactors] = None,
    
    # Environment
    fio2: float = 0.21,
    
    # Variability
    add_variability: bool = True,
    seed: Optional[int] = None,
) -> BloodGasResult:
    """
    Generate a physiologically accurate blood gas result.
    
    Supports two modes:
    1. Disorder-based: Specify the acid-base disorder directly
    2. Scenario-based: Specify clinical conditions that produce the disorder
    
    Args:
        primary_disorder: Primary acid-base disorder (disorder mode)
        severity: Severity of the disorder (Mild/Moderate/Severe)
        compensation: Expected compensation status
        secondary_disorder: Secondary disorder for mixed acid-base
        duration: Acute vs chronic (affects compensation)
        
        conditions: List of clinical conditions (scenario mode)
        condition_severities: Severity for each condition
        
        patient_factors: Patient characteristics affecting baselines
        fio2: Fraction of inspired oxygen (0.21-1.0)
        
        add_variability: Whether to add realistic variation
        seed: Random seed for reproducibility
    
    Returns:
        Complete BloodGasResult with all values and interpretation
    
    Examples:
        # Disorder-based mode
        result = generate_blood_gas(
            primary_disorder=Disorder.METABOLIC_ACIDOSIS,
            severity=Severity.MODERATE,
            compensation=Compensation.APPROPRIATE
        )
        
        # Scenario-based mode - single condition
        result = generate_blood_gas(
            conditions=[ClinicalCondition.DKA],
            condition_severities={ClinicalCondition.DKA: Severity.SEVERE}
        )
        
        # Scenario-based mode - multiple conditions
        result = generate_blood_gas(
            conditions=[ClinicalCondition.DKA, ClinicalCondition.OPIOID_OVERDOSE],
            condition_severities={
                ClinicalCondition.DKA: Severity.MODERATE,
                ClinicalCondition.OPIOID_OVERDOSE: Severity.SEVERE
            }
        )
    """
    # Initialize patient factors
    if patient_factors is None:
        patient_factors = PatientFactors()
    
    # Initialize variability engine
    variability = create_variability_engine(enabled=add_variability, seed=seed)
    
    # Determine generation mode and create result
    if conditions is not None:
        # Scenario-based mode
        result = _generate_from_scenarios(
            conditions=conditions,
            severities=condition_severities or {},
            patient=patient_factors,
            fio2=fio2,
            variability=variability,
        )
        mode = "scenario"
        condition_names = [c.name for c in conditions]
        severity_names = {c.name: s.name for c, s in (condition_severities or {}).items()}
    else:
        # Disorder-based mode
        result = _generate_from_disorder(
            primary_disorder=primary_disorder or Disorder.NORMAL,
            severity=severity or Severity.MODERATE,
            compensation=compensation,
            secondary_disorder=secondary_disorder,
            duration=duration,
            patient=patient_factors,
            fio2=fio2,
            variability=variability,
        )
        mode = "disorder"
        condition_names = []
        severity_names = {}
    
    # Create generation params
    result.generation_params = GenerationParams(
        mode=mode,
        primary_disorder=primary_disorder.name if primary_disorder else None,
        secondary_disorder=secondary_disorder.name if secondary_disorder else None,
        specified_compensation=compensation.name if compensation else None,
        conditions=condition_names,
        condition_severities=severity_names,
        patient_age=patient_factors.age,
        chronic_conditions=[c.name for c in patient_factors.chronic_conditions],
        fio2=fio2,
        seed=seed,
    )
    
    # Generate interpretation
    from bloodgas.interpretation import InterpretationEngine
    result.interpretation = InterpretationEngine.interpret(result, conditions)
    
    return result


def _generate_from_disorder(
    primary_disorder: Disorder,
    severity: Severity,
    compensation: Compensation,
    secondary_disorder: Optional[Disorder],
    duration: Duration,
    patient: PatientFactors,
    fio2: float,
    variability: VariabilityEngine,
) -> BloodGasResult:
    """Generate blood gas from disorder specification."""
    
    # Get baseline values from patient
    baseline_pco2 = patient.get_baseline_pco2()
    baseline_hco3 = patient.get_baseline_hco3()
    
    # Generate acid-base state
    ab_state = AcidBaseEngine.generate_for_disorder(
        disorder=primary_disorder,
        severity=severity,
        compensation=compensation,
        duration=duration,
        baseline_pco2=baseline_pco2,
        baseline_hco3=baseline_hco3,
    )
    
    # Apply secondary disorder if specified
    if secondary_disorder and secondary_disorder != Disorder.NORMAL:
        ab_state = AcidBaseEngine.apply_secondary_disorder(
            ab_state, secondary_disorder, Severity.MODERATE
        )
    
    # Determine oxygenation parameters based on disorder
    # For pure acid-base disorders, assume appropriate pathology
    aa_elevated = False
    target_aa_gradient = None
    shunt_fraction = 0.0
    
    if primary_disorder == Disorder.RESPIRATORY_ACIDOSIS:
        aa_elevated = True  # Assume lung pathology
        # Moderate V/Q mismatch for respiratory acidosis
        target_aa_gradient = 30.0  # Elevated A-a gradient
        shunt_fraction = 0.10  # Small shunt component
    
    # Generate oxygenation with pathology-based parameters
    oxy_state = OxygenationEngine.generate_oxygenation(
        fio2=fio2,
        paco2=ab_state.pco2,
        age=patient.age,
        aa_gradient_elevated=aa_elevated,
        target_aa_gradient=target_aa_gradient,
        shunt_fraction=shunt_fraction,
        ph=ab_state.ph,
        temperature=patient.temperature_celsius,
    )
    
    # Determine anion gap elevation
    ag_elevated = False
    if primary_disorder == Disorder.METABOLIC_ACIDOSIS:
        ag_elevated = True  # Assume HAGMA by default
    
    # Generate electrolytes
    lyte_state = ElectrolyteEngine.generate_electrolytes(
        hco3=ab_state.hco3,
        ph=ab_state.ph,
        elevated_anion_gap=ag_elevated,
        albumin=patient.get_baseline_albumin(),
    )
    
    # Get hemoglobin
    hemoglobin = patient.get_baseline_hemoglobin()
    
    # Apply variability
    ph = variability.vary_ph(ab_state.ph)
    pco2 = variability.vary_pco2(ab_state.pco2)
    po2 = variability.vary_po2(oxy_state.pao2)
    hco3 = variability.vary_hco3(ab_state.hco3)
    
    sodium = variability.vary_sodium(lyte_state.sodium)
    potassium = variability.vary_potassium(lyte_state.potassium)
    chloride = variability.vary_chloride(lyte_state.chloride)
    glucose = variability.vary_glucose(lyte_state.glucose)
    lactate = variability.vary_lactate(lyte_state.lactate)
    hemoglobin = variability.vary_hemoglobin(hemoglobin)
    
    # Recalculate derived values
    sao2 = OxygenationEngine.calculate_sao2(po2, ph)
    sao2 = variability.vary_sao2(sao2)
    
    base_excess = AcidBaseEngine.calculate_base_excess(ph, hco3, hemoglobin)
    
    pf_ratio = OxygenationEngine.calculate_pf_ratio(po2, fio2)
    aa_gradient = OxygenationEngine.calculate_aa_gradient(po2, pco2, fio2)
    expected_aa = OxygenationEngine.expected_aa_gradient(patient.age)
    
    anion_gap = ElectrolyteEngine.calculate_anion_gap(sodium, chloride, hco3)
    corrected_ag = ElectrolyteEngine.correct_anion_gap_for_albumin(
        anion_gap, lyte_state.albumin
    )
    delta_gap = ElectrolyteEngine.calculate_delta_gap(corrected_ag)
    
    return BloodGasResult(
        ph=ph,
        pco2=pco2,
        po2=po2,
        hco3=hco3,
        base_excess=base_excess,
        sao2=sao2,
        fio2=fio2,
        pao2_fio2_ratio=pf_ratio,
        aa_gradient=aa_gradient,
        expected_aa_gradient=expected_aa,
        sodium=sodium,
        potassium=potassium,
        chloride=chloride,
        glucose=glucose,
        anion_gap=anion_gap,
        corrected_anion_gap=corrected_ag,
        delta_gap=delta_gap,
        lactate=lactate,
        hemoglobin=hemoglobin,
        albumin=lyte_state.albumin,
    )


def _generate_from_scenarios(
    conditions: List[ClinicalCondition],
    severities: Dict[ClinicalCondition, Severity],
    patient: PatientFactors,
    fio2: float,
    variability: VariabilityEngine,
) -> BloodGasResult:
    """Generate blood gas from clinical scenario specification."""
    
    # Default severities to MODERATE
    for condition in conditions:
        if condition not in severities:
            severities[condition] = Severity.MODERATE
    
    # Map conditions to physiological deltas
    deltas = ScenarioMapper.map_multiple_conditions(
        conditions=conditions,
        severities=severities,
        patient=patient,
    )
    
    # Get baseline values
    baseline_pco2 = patient.get_baseline_pco2()
    baseline_hco3 = patient.get_baseline_hco3()
    
    # Apply deltas to baselines
    target_pco2 = baseline_pco2 + deltas.pco2_delta
    target_hco3 = baseline_hco3 + deltas.hco3_delta
    
    # Clamp to physiological limits
    target_pco2 = max(min(target_pco2, 120), 12)
    target_hco3 = max(min(target_hco3, 50), 4)
    
    # Calculate pH from Henderson-Hasselbalch
    ph = AcidBaseEngine.calculate_ph(target_hco3, target_pco2)
    
    # Clamp pH
    ph = max(min(ph, 7.80), 6.80)
    
    # Calculate base excess
    hemoglobin = patient.get_baseline_hemoglobin()
    base_excess = AcidBaseEngine.calculate_base_excess(ph, target_hco3, hemoglobin)
    
    # Generate oxygenation using pathology-based parameters
    # This calculates pO2 based on FiO2, A-a gradient, and shunt fraction
    # so that oxygenation realistically responds to supplemental oxygen
    oxy_state = OxygenationEngine.generate_oxygenation(
        fio2=fio2,
        paco2=target_pco2,
        age=patient.age,
        aa_gradient_elevated=deltas.aa_gradient_elevated,
        target_aa_gradient=deltas.target_aa_gradient,
        shunt_fraction=deltas.shunt_fraction,
        ph=ph,
        temperature=patient.temperature_celsius,
    )
    
    # Use the calculated pO2 from the oxygenation engine
    # The pO2 is now properly derived from FiO2, A-a gradient, and shunt
    po2 = oxy_state.pao2
    
    # Generate electrolytes
    target_sodium = 140 + deltas.sodium_delta
    target_potassium = 4.0 + deltas.potassium_delta
    
    # For anion gap, either use target or calculate from deltas
    lyte_state = ElectrolyteEngine.generate_electrolytes(
        hco3=target_hco3,
        ph=ph,
        elevated_anion_gap=deltas.anion_gap_elevated,
        target_anion_gap=deltas.target_anion_gap if deltas.anion_gap_elevated else None,
        sodium_target=target_sodium,
        potassium_target=target_potassium,
        glucose_target=deltas.glucose_target,
        lactate_target=deltas.lactate_target,
        albumin=patient.get_baseline_albumin(),
    )
    
    # Apply variability
    ph = variability.vary_ph(ph)
    pco2 = variability.vary_pco2(target_pco2)
    po2 = variability.vary_po2(po2)
    hco3 = variability.vary_hco3(target_hco3)
    
    sodium = variability.vary_sodium(lyte_state.sodium)
    potassium = variability.vary_potassium(lyte_state.potassium)
    chloride = variability.vary_chloride(lyte_state.chloride)
    glucose = variability.vary_glucose(lyte_state.glucose)
    lactate = variability.vary_lactate(lyte_state.lactate)
    hemoglobin = variability.vary_hemoglobin(hemoglobin)
    
    # Recalculate derived values after variability
    sao2 = OxygenationEngine.calculate_sao2(po2, ph)
    sao2 = variability.vary_sao2(sao2)
    
    base_excess = AcidBaseEngine.calculate_base_excess(ph, hco3, hemoglobin)
    
    pf_ratio = OxygenationEngine.calculate_pf_ratio(po2, fio2)
    aa_gradient = OxygenationEngine.calculate_aa_gradient(po2, pco2, fio2)
    expected_aa = OxygenationEngine.expected_aa_gradient(patient.age)
    
    anion_gap = ElectrolyteEngine.calculate_anion_gap(sodium, chloride, hco3)
    corrected_ag = ElectrolyteEngine.correct_anion_gap_for_albumin(
        anion_gap, lyte_state.albumin
    )
    delta_gap = ElectrolyteEngine.calculate_delta_gap(corrected_ag)
    
    return BloodGasResult(
        ph=ph,
        pco2=pco2,
        po2=po2,
        hco3=hco3,
        base_excess=base_excess,
        sao2=sao2,
        fio2=fio2,
        pao2_fio2_ratio=pf_ratio,
        aa_gradient=aa_gradient,
        expected_aa_gradient=expected_aa,
        sodium=sodium,
        potassium=potassium,
        chloride=chloride,
        glucose=glucose,
        anion_gap=anion_gap,
        corrected_anion_gap=corrected_ag,
        delta_gap=delta_gap,
        lactate=lactate,
        hemoglobin=hemoglobin,
        albumin=lyte_state.albumin,
    )

