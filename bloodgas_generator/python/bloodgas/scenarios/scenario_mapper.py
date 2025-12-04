"""
Scenario Mapper

Maps clinical conditions to physiological blood gas values,
handling multiple simultaneous conditions and their interactions.
"""

from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from bloodgas.models.disorders import (
    ClinicalCondition,
    ChronicCondition,
    Disorder,
    Severity,
    ConditionEffect,
)
from bloodgas.models.patient_state import PatientFactors
from bloodgas.scenarios.clinical_conditions import get_condition_effect
from bloodgas.physiology.acid_base import AcidBaseEngine
from bloodgas.physiology.variability import VariabilityEngine


@dataclass
class PhysiologyDeltas:
    """Accumulated physiological changes from all conditions."""
    
    # Acid-base deltas
    ph_delta: float = 0.0
    pco2_delta: float = 0.0
    hco3_delta: float = 0.0
    
    # Oxygenation - now pathology-based instead of fixed targets
    aa_gradient_elevated: bool = False
    target_aa_gradient: float = 10.0  # A-a gradient in mmHg (normal ~10-15 for young adult)
    shunt_fraction: float = 0.0  # Fraction of blood bypassing lungs (0-0.5 typically)
    # Legacy field for backward compatibility - only used if explicitly low
    po2_target: float = 95.0  # Now represents room air baseline, not fixed target
    
    # Electrolytes
    sodium_delta: float = 0.0
    potassium_delta: float = 0.0
    chloride_delta: float = 0.0
    glucose_target: float = 95.0
    lactate_target: float = 1.0
    
    # Anion gap
    anion_gap_elevated: bool = False
    target_anion_gap: float = 10.0
    
    # Respiratory modifiers
    respiratory_drive_multiplier: float = 1.0
    compensation_blocked: bool = False


