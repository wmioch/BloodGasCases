"""
Interpretation Engine

Generates clinical interpretation text for blood gas results,
including teaching points for educational use.
"""

from typing import List, Optional
from bloodgas.models.blood_gas_result import (
    BloodGasResult,
    ClinicalInterpretation,
    InterpretationSeverity,
)
from bloodgas.models.disorders import ClinicalCondition, Disorder
from bloodgas.physiology.acid_base import AcidBaseEngine, NORMAL_PH, NORMAL_PCO2, NORMAL_HCO3
from bloodgas.physiology.oxygenation import OxygenationEngine
from bloodgas.physiology.electrolytes import ElectrolyteEngine
from bloodgas.scenarios.clinical_conditions import get_condition_effect


class InterpretationEngine:
    """
    Generates clinical interpretation for blood gas results.
    
    Provides:
    - Primary disorder identification
    - Compensation assessment
    - Oxygenation analysis
    - Anion gap analysis with delta-delta
    - Clinical implications
    - Teaching points for education
    """
    
    @classmethod
    def interpret(
        cls,
        result: BloodGasResult,
        conditions: Optional[List[ClinicalCondition]] = None
    ) -> ClinicalInterpretation:
        """
        Generate complete interpretation for a blood gas result.
        
        Args:
            result: The blood gas result to interpret
            conditions: Optional list of conditions that generated the result
        
        Returns:
            ClinicalInterpretation with all analysis
        """
        # Step 1: Identify primary disorder
        primary_disorder = cls._identify_primary_disorder(result)
        primary_desc = cls._describe_primary_disorder(result, primary_disorder)
        
        # Step 2: Assess compensation
        compensation_status, compensation_desc, secondary = cls._assess_compensation(
            result, primary_disorder
        )
        
        # Step 3: Analyze oxygenation
        oxy_status, oxy_desc = cls._analyze_oxygenation(result)
        
        # Step 4: Analyze anion gap
        ag_status, ag_desc, delta_delta = cls._analyze_anion_gap(result)
        
        # Step 5: Determine overall severity
        severity = cls._determine_severity(result)
        
        # Step 6: Generate clinical implications
        implications = cls._generate_implications(
            result, primary_disorder, secondary, conditions
        )
        
        # Step 7: Gather teaching points
        teaching_points = cls._gather_teaching_points(
            result, primary_disorder, conditions
        )
        
        # Create interpretation
        return ClinicalInterpretation(
            primary_disorder=primary_disorder,
            primary_disorder_description=primary_desc,
            compensation_status=compensation_status,
            compensation_description=compensation_desc,
            secondary_disorder=secondary,
            secondary_disorder_description=cls._describe_secondary(secondary) if secondary else None,
            oxygenation_status=oxy_status,
            oxygenation_description=oxy_desc,
            anion_gap_status=ag_status,
            anion_gap_description=ag_desc,
            delta_delta_analysis=delta_delta,
            severity=severity,
            clinical_implications=implications,
            teaching_points=teaching_points,
            generating_conditions=[c.name for c in conditions] if conditions else [],
        )
    
    @classmethod
    def _identify_primary_disorder(cls, result: BloodGasResult) -> str:
        """Identify the primary acid-base disorder."""
        ph = result.ph
        pco2 = result.pco2
        hco3 = result.hco3
        
        # Check for normal pH
        if NORMAL_PH[0] <= ph <= NORMAL_PH[1]:
            if pco2 < NORMAL_PCO2[0] and hco3 < NORMAL_HCO3[0]:
                return "Compensated Metabolic Acidosis"
            elif pco2 > NORMAL_PCO2[1] and hco3 > NORMAL_HCO3[1]:
                return "Compensated Respiratory Acidosis or Metabolic Alkalosis"
            else:
                return "Normal"
        
        # Acidemia
        if ph < NORMAL_PH[0]:
            if pco2 > NORMAL_PCO2[1] and hco3 <= NORMAL_HCO3[1]:
                return "Respiratory Acidosis"
            elif hco3 < NORMAL_HCO3[0] and pco2 <= NORMAL_PCO2[1]:
                return "Metabolic Acidosis"
            elif pco2 > NORMAL_PCO2[1] and hco3 < NORMAL_HCO3[0]:
                return "Mixed Respiratory and Metabolic Acidosis"
            else:
                return "Acidemia - Mixed Disorder"
        
        # Alkalemia
        if pco2 < NORMAL_PCO2[0] and hco3 >= NORMAL_HCO3[0]:
            return "Respiratory Alkalosis"
        elif hco3 > NORMAL_HCO3[1] and pco2 >= NORMAL_PCO2[0]:
            return "Metabolic Alkalosis"
        elif pco2 < NORMAL_PCO2[0] and hco3 > NORMAL_HCO3[1]:
            return "Mixed Respiratory Alkalosis and Metabolic Alkalosis"
        else:
            return "Alkalemia - Mixed Disorder"
    
    @classmethod
    def _describe_primary_disorder(cls, result: BloodGasResult, disorder: str) -> str:
        """Generate description of the primary disorder."""
        ph = result.ph
        
        if "Normal" in disorder:
            return f"pH {ph:.2f} is within normal range (7.35-7.45)"
        
        if "Acidosis" in disorder or "Acidemia" in disorder:
            if ph < 7.20:
                severity_word = "severe"
            elif ph < 7.30:
                severity_word = "moderate"
            else:
                severity_word = "mild"
            
            if "Metabolic" in disorder:
                return (f"{severity_word.capitalize()} metabolic acidosis with pH {ph:.2f}, "
                       f"HCO3 {result.hco3:.0f} mEq/L")
            elif "Respiratory" in disorder:
                return (f"{severity_word.capitalize()} respiratory acidosis with pH {ph:.2f}, "
                       f"pCO2 {result.pco2:.0f} mmHg")
            else:
                return f"{severity_word.capitalize()} acidemia with pH {ph:.2f}"
        
        else:  # Alkalosis
            if ph > 7.55:
                severity_word = "severe"
            elif ph > 7.50:
                severity_word = "moderate"
            else:
                severity_word = "mild"
            
            if "Metabolic" in disorder:
                return (f"{severity_word.capitalize()} metabolic alkalosis with pH {ph:.2f}, "
                       f"HCO3 {result.hco3:.0f} mEq/L")
            elif "Respiratory" in disorder:
                return (f"{severity_word.capitalize()} respiratory alkalosis with pH {ph:.2f}, "
                       f"pCO2 {result.pco2:.0f} mmHg")
            else:
                return f"{severity_word.capitalize()} alkalemia with pH {ph:.2f}"
    
    @classmethod
    def _assess_compensation(
        cls,
        result: BloodGasResult,
        primary: str
    ) -> tuple[str, str, Optional[str]]:
        """Assess compensation status and identify any secondary disorder."""
        ph = result.ph
        pco2 = result.pco2
        hco3 = result.hco3
        
        secondary = None
        
        if "Normal" in primary:
            return ("N/A", "No disorder to compensate", None)
        
        if "Metabolic Acidosis" in primary:
            expected = AcidBaseEngine.expected_pco2_metabolic_acidosis(hco3)
            
            if pco2 < expected[0]:
                status = "Excessive"
                desc = (f"pCO2 {pco2:.0f} is lower than expected ({expected[0]:.0f}-{expected[1]:.0f}), "
                       "suggesting concurrent respiratory alkalosis")
                secondary = "Respiratory Alkalosis"
            elif pco2 > expected[1]:
                status = "Inadequate"
                desc = (f"pCO2 {pco2:.0f} is higher than expected ({expected[0]:.0f}-{expected[1]:.0f}), "
                       "suggesting concurrent respiratory acidosis or impaired compensation")
                secondary = "Respiratory Acidosis"
            else:
                status = "Appropriate"
                desc = f"pCO2 {pco2:.0f} is appropriate for the degree of acidosis (Winter's formula)"
        
        elif "Metabolic Alkalosis" in primary:
            expected = AcidBaseEngine.expected_pco2_metabolic_alkalosis(hco3)
            
            if pco2 > expected[1]:
                status = "Excessive"
                desc = (f"pCO2 {pco2:.0f} is higher than expected, "
                       "suggesting concurrent respiratory acidosis")
                secondary = "Respiratory Acidosis"
            elif pco2 < expected[0]:
                status = "Inadequate"
                desc = (f"pCO2 {pco2:.0f} is lower than expected, "
                       "suggesting concurrent respiratory alkalosis")
                secondary = "Respiratory Alkalosis"
            else:
                status = "Appropriate"
                desc = f"pCO2 {pco2:.0f} shows appropriate hypoventilatory compensation"
        
        elif "Respiratory Acidosis" in primary:
            # Assume acute unless HCO3 very elevated
            if hco3 > 30:
                expected = AcidBaseEngine.expected_hco3_respiratory_acidosis_chronic(pco2)
                duration = "chronic"
            else:
                expected = AcidBaseEngine.expected_hco3_respiratory_acidosis_acute(pco2)
                duration = "acute"
            
            if hco3 > expected[1]:
                status = "Excessive"
                desc = (f"HCO3 {hco3:.0f} is higher than expected for {duration} respiratory acidosis, "
                       "suggesting concurrent metabolic alkalosis")
                secondary = "Metabolic Alkalosis"
            elif hco3 < expected[0]:
                status = "Inadequate"
                desc = (f"HCO3 {hco3:.0f} is lower than expected, "
                       "suggesting concurrent metabolic acidosis")
                secondary = "Metabolic Acidosis"
            else:
                status = "Appropriate"
                desc = f"HCO3 {hco3:.0f} is appropriate for {duration} respiratory acidosis"
        
        elif "Respiratory Alkalosis" in primary:
            if hco3 < 18:
                expected = AcidBaseEngine.expected_hco3_respiratory_alkalosis_chronic(pco2)
                duration = "chronic"
            else:
                expected = AcidBaseEngine.expected_hco3_respiratory_alkalosis_acute(pco2)
                duration = "acute"
            
            if hco3 < expected[0]:
                status = "Excessive"
                desc = (f"HCO3 {hco3:.0f} is lower than expected, "
                       "suggesting concurrent metabolic acidosis")
                secondary = "Metabolic Acidosis"
            elif hco3 > expected[1]:
                status = "Inadequate"
                desc = (f"HCO3 {hco3:.0f} is higher than expected, "
                       "suggesting concurrent metabolic alkalosis")
                secondary = "Metabolic Alkalosis"
            else:
                status = "Appropriate"
                desc = f"HCO3 {hco3:.0f} is appropriate for {duration} respiratory alkalosis"
        
        else:
            status = "Mixed"
            desc = "Mixed disorder - compensation assessment complex"
        
        return (status, desc, secondary)
    
    @classmethod
    def _describe_secondary(cls, secondary: str) -> str:
        """Describe the secondary disorder."""
        descriptions = {
            "Respiratory Alkalosis": "Additional hyperventilation beyond expected compensation",
            "Respiratory Acidosis": "Inadequate respiratory response or additional CO2 retention",
            "Metabolic Alkalosis": "Additional bicarbonate elevation beyond compensation",
            "Metabolic Acidosis": "Additional acid accumulation or bicarbonate loss",
        }
        return descriptions.get(secondary, "Additional acid-base disturbance")
    
    @classmethod
    def _analyze_oxygenation(cls, result: BloodGasResult) -> tuple[str, str]:
        """Analyze oxygenation status."""
        po2 = result.po2
        sao2 = result.sao2
        pf_ratio = result.pao2_fio2_ratio
        aa_gradient = result.aa_gradient
        expected_aa = result.expected_aa_gradient
        fio2 = result.fio2
        
        descriptions = []
        
        # PaO2 assessment
        if fio2 == 0.21:  # Room air
            if po2 >= 80:
                status = "Normal"
            elif po2 >= 60:
                status = "Mild hypoxemia"
            elif po2 >= 40:
                status = "Moderate hypoxemia"
            else:
                status = "Severe hypoxemia"
        else:
            # On supplemental O2
            status = f"On {fio2:.0%} O2"
            if pf_ratio < 100:
                status = f"Severe hypoxemia ({status})"
            elif pf_ratio < 200:
                status = f"Moderate hypoxemia ({status})"
            elif pf_ratio < 300:
                status = f"Mild hypoxemia ({status})"
        
        descriptions.append(f"PaO2 {po2:.0f} mmHg, SaO2 {sao2:.0f}%")
        
        # A-a gradient
        if aa_gradient > expected_aa + 10:
            descriptions.append(
                f"A-a gradient elevated at {aa_gradient:.0f} mmHg "
                f"(expected <{expected_aa:.0f} for age) - "
                "suggests V/Q mismatch, shunt, or diffusion impairment"
            )
        elif aa_gradient > expected_aa + 5:
            descriptions.append(
                f"A-a gradient mildly elevated at {aa_gradient:.0f} mmHg"
            )
        else:
            descriptions.append(
                f"A-a gradient normal at {aa_gradient:.0f} mmHg"
            )
        
        # P/F ratio if on oxygen
        if fio2 > 0.21:
            ards_class = OxygenationEngine.classify_ards(pf_ratio)
            descriptions.append(f"P/F ratio {pf_ratio:.0f} ({ards_class})")
        
        return (status, "; ".join(descriptions))
    
    @classmethod
    def _analyze_anion_gap(cls, result: BloodGasResult) -> tuple[str, str, Optional[str]]:
        """Analyze anion gap and delta-delta."""
        ag = result.anion_gap
        corrected_ag = result.corrected_anion_gap
        delta_gap = result.delta_gap
        hco3 = result.hco3
        
        # Calculate delta ratio
        delta_hco3 = 24 - hco3
        if delta_hco3 > 0 and delta_gap > 0:
            delta_ratio = delta_gap / delta_hco3
        else:
            delta_ratio = None
        
        # Status
        if corrected_ag > 14:
            status = "Elevated"
        elif corrected_ag < 6:
            status = "Low"
        else:
            status = "Normal"
        
        # Description
        if status == "Elevated":
            desc = (f"Anion gap elevated at {ag:.0f} mEq/L "
                   f"(corrected: {corrected_ag:.0f}) - "
                   "indicates accumulation of unmeasured anions")
            
            # Delta-delta analysis
            if delta_ratio is not None:
                if delta_ratio < 1:
                    delta_desc = (
                        f"Delta ratio {delta_ratio:.1f} (<1) suggests concurrent "
                        "non-anion gap metabolic acidosis"
                    )
                elif delta_ratio > 2:
                    delta_desc = (
                        f"Delta ratio {delta_ratio:.1f} (>2) suggests concurrent "
                        "metabolic alkalosis or pre-existing elevated HCO3"
                    )
                else:
                    delta_desc = f"Delta ratio {delta_ratio:.1f} (1-2) consistent with pure HAGMA"
            else:
                delta_desc = None
        elif status == "Low":
            desc = (f"Anion gap low at {ag:.0f} mEq/L - "
                   "consider hypoalbuminemia, paraproteinemia")
            delta_desc = None
        else:
            desc = f"Anion gap normal at {ag:.0f} mEq/L"
            delta_desc = None
        
        return (status, desc, delta_desc)
    
    @classmethod
    def _determine_severity(cls, result: BloodGasResult) -> InterpretationSeverity:
        """Determine overall severity of the blood gas abnormality."""
        ph = result.ph
        po2 = result.po2
        
        # Critical values
        if ph < 7.10 or ph > 7.60:
            return InterpretationSeverity.CRITICAL
        if po2 < 40 and result.fio2 == 0.21:
            return InterpretationSeverity.CRITICAL
        
        # Severe
        if ph < 7.20 or ph > 7.55:
            return InterpretationSeverity.SEVERE
        if po2 < 50:
            return InterpretationSeverity.SEVERE
        
        # Moderate
        if ph < 7.30 or ph > 7.50:
            return InterpretationSeverity.MODERATE
        if po2 < 60:
            return InterpretationSeverity.MODERATE
        
        # Mild
        if ph < 7.35 or ph > 7.45:
            return InterpretationSeverity.MILD
        if po2 < 80:
            return InterpretationSeverity.MILD
        
        return InterpretationSeverity.NORMAL
    
    @classmethod
    def _generate_implications(
        cls,
        result: BloodGasResult,
        primary: str,
        secondary: Optional[str],
        conditions: Optional[List[ClinicalCondition]]
    ) -> List[str]:
        """Generate clinical implications."""
        implications = []
        
        # pH-based implications
        if result.ph < 7.20:
            implications.append("Severe acidemia may cause cardiac dysfunction, vasodilation")
        elif result.ph > 7.55:
            implications.append("Severe alkalemia may cause arrhythmias, seizures")
        
        # Hypoxemia implications
        if result.po2 < 60:
            implications.append("Significant hypoxemia - tissue oxygen delivery compromised")
        
        # Lactate implications
        if result.lactate > 4:
            implications.append("Elevated lactate suggests tissue hypoperfusion")
        
        # Anion gap implications
        if result.corrected_anion_gap > 20:
            implications.append("High anion gap - investigate for ketoacidosis, lactic acidosis, toxins, renal failure")
        
        # Potassium implications
        if result.potassium > 6.0:
            implications.append("Hyperkalemia - cardiac monitoring required")
        elif result.potassium < 3.0:
            implications.append("Severe hypokalemia - risk of arrhythmias")
        
        # Mixed disorder implications
        if secondary:
            implications.append(f"Mixed disorder ({primary} + {secondary}) - more complex management required")
        
        # Condition-specific implications
        if conditions:
            for condition in conditions:
                effect = get_condition_effect(condition)
                if effect.compensation_blocked:
                    implications.append(
                        "Respiratory compensation impaired - monitor for rapid pH deterioration"
                    )
                    break
        
        return implications
    
    @classmethod
    def _gather_teaching_points(
        cls,
        result: BloodGasResult,
        primary: str,
        conditions: Optional[List[ClinicalCondition]]
    ) -> List[str]:
        """Gather teaching points for educational purposes."""
        points = []
        
        # Basic interpretation approach
        points.append("ABG interpretation approach: pH → Primary disorder → Compensation → Anion gap")
        
        # Condition-specific teaching points
        if conditions:
            for condition in conditions:
                effect = get_condition_effect(condition)
                points.extend(effect.teaching_points)
        
        # General teaching based on findings
        if "Metabolic Acidosis" in primary:
            if result.corrected_anion_gap > 14:
                points.append("High anion gap acidosis: think MUDPILES (Methanol, Uremia, DKA, Propylene glycol, INH, Lactic acidosis, Ethylene glycol, Salicylates)")
            else:
                points.append("Normal anion gap acidosis: think GI losses, RTA, or dilutional")
        
        if result.aa_gradient > result.expected_aa_gradient + 10:
            points.append("Elevated A-a gradient indicates pulmonary pathology (V/Q mismatch, shunt, or diffusion impairment)")
        
        if result.delta_gap > 6 and 24 - result.hco3 > 0:
            delta_ratio = result.delta_gap / (24 - result.hco3)
            if delta_ratio < 1 or delta_ratio > 2:
                points.append("Delta-delta ratio identifies hidden disorders in high AG acidosis")
        
        return points

