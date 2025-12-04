"""
Oxygenation Engine

Implements alveolar gas equation, A-a gradient calculations,
oxygen-hemoglobin dissociation curve, and P/F ratio.
"""

import math
from dataclasses import dataclass
from typing import Tuple, Optional


# Constants
ATMOSPHERIC_PRESSURE_SEA_LEVEL = 760  # mmHg
WATER_VAPOR_PRESSURE = 47  # mmHg at 37°C
RESPIRATORY_QUOTIENT = 0.8  # Typical RQ

# Normal ranges
NORMAL_PAO2 = (80.0, 100.0)
NORMAL_SAO2 = (95.0, 100.0)
NORMAL_AA_GRADIENT_YOUNG = (5.0, 15.0)  # Young adult
NORMAL_PF_RATIO = 400  # Normal >400


@dataclass
class OxygenationState:
    """Represents the oxygenation state."""
    pao2: float  # Arterial PO2 in mmHg
    sao2: float  # Oxygen saturation as percentage
    fio2: float  # Fraction of inspired O2 (0.21-1.0)
    pao2_fio2_ratio: float  # P/F ratio
    aa_gradient: float  # A-a gradient in mmHg
    expected_aa_gradient: float  # Age-adjusted expected A-a gradient
    pao2_normal: bool
    aa_gradient_elevated: bool