class ScenarioMapper:
    """
    Maps clinical scenarios to blood gas physiology.
    
    Handles:
    - Single condition mapping
    - Multiple simultaneous conditions with interaction effects
    - Severity scaling
    - Patient factor adjustments
    """
    
    @classmethod
    def map_single_condition(
        cls,
        condition: ClinicalCondition,
        severity: Severity,
        patient: PatientFactors
    ) -> PhysiologyDeltas:
        """
        Map a single clinical condition to physiological deltas.
        
        Args:
            condition: The clinical condition
            severity: Severity of the condition
            patient: Patient factors
        
        Returns:
            PhysiologyDeltas with all changes
        """
        effect = get_condition_effect(condition)
        deltas = PhysiologyDeltas()
        
        # Calculate severity scaling factor (0-1)
        if severity == Severity.MILD:
            severity_factor = 0.33
        elif severity == Severity.MODERATE:
            severity_factor = 0.66
        else:  # SEVERE
            severity_factor = 1.0
        
        # Map primary disorder to acid-base changes
        deltas = cls._apply_acid_base_effect(deltas, effect, severity_factor, patient)
        
        # Apply oxygenation effects
        deltas = cls._apply_oxygenation_effect(deltas, effect, severity_factor)
        
        # Apply electrolyte effects
        deltas = cls._apply_electrolyte_effect(deltas, effect, severity_factor)
        
        # Apply respiratory modifiers
        if effect.affects_respiratory_drive:
            deltas.respiratory_drive_multiplier = effect.respiratory_drive_multiplier
        if effect.compensation_blocked:
            deltas.compensation_blocked = True
        
        return deltas
    
    @classmethod
    def _apply_acid_base_effect(
        cls,
        deltas: PhysiologyDeltas,
        effect: ConditionEffect,
        severity_factor: float,
        patient: PatientFactors
    ) -> PhysiologyDeltas:
        """Apply acid-base changes from a condition effect."""
        
        # Get baseline values from patient
        baseline_pco2 = patient.get_baseline_pco2()
        baseline_hco3 = patient.get_baseline_hco3()
        
        # Calculate pCO2 change
        pco2_range = effect.pco2_effect[1] - effect.pco2_effect[0]
        pco2_change = effect.pco2_effect[0] + (pco2_range * severity_factor)
        deltas.pco2_delta = pco2_change
        
        # Calculate HCO3 change
        hco3_range = effect.hco3_effect[1] - effect.hco3_effect[0]
        hco3_change = effect.hco3_effect[0] + (hco3_range * severity_factor)
        deltas.hco3_delta = hco3_change
        
        return deltas
    
    @classmethod
    def _apply_oxygenation_effect(
        cls,
        deltas: PhysiologyDeltas,
        effect: ConditionEffect,
        severity_factor: float
    ) -> PhysiologyDeltas:
        """Apply oxygenation changes from a condition effect.
        
        Now uses pathology-based parameters (A-a gradient, shunt fraction) instead
        of fixed pO2 targets, so that pO2 will realistically respond to FiO2 changes.
        """
        deltas.aa_gradient_elevated = effect.aa_gradient_elevated
        
        # Calculate A-a gradient based on severity
        # Higher severity = higher A-a gradient (worse V/Q mismatch)
        aa_range = effect.aa_gradient_range[1] - effect.aa_gradient_range[0]
        deltas.target_aa_gradient = effect.aa_gradient_range[0] + (aa_range * severity_factor)
        
        # Calculate shunt fraction based on severity
        # Higher severity = more shunt (more blood bypassing ventilated lung)
        shunt_range = effect.shunt_fraction_range[1] - effect.shunt_fraction_range[0]
        deltas.shunt_fraction = effect.shunt_fraction_range[0] + (shunt_range * severity_factor)
        
        # Keep po2_target as a reference for room air baseline, but it won't be used directly
        po2_range = effect.po2_effect[1] - effect.po2_effect[0]
        deltas.po2_target = effect.po2_effect[0] + (po2_range * (1 - severity_factor))
        
        return deltas
    
    @classmethod
    def _apply_electrolyte_effect(
        cls,
        deltas: PhysiologyDeltas,
        effect: ConditionEffect,
        severity_factor: float
    ) -> PhysiologyDeltas:
        """Apply electrolyte changes from a condition effect."""
        
        # Sodium
        na_range = effect.sodium_effect[1] - effect.sodium_effect[0]
        deltas.sodium_delta = effect.sodium_effect[0] + (na_range * severity_factor)
        
        # Potassium
        k_range = effect.potassium_effect[1] - effect.potassium_effect[0]
        deltas.potassium_delta = effect.potassium_effect[0] + (k_range * severity_factor)
        
        # Chloride
        cl_range = effect.chloride_effect[1] - effect.chloride_effect[0]
        deltas.chloride_delta = effect.chloride_effect[0] + (cl_range * severity_factor)
        
        # Glucose
        glucose_range = effect.glucose_effect[1] - effect.glucose_effect[0]
        deltas.glucose_target = effect.glucose_effect[0] + (glucose_range * severity_factor)
        
        # Lactate
        lactate_range = effect.lactate_effect[1] - effect.lactate_effect[0]
        deltas.lactate_target = effect.lactate_effect[0] + (lactate_range * severity_factor)
        
        # Anion gap
        if effect.anion_gap_elevated:
            deltas.anion_gap_elevated = True
            ag_range = effect.typical_anion_gap[1] - effect.typical_anion_gap[0]
            deltas.target_anion_gap = effect.typical_anion_gap[0] + (ag_range * severity_factor)
        
        return deltas
    
    @classmethod
    def map_multiple_conditions(
        cls,
        conditions: List[ClinicalCondition],
        severities: Dict[ClinicalCondition, Severity],
        patient: PatientFactors
    ) -> PhysiologyDeltas:
        """
        Map multiple simultaneous conditions, resolving interactions.
        
        This is the key method for generating complex multi-condition scenarios
        like "DKA + opioid overdose" where effects interact.
        
        Args:
            conditions: List of clinical conditions
            severities: Severity for each condition
            patient: Patient factors
        
        Returns:
            Combined PhysiologyDeltas with interaction effects resolved
        """
        if not conditions:
            return PhysiologyDeltas()
        
        # Start with first condition
        first_severity = severities.get(conditions[0], Severity.MODERATE)
        combined = cls.map_single_condition(conditions[0], first_severity, patient)
        
        if len(conditions) == 1:
            return combined
        
        # Process remaining conditions
        for condition in conditions[1:]:
            severity = severities.get(condition, Severity.MODERATE)
            additional = cls.map_single_condition(condition, severity, patient)
            combined = cls._combine_deltas(combined, additional)
        
        # Apply interaction rules
        combined = cls._apply_interaction_rules(combined, conditions, severities)
        
        return combined
    
    @classmethod
    def _combine_deltas(
        cls,
        primary: PhysiologyDeltas,
        secondary: PhysiologyDeltas
    ) -> PhysiologyDeltas:
        """Combine two sets of physiological deltas."""
        
        combined = PhysiologyDeltas()
        
        # Acid-base: additive for metabolic, competing for respiratory
        combined.pco2_delta = primary.pco2_delta + secondary.pco2_delta
        combined.hco3_delta = primary.hco3_delta + secondary.hco3_delta
        
        # Oxygenation: take the worse values (higher A-a gradient, more shunt)
        combined.aa_gradient_elevated = primary.aa_gradient_elevated or secondary.aa_gradient_elevated
        combined.target_aa_gradient = max(primary.target_aa_gradient, secondary.target_aa_gradient)
        # Shunt fractions don't simply add - take the worse case but cap at reasonable max
        combined.shunt_fraction = min(0.5, max(primary.shunt_fraction, secondary.shunt_fraction) + 
                                      min(primary.shunt_fraction, secondary.shunt_fraction) * 0.5)
        combined.po2_target = min(primary.po2_target, secondary.po2_target)  # Legacy field
        
        # Electrolytes: additive
        combined.sodium_delta = primary.sodium_delta + secondary.sodium_delta
        combined.potassium_delta = primary.potassium_delta + secondary.potassium_delta
        combined.chloride_delta = primary.chloride_delta + secondary.chloride_delta
        
        # Glucose/lactate: take the higher abnormal value
        combined.glucose_target = max(primary.glucose_target, secondary.glucose_target)
        combined.lactate_target = max(primary.lactate_target, secondary.lactate_target)
        
        # Anion gap: additive if both elevated
        if primary.anion_gap_elevated or secondary.anion_gap_elevated:
            combined.anion_gap_elevated = True
            if primary.anion_gap_elevated and secondary.anion_gap_elevated:
                # Both contributing - combine AG elevations
                combined.target_anion_gap = max(primary.target_anion_gap, secondary.target_anion_gap)
            else:
                combined.target_anion_gap = max(primary.target_anion_gap, secondary.target_anion_gap)
        
        # Respiratory modifiers: multiplicative for drive, OR for blocking
        combined.respiratory_drive_multiplier = (
            primary.respiratory_drive_multiplier * secondary.respiratory_drive_multiplier
        )
        combined.compensation_blocked = (
            primary.compensation_blocked or secondary.compensation_blocked
        )
        
        return combined
    
    @classmethod
    def _apply_interaction_rules(
        cls,
        deltas: PhysiologyDeltas,
        conditions: List[ClinicalCondition],
        severities: Dict[ClinicalCondition, Severity]
    ) -> PhysiologyDeltas:
        """
        Apply interaction rules for specific condition combinations.
        
        This handles special cases where conditions interact in 
        non-additive ways.
        """
        
        # Rule: Opioids block respiratory compensation for metabolic acidosis
        if cls._has_condition(conditions, ClinicalCondition.OPIOID_OVERDOSE):
            if deltas.hco3_delta < -4:  # Metabolic acidosis present
                # The expected compensatory drop in pCO2 is blocked
                # Instead of hyperventilating, pCO2 may be normal or high
                if deltas.pco2_delta < 0:
                    # Reduce the compensatory hyperventilation
                    deltas.pco2_delta *= deltas.respiratory_drive_multiplier
                deltas.compensation_blocked = True
        
        # Rule: Salicylate toxicity - unique dual effect
        if cls._has_condition(conditions, ClinicalCondition.TOXIC_INGESTION_SALICYLATE):
            # Primary respiratory stimulation + metabolic acidosis
            # The respiratory alkalosis component may partially offset the acidosis
            pass  # Already handled in condition definition
        
        # Rule: COPD + metabolic alkalosis (e.g., vomiting)
        # Can cause severe alkalemia because CO2 retention impairs compensation
        copd_conditions = [
            ClinicalCondition.COPD_EXACERBATION,
        ]
        alkalosis_conditions = [
            ClinicalCondition.VOMITING,
            ClinicalCondition.NG_SUCTION,
            ClinicalCondition.DIURETIC_USE,
        ]
        has_copd = any(cls._has_condition(conditions, c) for c in copd_conditions)
        has_alkalosis = any(cls._has_condition(conditions, c) for c in alkalosis_conditions)
        
        if has_copd and has_alkalosis:
            # COPD patients can't hyperventilate effectively
            # This leads to more severe alkalemia
            if deltas.pco2_delta > 0:  # COPD raising pCO2
                # Limit compensation for alkalosis
                pass
        
        # Rule: Sepsis + hyperventilation
        # Can have both respiratory alkalosis (sepsis effect) and metabolic acidosis (lactate)
        if cls._has_condition(conditions, ClinicalCondition.LACTIC_ACIDOSIS_SEPSIS):
            # Sepsis causes direct respiratory stimulation
            deltas.respiratory_drive_multiplier = max(
                deltas.respiratory_drive_multiplier, 1.3
            )
        
        return deltas
    
    @classmethod
    def _has_condition(
        cls,
        conditions: List[ClinicalCondition],
        target: ClinicalCondition
    ) -> bool:
        """Check if a specific condition is in the list."""
        return target in conditions
    
    @classmethod
    def get_primary_disorder(
        cls,
        conditions: List[ClinicalCondition]
    ) -> Disorder:
        """Determine the primary disorder from conditions."""
        if not conditions:
            return Disorder.NORMAL
        
        # Use the first condition's primary disorder
        effect = get_condition_effect(conditions[0])
        return effect.primary_disorder
    
    @classmethod
    def get_teaching_points(
        cls,
        conditions: List[ClinicalCondition]
    ) -> List[str]:
        """Gather all teaching points for the conditions."""
        points = []
        for condition in conditions:
            effect = get_condition_effect(condition)
            points.extend(effect.teaching_points)
        
        # Add interaction teaching points if multiple conditions
        if len(conditions) > 1:
            points.append(
                "Multiple simultaneous conditions create complex, "
                "interacting acid-base disturbances"
            )
            
            # Check for specific interactions
            has_met_acidosis = any(
                get_condition_effect(c).primary_disorder == Disorder.METABOLIC_ACIDOSIS
                for c in conditions
            )
            has_resp_depression = any(
                get_condition_effect(c).compensation_blocked
                for c in conditions
            )
            
            if has_met_acidosis and has_resp_depression:
                points.append(
                    "Respiratory depression blocks compensatory hyperventilation, "
                    "causing more severe acidemia"
                )
        
        return points

