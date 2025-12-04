"""
Acid-Base Engine

Implements Henderson-Hasselbalch equation and compensation rules
for generating physiologically accurate acid-base values.
"""

import math
from dataclasses import dataclass
from typing import Tuple, Optional
from bloodgas.models.disorders import Disorder, Severity, Compensation, Duration


# Normal ranges
NORMAL_PH = (7.35, 7.45)
NORMAL_PCO2 = (35.0, 45.0)
NORMAL_HCO3 = (22.0, 26.0)
NORMAL_BE = (-2.0, 2.0)


@dataclass
class AcidBaseState:
    """Represents the acid-base state of the blood."""
    ph: float
    pco2: float
    hco3: float
    base_excess: float
    primary_disorder: Disorder
    compensation_status: Compensation
    secondary_disorder: Optional[Disorder] = None


class AcidBaseEngine:
    """
    Engine for acid-base calculations and generation.
    
    Uses the Henderson-Hasselbalch equation:
    pH = 6.1 + log([HCO3-] / (0.03 × pCO2))
    
    And standard compensation formulas.
    """
    
    # Henderson-Hasselbalch constants
    PK = 6.1  # pKa of carbonic acid
    CO2_SOLUBILITY = 0.03  # mmol/L per mmHg
    
    @classmethod
    def calculate_ph(cls, hco3: float, pco2: float) -> float:
        """
        Calculate pH from HCO3 and pCO2 using Henderson-Hasselbalch.
        
        pH = 6.1 + log10([HCO3] / (0.03 × pCO2))
        """
        if pco2 <= 0 or hco3 <= 0:
            raise ValueError("pCO2 and HCO3 must be positive")
        
        ratio = hco3 / (cls.CO2_SOLUBILITY * pco2)
        return cls.PK + math.log10(ratio)
    
    @classmethod
    def calculate_hco3(cls, ph: float, pco2: float) -> float:
        """
        Calculate HCO3 from pH and pCO2.
        
        [HCO3] = 0.03 × pCO2 × 10^(pH - 6.1)
        """
        return cls.CO2_SOLUBILITY * pco2 * (10 ** (ph - cls.PK))
    
    @classmethod
    def calculate_pco2(cls, ph: float, hco3: float) -> float:
        """
        Calculate pCO2 from pH and HCO3.
        
        pCO2 = [HCO3] / (0.03 × 10^(pH - 6.1))
        """
        return hco3 / (cls.CO2_SOLUBILITY * (10 ** (ph - cls.PK)))
    
    @classmethod
    def calculate_base_excess(cls, ph: float, hco3: float, hemoglobin: float = 15.0) -> float:
        """
        Calculate standard base excess.
        
        Uses the Van Slyke equation approximation:
        BE = 0.9287 × HCO3 + 13.77 × pH - 124.58
        
        Or more accurately:
        BE = HCO3 - 24.4 + (2.3 × Hb + 7.7) × (pH - 7.4)
        """
        # Simplified formula that works well for clinical purposes
        be = (hco3 - 24.4) + (2.3 * hemoglobin + 7.7) * (ph - 7.4)
        return be
    
    @classmethod
    def expected_pco2_metabolic_acidosis(cls, hco3: float) -> Tuple[float, float]:
        """
        Calculate expected pCO2 in metabolic acidosis (Winter's formula).
        
        Expected pCO2 = 1.5 × [HCO3] + 8 ± 2
        
        Returns: (min_expected, max_expected)
        """
        expected = 1.5 * hco3 + 8
        return (expected - 2, expected + 2)
    
    @classmethod
    def expected_pco2_metabolic_alkalosis(cls, hco3: float) -> Tuple[float, float]:
        """
        Calculate expected pCO2 in metabolic alkalosis.
        
        Expected pCO2 = 0.7 × [HCO3] + 21 ± 2
        Alternative: pCO2 increases ~0.7 mmHg per 1 mEq/L increase in HCO3
        
        Returns: (min_expected, max_expected)
        """
        expected = 0.7 * hco3 + 21
        return (expected - 2, expected + 2)
    
    @classmethod
    def expected_hco3_respiratory_acidosis_acute(cls, pco2: float) -> Tuple[float, float]:
        """
        Calculate expected HCO3 in acute respiratory acidosis.
        
        HCO3 increases 1 mEq/L per 10 mmHg rise in pCO2
        
        Returns: (min_expected, max_expected)
        """
        delta_pco2 = pco2 - 40
        expected_delta_hco3 = delta_pco2 / 10  # 1 mEq/L per 10 mmHg
        expected = 24 + expected_delta_hco3
        return (expected - 2, expected + 2)
    
    @classmethod
    def expected_hco3_respiratory_acidosis_chronic(cls, pco2: float) -> Tuple[float, float]:
        """
        Calculate expected HCO3 in chronic respiratory acidosis.
        
        HCO3 increases 3.5 mEq/L per 10 mmHg rise in pCO2
        
        Returns: (min_expected, max_expected)
        """
        delta_pco2 = pco2 - 40
        expected_delta_hco3 = 3.5 * (delta_pco2 / 10)
        expected = 24 + expected_delta_hco3
        return (expected - 2, expected + 2)
    
    @classmethod
    def expected_hco3_respiratory_alkalosis_acute(cls, pco2: float) -> Tuple[float, float]:
        """
        Calculate expected HCO3 in acute respiratory alkalosis.
        
        HCO3 decreases 2 mEq/L per 10 mmHg fall in pCO2
        
        Returns: (min_expected, max_expected)
        """
        delta_pco2 = 40 - pco2
        expected_delta_hco3 = 2 * (delta_pco2 / 10)
        expected = 24 - expected_delta_hco3
        return (max(expected - 2, 8), expected + 2)  # Floor at 8
    
    @classmethod
    def expected_hco3_respiratory_alkalosis_chronic(cls, pco2: float) -> Tuple[float, float]:
        """
        Calculate expected HCO3 in chronic respiratory alkalosis.
        
        HCO3 decreases 4-5 mEq/L per 10 mmHg fall in pCO2
        
        Returns: (min_expected, max_expected)
        """
        delta_pco2 = 40 - pco2
        expected_delta_hco3 = 5 * (delta_pco2 / 10)
        expected = 24 - expected_delta_hco3
        return (max(expected - 2, 12), expected + 2)  # Floor at 12
    
    @classmethod
    def identify_primary_disorder(cls, ph: float, pco2: float, hco3: float) -> Disorder:
        """
        Identify the primary acid-base disorder from values.
        """
        if NORMAL_PH[0] <= ph <= NORMAL_PH[1]:
            # Normal pH - could be normal or compensated
            if pco2 < NORMAL_PCO2[0] and hco3 < NORMAL_HCO3[0]:
                # Both low - likely compensated metabolic acidosis
                return Disorder.METABOLIC_ACIDOSIS
            elif pco2 > NORMAL_PCO2[1] and hco3 > NORMAL_HCO3[1]:
                # Both high - likely compensated metabolic alkalosis or resp acidosis
                return Disorder.METABOLIC_ALKALOSIS
            else:
                return Disorder.NORMAL
        
        if ph < NORMAL_PH[0]:  # Acidemia
            if pco2 > NORMAL_PCO2[1]:
                return Disorder.RESPIRATORY_ACIDOSIS
            elif hco3 < NORMAL_HCO3[0]:
                return Disorder.METABOLIC_ACIDOSIS
            else:
                # Mixed or transitional
                return Disorder.METABOLIC_ACIDOSIS
        
        else:  # Alkalemia (pH > 7.45)
            if pco2 < NORMAL_PCO2[0]:
                return Disorder.RESPIRATORY_ALKALOSIS
            elif hco3 > NORMAL_HCO3[1]:
                return Disorder.METABOLIC_ALKALOSIS
            else:
                return Disorder.METABOLIC_ALKALOSIS
    
    @classmethod
    def assess_compensation(
        cls,
        primary_disorder: Disorder,
        ph: float,
        pco2: float,
        hco3: float,
        duration: Duration = Duration.ACUTE
    ) -> Tuple[Compensation, Optional[Disorder]]:
        """
        Assess compensation status and identify any secondary disorder.
        
        Returns: (compensation_status, secondary_disorder or None)
        """
        secondary_disorder = None
        
        if primary_disorder == Disorder.NORMAL:
            return (Compensation.NONE, None)
        
        if primary_disorder == Disorder.METABOLIC_ACIDOSIS:
            expected_pco2_range = cls.expected_pco2_metabolic_acidosis(hco3)
            
            if pco2 < expected_pco2_range[0]:
                # More hyperventilation than expected - respiratory alkalosis too
                secondary_disorder = Disorder.RESPIRATORY_ALKALOSIS
                return (Compensation.EXCESSIVE, secondary_disorder)
            elif pco2 > expected_pco2_range[1]:
                # Less hyperventilation than expected - respiratory acidosis too
                secondary_disorder = Disorder.RESPIRATORY_ACIDOSIS
                return (Compensation.PARTIAL, secondary_disorder)
            else:
                return (Compensation.APPROPRIATE, None)
        
        elif primary_disorder == Disorder.METABOLIC_ALKALOSIS:
            expected_pco2_range = cls.expected_pco2_metabolic_alkalosis(hco3)
            
            if pco2 > expected_pco2_range[1]:
                secondary_disorder = Disorder.RESPIRATORY_ACIDOSIS
                return (Compensation.EXCESSIVE, secondary_disorder)
            elif pco2 < expected_pco2_range[0]:
                secondary_disorder = Disorder.RESPIRATORY_ALKALOSIS
                return (Compensation.PARTIAL, secondary_disorder)
            else:
                return (Compensation.APPROPRIATE, None)
        
        elif primary_disorder == Disorder.RESPIRATORY_ACIDOSIS:
            if duration == Duration.ACUTE:
                expected_hco3_range = cls.expected_hco3_respiratory_acidosis_acute(pco2)
            else:
                expected_hco3_range = cls.expected_hco3_respiratory_acidosis_chronic(pco2)
            
            if hco3 > expected_hco3_range[1]:
                secondary_disorder = Disorder.METABOLIC_ALKALOSIS
                return (Compensation.EXCESSIVE, secondary_disorder)
            elif hco3 < expected_hco3_range[0]:
                secondary_disorder = Disorder.METABOLIC_ACIDOSIS
                return (Compensation.PARTIAL, secondary_disorder)
            else:
                return (Compensation.APPROPRIATE, None)
        
        elif primary_disorder == Disorder.RESPIRATORY_ALKALOSIS:
            if duration == Duration.ACUTE:
                expected_hco3_range = cls.expected_hco3_respiratory_alkalosis_acute(pco2)
            else:
                expected_hco3_range = cls.expected_hco3_respiratory_alkalosis_chronic(pco2)
            
            if hco3 < expected_hco3_range[0]:
                secondary_disorder = Disorder.METABOLIC_ACIDOSIS
                return (Compensation.EXCESSIVE, secondary_disorder)
            elif hco3 > expected_hco3_range[1]:
                secondary_disorder = Disorder.METABOLIC_ALKALOSIS
                return (Compensation.PARTIAL, secondary_disorder)
            else:
                return (Compensation.APPROPRIATE, None)
        
        return (Compensation.NONE, None)
    
    @classmethod
    def generate_for_disorder(
        cls,
        disorder: Disorder,
        severity: Severity,
        compensation: Compensation = Compensation.APPROPRIATE,
        duration: Duration = Duration.ACUTE,
        baseline_pco2: float = 40.0,
        baseline_hco3: float = 24.0,
    ) -> AcidBaseState:
        """
        Generate acid-base values for a specified disorder.
        
        This is the primary generation method for disorder-based mode.
        """
        if disorder == Disorder.NORMAL:
            return AcidBaseState(
                ph=7.40,
                pco2=baseline_pco2,
                hco3=baseline_hco3,
                base_excess=0.0,
                primary_disorder=Disorder.NORMAL,
                compensation_status=Compensation.NONE
            )
        
        # Determine target pH based on severity
        if disorder in [Disorder.METABOLIC_ACIDOSIS, Disorder.RESPIRATORY_ACIDOSIS]:
            if severity == Severity.MILD:
                target_ph = 7.32
            elif severity == Severity.MODERATE:
                target_ph = 7.25
            else:  # SEVERE
                target_ph = 7.15
        else:  # Alkalosis
            if severity == Severity.MILD:
                target_ph = 7.48
            elif severity == Severity.MODERATE:
                target_ph = 7.52
            else:  # SEVERE
                target_ph = 7.58
        
        # Generate values based on disorder type
        if disorder == Disorder.METABOLIC_ACIDOSIS:
            # Start with low HCO3
            if severity == Severity.MILD:
                hco3 = 18.0
            elif severity == Severity.MODERATE:
                hco3 = 14.0
            else:
                hco3 = 8.0
            
            # Calculate expected pCO2 with compensation
            expected_pco2 = cls.expected_pco2_metabolic_acidosis(hco3)
            
            if compensation == Compensation.NONE:
                pco2 = baseline_pco2  # No respiratory compensation
            elif compensation == Compensation.PARTIAL:
                pco2 = (baseline_pco2 + expected_pco2[1]) / 2
            elif compensation == Compensation.APPROPRIATE:
                pco2 = (expected_pco2[0] + expected_pco2[1]) / 2
            else:  # EXCESSIVE
                pco2 = expected_pco2[0] - 4  # More compensation than expected
            
            ph = cls.calculate_ph(hco3, pco2)
        
        elif disorder == Disorder.METABOLIC_ALKALOSIS:
            # Start with high HCO3
            if severity == Severity.MILD:
                hco3 = 30.0
            elif severity == Severity.MODERATE:
                hco3 = 36.0
            else:
                hco3 = 42.0
            
            # Calculate expected pCO2 with compensation
            expected_pco2 = cls.expected_pco2_metabolic_alkalosis(hco3)
            
            if compensation == Compensation.NONE:
                pco2 = baseline_pco2
            elif compensation == Compensation.PARTIAL:
                pco2 = (baseline_pco2 + expected_pco2[0]) / 2
            elif compensation == Compensation.APPROPRIATE:
                pco2 = (expected_pco2[0] + expected_pco2[1]) / 2
            else:  # EXCESSIVE
                pco2 = expected_pco2[1] + 4
            
            ph = cls.calculate_ph(hco3, pco2)
        
        elif disorder == Disorder.RESPIRATORY_ACIDOSIS:
            # Start with high pCO2
            if severity == Severity.MILD:
                pco2 = 52.0
            elif severity == Severity.MODERATE:
                pco2 = 65.0
            else:
                pco2 = 85.0
            
            # Calculate expected HCO3 with compensation
            if duration == Duration.CHRONIC:
                expected_hco3 = cls.expected_hco3_respiratory_acidosis_chronic(pco2)
            else:
                expected_hco3 = cls.expected_hco3_respiratory_acidosis_acute(pco2)
            
            if compensation == Compensation.NONE:
                hco3 = baseline_hco3
            elif compensation == Compensation.PARTIAL:
                hco3 = (baseline_hco3 + expected_hco3[0]) / 2
            elif compensation == Compensation.APPROPRIATE:
                hco3 = (expected_hco3[0] + expected_hco3[1]) / 2
            else:  # EXCESSIVE
                hco3 = expected_hco3[1] + 4
            
            ph = cls.calculate_ph(hco3, pco2)
        
        elif disorder == Disorder.RESPIRATORY_ALKALOSIS:
            # Start with low pCO2
            if severity == Severity.MILD:
                pco2 = 30.0
            elif severity == Severity.MODERATE:
                pco2 = 24.0
            else:
                pco2 = 18.0
            
            # Calculate expected HCO3 with compensation
            if duration == Duration.CHRONIC:
                expected_hco3 = cls.expected_hco3_respiratory_alkalosis_chronic(pco2)
            else:
                expected_hco3 = cls.expected_hco3_respiratory_alkalosis_acute(pco2)
            
            if compensation == Compensation.NONE:
                hco3 = baseline_hco3
            elif compensation == Compensation.PARTIAL:
                hco3 = (baseline_hco3 + expected_hco3[1]) / 2
            elif compensation == Compensation.APPROPRIATE:
                hco3 = (expected_hco3[0] + expected_hco3[1]) / 2
            else:  # EXCESSIVE
                hco3 = expected_hco3[0] - 2
            
            ph = cls.calculate_ph(hco3, pco2)
        
        else:
            # Fallback to normal
            ph = 7.40
            pco2 = baseline_pco2
            hco3 = baseline_hco3
        
        # Calculate base excess
        base_excess = cls.calculate_base_excess(ph, hco3)
        
        # Assess actual compensation and any secondary disorder
        actual_compensation, secondary = cls.assess_compensation(
            disorder, ph, pco2, hco3, duration
        )
        
        return AcidBaseState(
            ph=ph,
            pco2=pco2,
            hco3=hco3,
            base_excess=base_excess,
            primary_disorder=disorder,
            compensation_status=actual_compensation,
            secondary_disorder=secondary
        )
    
    @classmethod
    def apply_secondary_disorder(
        cls,
        state: AcidBaseState,
        secondary_disorder: Disorder,
        secondary_severity: Severity
    ) -> AcidBaseState:
        """
        Apply a secondary disorder to an existing acid-base state.
        Creates a mixed disorder.
        """
        # Get the effect magnitude based on severity
        if secondary_severity == Severity.MILD:
            effect_magnitude = 0.3
        elif secondary_severity == Severity.MODERATE:
            effect_magnitude = 0.6
        else:
            effect_magnitude = 1.0
        
        new_pco2 = state.pco2
        new_hco3 = state.hco3
        
        if secondary_disorder == Disorder.RESPIRATORY_ACIDOSIS:
            # Add respiratory acidosis - increase pCO2
            new_pco2 = state.pco2 + (20 * effect_magnitude)
        elif secondary_disorder == Disorder.RESPIRATORY_ALKALOSIS:
            # Add respiratory alkalosis - decrease pCO2
            new_pco2 = max(state.pco2 - (15 * effect_magnitude), 15)
        elif secondary_disorder == Disorder.METABOLIC_ACIDOSIS:
            # Add metabolic acidosis - decrease HCO3
            new_hco3 = max(state.hco3 - (10 * effect_magnitude), 6)
        elif secondary_disorder == Disorder.METABOLIC_ALKALOSIS:
            # Add metabolic alkalosis - increase HCO3
            new_hco3 = state.hco3 + (10 * effect_magnitude)
        
        new_ph = cls.calculate_ph(new_hco3, new_pco2)
        new_be = cls.calculate_base_excess(new_ph, new_hco3)
        
        return AcidBaseState(
            ph=new_ph,
            pco2=new_pco2,
            hco3=new_hco3,
            base_excess=new_be,
            primary_disorder=state.primary_disorder,
            compensation_status=Compensation.NONE,  # Mixed disorder
            secondary_disorder=secondary_disorder
        )