class OxygenationEngine:
    """
    Engine for oxygenation calculations.
    
    Implements:
    - Alveolar gas equation
    - A-a gradient
    - O2-Hb dissociation curve
    - P/F ratio (Berlin criteria for ARDS)
    """
    
    @classmethod
    def calculate_alveolar_po2(
        cls,
        fio2: float,
        paco2: float,
        atmospheric_pressure: float = ATMOSPHERIC_PRESSURE_SEA_LEVEL,
        rq: float = RESPIRATORY_QUOTIENT
    ) -> float:
        """
        Calculate alveolar PO2 using the alveolar gas equation.
        
        PAO2 = FiO2 × (Patm - PH2O) - (PaCO2 / RQ)
        
        Simplified: PAO2 = FiO2 × (Patm - 47) - (PaCO2 × 1.25)
        """
        # Inspired PO2
        pio2 = fio2 * (atmospheric_pressure - WATER_VAPOR_PRESSURE)
        
        # Alveolar PO2
        pao2 = pio2 - (paco2 / rq)
        
        return pao2
    
    @classmethod
    def calculate_aa_gradient(
        cls,
        pao2_arterial: float,
        paco2: float,
        fio2: float,
        atmospheric_pressure: float = ATMOSPHERIC_PRESSURE_SEA_LEVEL
    ) -> float:
        """
        Calculate the A-a (alveolar-arterial) gradient.
        
        A-a gradient = PAO2 (alveolar) - PaO2 (arterial)
        
        An elevated A-a gradient indicates:
        - V/Q mismatch
        - Shunt
        - Diffusion impairment
        """
        pao2_alveolar = cls.calculate_alveolar_po2(fio2, paco2, atmospheric_pressure)
        return pao2_alveolar - pao2_arterial
    
    @classmethod
    def expected_aa_gradient(cls, age: int) -> float:
        """
        Calculate age-adjusted expected A-a gradient.
        
        Formula: Expected A-a gradient = (Age / 4) + 4
        
        Alternative: 2.5 + (0.21 × age)
        
        Normal upper limit approximately: Age/4 + 4 (some use Age/3 + 3)
        """
        return (age / 4) + 4
    
    @classmethod
    def is_aa_gradient_elevated(cls, aa_gradient: float, age: int) -> bool:
        """Check if A-a gradient is elevated for patient's age."""
        expected = cls.expected_aa_gradient(age)
        # Generally allow ~5 mmHg above expected as normal variation
        return aa_gradient > (expected + 5)
    
    @classmethod
    def calculate_pf_ratio(cls, pao2: float, fio2: float) -> float:
        """
        Calculate P/F ratio (PaO2/FiO2).
        
        Used for ARDS classification (Berlin criteria):
        - Normal: > 400
        - Mild ARDS: 200-300
        - Moderate ARDS: 100-200
        - Severe ARDS: < 100
        """
        if fio2 <= 0:
            raise ValueError("FiO2 must be positive")
        return pao2 / fio2
    
    @classmethod
    def classify_ards(cls, pf_ratio: float) -> str:
        """
        Classify ARDS severity based on P/F ratio (Berlin criteria).
        Assumes PEEP ≥ 5 cmH2O and bilateral infiltrates.
        """
        if pf_ratio >= 300:
            return "None/Normal"
        elif pf_ratio >= 200:
            return "Mild ARDS"
        elif pf_ratio >= 100:
            return "Moderate ARDS"
        else:
            return "Severe ARDS"
    
    @classmethod
    def calculate_sao2(
        cls,
        pao2: float,
        ph: float = 7.40,
        temperature: float = 37.0,
        pco2: float = 40.0,
        dpg_2_3: float = 1.0  # Relative 2,3-DPG level (1.0 = normal)
    ) -> float:
        """
        Calculate oxygen saturation from PaO2 using the
        oxygen-hemoglobin dissociation curve.
        
        Uses the Hill equation approximation with Severinghaus corrections
        for pH, temperature, and 2,3-DPG shifts.
        
        The curve is sigmoidal with P50 (PO2 at 50% saturation) normally ~27 mmHg.
        """
        # Calculate effective P50 considering curve shifts
        p50 = cls.calculate_p50(ph, temperature, pco2, dpg_2_3)
        
        # Hill equation: SO2 = PO2^n / (P50^n + PO2^n)
        # n (Hill coefficient) is approximately 2.7 for hemoglobin
        n = 2.7
        
        if pao2 <= 0:
            return 0.0
        
        sao2 = 100 * (pao2 ** n) / ((p50 ** n) + (pao2 ** n))
        
        # Clamp to physiological range
        return min(max(sao2, 0), 100)
    
    @classmethod
    def calculate_p50(
        cls,
        ph: float = 7.40,
        temperature: float = 37.0,
        pco2: float = 40.0,
        dpg_2_3: float = 1.0
    ) -> float:
        """
        Calculate P50 (PO2 at 50% saturation) accounting for
        shifts in the oxygen-hemoglobin dissociation curve.
        
        Normal P50 = 27 mmHg
        
        Right shift (decreased affinity, higher P50):
        - Decreased pH (Bohr effect)
        - Increased temperature
        - Increased 2,3-DPG
        - Increased CO2
        
        Left shift (increased affinity, lower P50):
        - Increased pH
        - Decreased temperature
        - Decreased 2,3-DPG
        - CO poisoning, fetal Hb
        """
        base_p50 = 27.0  # Normal P50
        
        # pH effect (Bohr effect) - approximately 0.5 mmHg per 0.01 pH unit
        ph_effect = (7.40 - ph) * 5.0  # Positive = right shift
        
        # Temperature effect - approximately 1.5 mmHg per degree C
        temp_effect = (temperature - 37.0) * 1.5
        
        # CO2 effect (part of Bohr effect) - small direct effect
        co2_effect = (pco2 - 40.0) * 0.05
        
        # 2,3-DPG effect
        dpg_effect = (dpg_2_3 - 1.0) * 5.0
        
        p50 = base_p50 + ph_effect + temp_effect + co2_effect + dpg_effect
        
        # Clamp to reasonable range
        return max(min(p50, 40), 15)
    
    @classmethod
    def calculate_pao2_from_sao2(
        cls,
        sao2: float,
        ph: float = 7.40,
        temperature: float = 37.0
    ) -> float:
        """
        Estimate PaO2 from SaO2 (reverse of dissociation curve).
        
        Uses the inverse Hill equation.
        """
        if sao2 >= 100:
            return 150.0  # Very high PO2
        if sao2 <= 0:
            return 0.0
        
        p50 = cls.calculate_p50(ph, temperature)
        n = 2.7
        
        # Inverse Hill equation: PO2 = P50 × (SO2 / (100 - SO2))^(1/n)
        fraction = sao2 / (100 - sao2)
        pao2 = p50 * (fraction ** (1/n))
        
        return pao2
    
    @classmethod
    def generate_oxygenation(
        cls,
        fio2: float = 0.21,
        paco2: float = 40.0,
        age: int = 40,
        aa_gradient_elevated: bool = False,
        target_aa_gradient: Optional[float] = None,
        shunt_fraction: float = 0.0,  # 0-1, fraction of blood bypassing lungs
        ph: float = 7.40,
        temperature: float = 37.0,
        atmospheric_pressure: float = ATMOSPHERIC_PRESSURE_SEA_LEVEL
    ) -> OxygenationState:
        """
        Generate oxygenation values based on parameters.
        
        This is the primary generation method for oxygenation.
        """
        # Calculate expected A-a gradient for this age
        expected_aa = cls.expected_aa_gradient(age)
        
        # Determine actual A-a gradient
        if target_aa_gradient is not None:
            aa_gradient = target_aa_gradient
        elif aa_gradient_elevated:
            # Generate an elevated A-a gradient (pathological)
            aa_gradient = expected_aa + 20  # Significantly elevated
        else:
            # Normal A-a gradient
            aa_gradient = expected_aa
        
        # Calculate alveolar PO2
        pao2_alveolar = cls.calculate_alveolar_po2(fio2, paco2, atmospheric_pressure)
        
        # Calculate arterial PO2 from A-a gradient
        pao2 = pao2_alveolar - aa_gradient
        
        # Apply shunt effect if present
        if shunt_fraction > 0:
            # Shunt doesn't respond well to supplemental O2
            # Simplified model: reduce effective PaO2 based on shunt fraction
            venous_po2 = 40.0  # Approximate mixed venous PO2
            pao2 = pao2 * (1 - shunt_fraction) + venous_po2 * shunt_fraction
        
        # Ensure PaO2 is physiologically possible
        pao2 = max(pao2, 30)  # Floor at 30 mmHg (near-death severe hypoxemia)
        
        # Calculate SaO2
        sao2 = cls.calculate_sao2(pao2, ph, temperature, paco2)
        
        # Calculate P/F ratio
        pf_ratio = cls.calculate_pf_ratio(pao2, fio2)
        
        # Determine if values are normal
        pao2_normal = pao2 >= NORMAL_PAO2[0] * (fio2 / 0.21)  # Adjust for FiO2
        
        return OxygenationState(
            pao2=pao2,
            sao2=sao2,
            fio2=fio2,
            pao2_fio2_ratio=pf_ratio,
            aa_gradient=aa_gradient,
            expected_aa_gradient=expected_aa,
            pao2_normal=pao2_normal,
            aa_gradient_elevated=aa_gradient > expected_aa + 5
        )
    
    @classmethod
    def describe_hypoxemia_mechanism(
        cls,
        aa_gradient_elevated: bool,
        paco2: float,
        responds_to_o2: bool = True
    ) -> str:
        """
        Describe the likely mechanism of hypoxemia based on findings.
        """
        if not aa_gradient_elevated:
            if paco2 > 45:
                return "Hypoventilation (normal A-a gradient, elevated pCO2)"
            else:
                return "Low inspired oxygen or altitude (normal A-a gradient, normal pCO2)"
        else:
            if responds_to_o2:
                return "V/Q mismatch or diffusion impairment (elevated A-a gradient, responds to O2)"
            else:
                return "Shunt (elevated A-a gradient, does not respond to O2)"
    
    @classmethod
    def calculate_oxygen_content(
        cls,
        pao2: float,
        sao2: float,
        hemoglobin: float
    ) -> float:
        """
        Calculate oxygen content of blood (CaO2).
        
        CaO2 = (Hb × 1.34 × SaO2/100) + (0.003 × PaO2)
        
        Units: mL O2 per dL blood
        """
        # Bound oxygen (to hemoglobin)
        bound = hemoglobin * 1.34 * (sao2 / 100)
        
        # Dissolved oxygen
        dissolved = 0.003 * pao2
        
        return bound + dissolved

