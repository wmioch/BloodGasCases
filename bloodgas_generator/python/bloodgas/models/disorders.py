"""Disorder and condition type definitions."""

from enum import Enum, auto
from typing import Dict, List, Optional
from dataclasses import dataclass


class Disorder(Enum):
    """Primary acid-base disorder types."""
    NORMAL = auto()
    METABOLIC_ACIDOSIS = auto()
    METABOLIC_ALKALOSIS = auto()
    RESPIRATORY_ACIDOSIS = auto()
    RESPIRATORY_ALKALOSIS = auto()


class Severity(Enum):
    """Severity levels for disorders and conditions."""
    MILD = auto()      # pH 7.30-7.35 or 7.45-7.50
    MODERATE = auto()  # pH 7.20-7.30 or 7.50-7.55
    SEVERE = auto()    # pH < 7.20 or > 7.55


class Compensation(Enum):
    """Compensation status for acid-base disorders."""
    NONE = auto()           # Acute, no compensation yet
    PARTIAL = auto()        # Some compensation present
    APPROPRIATE = auto()    # Expected compensation for disorder
    EXCESSIVE = auto()      # More compensation than expected (mixed disorder)


class Duration(Enum):
    """Duration of condition affecting compensation."""
    ACUTE = auto()      # Hours - minimal renal/respiratory compensation
    SUBACUTE = auto()   # Days - partial compensation
    CHRONIC = auto()    # Weeks+ - full compensation achieved


class ClinicalCondition(Enum):
    """Clinical conditions that drive blood gas abnormalities."""
    # Respiratory conditions
    COPD_EXACERBATION = auto()
    ASTHMA_ATTACK = auto()
    PULMONARY_EMBOLISM = auto()
    ARDS = auto()
    PNEUMONIA = auto()
    OPIOID_OVERDOSE = auto()
    HYPERVENTILATION_ANXIETY = auto()
    HYPERVENTILATION_PAIN = auto()
    NEUROMUSCULAR_WEAKNESS = auto()
    
    # Metabolic acidosis - high anion gap
    DKA = auto()
    HHS = auto()  # Hyperosmolar hyperglycemic state
    LACTIC_ACIDOSIS_SEPSIS = auto()
    LACTIC_ACIDOSIS_SHOCK = auto()
    LACTIC_ACIDOSIS_SEIZURE = auto()
    RENAL_FAILURE_ACUTE = auto()
    RENAL_FAILURE_CHRONIC = auto()
    TOXIC_INGESTION_METHANOL = auto()
    TOXIC_INGESTION_ETHYLENE_GLYCOL = auto()
    TOXIC_INGESTION_SALICYLATE = auto()
    STARVATION_KETOSIS = auto()
    ALCOHOLIC_KETOACIDOSIS = auto()
    
    # Metabolic acidosis - normal anion gap
    DIARRHEA = auto()
    RTA_TYPE1 = auto()  # Distal
    RTA_TYPE2 = auto()  # Proximal
    RTA_TYPE4 = auto()  # Hypoaldosteronism
    SALINE_INFUSION = auto()  # Dilutional acidosis
    
    # Metabolic alkalosis
    VOMITING = auto()
    NG_SUCTION = auto()
    DIURETIC_USE = auto()
    HYPOKALEMIA = auto()
    HYPERALDOSTERONISM = auto()
    MILK_ALKALI_SYNDROME = auto()
    POST_HYPERCAPNIA = auto()
    
    # Normal/physiological variants
    HEALTHY = auto()
    PREGNANCY = auto()
    HIGH_ALTITUDE = auto()


class ChronicCondition(Enum):
    """Chronic conditions that modify baseline physiology."""
    TYPE1_DIABETES = auto()
    TYPE2_DIABETES = auto()
    COPD = auto()
    CHRONIC_KIDNEY_DISEASE = auto()
    HEART_FAILURE = auto()
    CIRRHOSIS = auto()
    OBESITY_HYPOVENTILATION = auto()
    ANEMIA_CHRONIC = auto()


@dataclass
class ConditionEffect:
    """
    Defines the physiological effects of a clinical condition.
    Used by the scenario mapper to generate appropriate blood gas values.
    """
    # Primary acid-base effect
    primary_disorder: Disorder
    
    # Severity ranges for this condition (min, typical, max)
    ph_range: tuple[float, float, float]
    
    # Direct effects on values (deltas from normal or absolute ranges)
    pco2_effect: tuple[float, float]  # (min_delta, max_delta) from normal
    hco3_effect: tuple[float, float]  # (min_delta, max_delta) from normal
    
    # Oxygenation effects - now pathology-based for realistic FiO2 response
    po2_effect: tuple[float, float]  # (min, max) room air pO2 baseline for reference
    aa_gradient_elevated: bool = False
    # A-a gradient range in mmHg: (mild, severe) - normal is ~10-15 for young adult
    aa_gradient_range: tuple[float, float] = (10.0, 15.0)
    # Shunt fraction range (0-1): (mild, severe) - represents true shunt that doesn't respond to O2
    shunt_fraction_range: tuple[float, float] = (0.0, 0.0)
    
    # Anion gap effects
    anion_gap_elevated: bool = False
    typical_anion_gap: tuple[float, float] = (8, 12)
    
    # Electrolyte effects
    sodium_effect: tuple[float, float] = (-2, 2)
    potassium_effect: tuple[float, float] = (-0.3, 0.3)
    chloride_effect: tuple[float, float] = (-2, 2)
    glucose_effect: tuple[float, float] = (70, 110)
    lactate_effect: tuple[float, float] = (0.5, 2.0)
    
    # Compensation characteristics
    expected_compensation: Compensation = Compensation.APPROPRIATE
    compensation_blocked: bool = False  # e.g., opioids block respiratory compensation
    
    # Interaction flags
    affects_respiratory_drive: bool = False
    respiratory_drive_multiplier: float = 1.0  # <1 = depressed, >1 = stimulated
    
    # Description for interpretation
    description: str = ""
    teaching_points: List[str] = None
    
    def __post_init__(self):
        if self.teaching_points is None:
            self.teaching_points = []

