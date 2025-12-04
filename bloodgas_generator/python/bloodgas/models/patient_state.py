"""Patient state and factors modeling."""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from bloodgas.models.disorders import ChronicCondition


@dataclass
class PatientFactors:
    """
    Patient characteristics that modify baseline physiology
    and expected normal ranges.
    """
    
    # Demographics
    age: int = 40
    
    # Chronic conditions that affect baseline
    chronic_conditions: List[ChronicCondition] = field(default_factory=list)
    
    # Baseline values (if known, otherwise calculated from age/conditions)
    baseline_hemoglobin: Optional[float] = None  # g/dL
    baseline_albumin: Optional[float] = None     # g/dL
    baseline_creatinine: Optional[float] = None  # mg/dL
    
    # Environmental factors
    altitude_meters: int = 0  # Affects expected pO2 and baseline pCO2
    
    # Current state modifiers
    temperature_celsius: float = 37.0  # Affects O2-Hb dissociation curve
    is_pregnant: bool = False  # Chronic respiratory alkalosis
    is_mechanically_ventilated: bool = False
    
    def get_expected_aa_gradient(self) -> float:
        """Calculate age-adjusted expected A-a gradient."""
        # Formula: Expected A-a = (Age / 4) + 4
        # Normal range approximately: 2.5 + 0.21 × age
        return (self.age / 4) + 4
    
    def get_expected_pao2(self) -> float:
        """Calculate age-adjusted expected PaO2 on room air at sea level."""
        # Formula: Expected PaO2 = 109 - (0.43 × age)
        # Another common formula: 100 - (age/4)
        expected = 109 - (0.43 * self.age)
        
        # Adjust for altitude (roughly 3mmHg per 300m)
        altitude_adjustment = (self.altitude_meters / 300) * 3
        expected -= altitude_adjustment
        
        return max(expected, 60)  # Floor at 60
    
    def get_baseline_pco2(self) -> float:
        """Get baseline pCO2 considering chronic conditions."""
        baseline = 40.0
        
        # COPD patients may have chronic CO2 retention
        if ChronicCondition.COPD in self.chronic_conditions:
            baseline = 45.0  # Chronic retainers
        
        # Obesity hypoventilation
        if ChronicCondition.OBESITY_HYPOVENTILATION in self.chronic_conditions:
            baseline = 48.0
        
        # Pregnancy causes chronic hyperventilation
        if self.is_pregnant:
            baseline = 32.0
        
        return baseline
    
    def get_baseline_hco3(self) -> float:
        """Get baseline HCO3 considering chronic conditions."""
        baseline = 24.0
        
        # CKD patients often have chronic metabolic acidosis
        if ChronicCondition.CHRONIC_KIDNEY_DISEASE in self.chronic_conditions:
            baseline = 20.0
        
        # COPD with chronic respiratory acidosis has compensatory elevated HCO3
        if ChronicCondition.COPD in self.chronic_conditions:
            baseline = 28.0
        
        # Pregnancy has compensatory lowered HCO3
        if self.is_pregnant:
            baseline = 20.0
        
        return baseline
    
    def get_baseline_hemoglobin(self) -> float:
        """Get baseline hemoglobin."""
        if self.baseline_hemoglobin is not None:
            return self.baseline_hemoglobin
        
        baseline = 14.0  # Default adult
        
        if ChronicCondition.ANEMIA_CHRONIC in self.chronic_conditions:
            baseline = 9.0
        elif ChronicCondition.CHRONIC_KIDNEY_DISEASE in self.chronic_conditions:
            baseline = 10.5  # Anemia of CKD
        
        if self.is_pregnant:
            baseline = 11.5  # Physiological anemia of pregnancy
        
        return baseline
    
    def get_baseline_albumin(self) -> float:
        """Get baseline albumin."""
        if self.baseline_albumin is not None:
            return self.baseline_albumin
        
        baseline = 4.0
        
        if ChronicCondition.CIRRHOSIS in self.chronic_conditions:
            baseline = 2.5
        elif ChronicCondition.CHRONIC_KIDNEY_DISEASE in self.chronic_conditions:
            baseline = 3.2
        
        return baseline
    
    def has_respiratory_baseline_abnormality(self) -> bool:
        """Check if patient has chronic respiratory baseline changes."""
        return (
            ChronicCondition.COPD in self.chronic_conditions or
            ChronicCondition.OBESITY_HYPOVENTILATION in self.chronic_conditions or
            self.is_pregnant
        )
    
    def has_metabolic_baseline_abnormality(self) -> bool:
        """Check if patient has chronic metabolic baseline changes."""
        return (
            ChronicCondition.CHRONIC_KIDNEY_DISEASE in self.chronic_conditions or
            self.is_pregnant
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "age": self.age,
            "chronic_conditions": [c.name for c in self.chronic_conditions],
            "baseline_hemoglobin": self.baseline_hemoglobin,
            "baseline_albumin": self.baseline_albumin,
            "baseline_creatinine": self.baseline_creatinine,
            "altitude_meters": self.altitude_meters,
            "temperature_celsius": self.temperature_celsius,
            "is_pregnant": self.is_pregnant,
            "is_mechanically_ventilated": self.is_mechanically_ventilated,
        }

