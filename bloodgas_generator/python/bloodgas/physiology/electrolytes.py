"""
Electrolyte Engine

Implements anion gap calculations, delta-delta analysis,
osmolar gap, and electrolyte interactions.
"""

from dataclasses import dataclass
from typing import Optional, Tuple, List
from enum import Enum


# Normal ranges
NORMAL_SODIUM = (136.0, 145.0)
NORMAL_POTASSIUM = (3.5, 5.0)
NORMAL_CHLORIDE = (98.0, 106.0)
NORMAL_GLUCOSE = (70.0, 100.0)
NORMAL_LACTATE = (0.5, 2.0)
NORMAL_ALBUMIN = (3.5, 5.0)
NORMAL_ANION_GAP = (8.0, 12.0)  # Without K+
NORMAL_OSMOLALITY = (280.0, 295.0)


class AnionGapCategory(Enum):
    """Categorization of anion gap disorders."""
    NORMAL = "normal"
    ELEVATED = "elevated"
    LOW = "low"


@dataclass
class ElectrolyteState:
    """Represents the electrolyte state."""
    sodium: float
    potassium: float
    chloride: float
    glucose: float
    lactate: float
    albumin: float
    
    # Calculated values
    anion_gap: float
    corrected_anion_gap: float  # Albumin-corrected
    delta_gap: float
    delta_ratio: float  # Delta-delta ratio
    
    # Analysis
    anion_gap_category: AnionGapCategory
    has_hidden_non_gap_acidosis: bool
    has_hidden_metabolic_alkalosis: bool
    
    # Osmolality
    calculated_osmolality: float
    osmolar_gap: Optional[float] = None  # If measured osmolality provided


class ElectrolyteEngine:
    """
    Engine for electrolyte calculations and anion gap analysis.
    
    Key calculations:
    - Anion gap (AG) = Na - (Cl + HCO3)
    - Albumin-corrected AG = AG + 2.5 × (4 - albumin)
    - Delta gap = AG - 12 (normal AG)
    - Delta-delta ratio = Delta AG / Delta HCO3
    """
    
    @classmethod
    def calculate_anion_gap(
        cls,
        sodium: float,
        chloride: float,
        hco3: float,
        include_potassium: bool = False,
        potassium: float = 4.0
    ) -> float:
        """
        Calculate the anion gap.
        
        AG = Na - (Cl + HCO3)
        
        If including K+: AG = (Na + K) - (Cl + HCO3)
        Normal AG: 8-12 mEq/L (without K+), 12-16 mEq/L (with K+)
        """
        if include_potassium:
            return (sodium + potassium) - (chloride + hco3)
        return sodium - (chloride + hco3)
    
    @classmethod
    def correct_anion_gap_for_albumin(
        cls,
        anion_gap: float,
        albumin: float,
        normal_albumin: float = 4.0
    ) -> float:
        """
        Correct anion gap for low albumin.
        
        Corrected AG = AG + 2.5 × (4 - albumin)
        
        Each 1 g/dL decrease in albumin decreases AG by ~2.5 mEq/L
        (albumin is the major unmeasured anion)
        """
        correction = 2.5 * (normal_albumin - albumin)
        return anion_gap + correction
    
    @classmethod
    def calculate_delta_gap(cls, anion_gap: float, normal_ag: float = 12.0) -> float:
        """
        Calculate the delta gap (excess anion gap).
        
        Delta gap = Observed AG - Normal AG
        
        Represents the amount of unmeasured anions accumulating.
        """
        return anion_gap - normal_ag
    
    @classmethod
    def calculate_delta_ratio(
        cls,
        anion_gap: float,
        hco3: float,
        normal_ag: float = 12.0,
        normal_hco3: float = 24.0
    ) -> float:
        """
        Calculate the delta-delta ratio (delta gap / delta HCO3).
        
        Delta ratio = (AG - normal AG) / (normal HCO3 - HCO3)
        
        Interpretation:
        - < 1: Non-anion gap acidosis also present
        - 1-2: Pure high anion gap metabolic acidosis
        - > 2: Metabolic alkalosis also present OR chronic respiratory acidosis
        """
        delta_ag = anion_gap - normal_ag
        delta_hco3 = normal_hco3 - hco3
        
        if delta_hco3 <= 0:
            # HCO3 is normal or high - can't calculate meaningful ratio
            if delta_ag > 4:  # Significant AG elevation
                return float('inf')  # Indicates metabolic alkalosis
            return 1.0
        
        return delta_ag / delta_hco3
    
    @classmethod
    def analyze_delta_ratio(cls, delta_ratio: float) -> Tuple[bool, bool]:
        """
        Analyze delta-delta ratio for hidden disorders.
        
        Returns: (has_hidden_non_gap_acidosis, has_hidden_metabolic_alkalosis)
        """
        has_non_gap = delta_ratio < 1.0
        has_met_alk = delta_ratio > 2.0
        return (has_non_gap, has_met_alk)
    
    @classmethod
    def calculate_osmolality(
        cls,
        sodium: float,
        glucose: float,  # mg/dL
        bun: float = 14.0  # mg/dL, default normal
    ) -> float:
        """
        Calculate serum osmolality.
        
        Calculated Osm = 2×Na + Glucose/18 + BUN/2.8
        
        Normal: 280-295 mOsm/kg
        """
        return (2 * sodium) + (glucose / 18) + (bun / 2.8)
    
    @classmethod
    def calculate_osmolar_gap(
        cls,
        measured_osmolality: float,
        sodium: float,
        glucose: float,
        bun: float = 14.0
    ) -> float:
        """
        Calculate osmolar gap.
        
        Osmolar gap = Measured Osm - Calculated Osm
        
        Normal: < 10 mOsm/kg
        
        Elevated in:
        - Methanol poisoning
        - Ethylene glycol poisoning
        - Ethanol intoxication
        - Isopropyl alcohol
        - Propylene glycol
        """
        calculated = cls.calculate_osmolality(sodium, glucose, bun)
        return measured_osmolality - calculated
    
    @classmethod
    def correct_sodium_for_glucose(
        cls,
        sodium: float,
        glucose: float,
        normal_glucose: float = 100.0
    ) -> float:
        """
        Correct sodium for hyperglycemia.
        
        For every 100 mg/dL increase in glucose above 100,
        sodium decreases by ~1.6-2.4 mEq/L (dilutional effect).
        
        Corrected Na = Measured Na + 1.6 × ((Glucose - 100) / 100)
        
        More recent formula uses 2.4 for glucose > 400.
        """
        if glucose <= normal_glucose:
            return sodium
        
        glucose_elevation = glucose - normal_glucose
        
        # Use 1.6 for moderate hyperglycemia, 2.4 for severe
        if glucose > 400:
            correction_factor = 2.4
        else:
            correction_factor = 1.6
        
        correction = correction_factor * (glucose_elevation / 100)
        return sodium + correction
    
    @classmethod
    def calculate_corrected_potassium(
        cls,
        potassium: float,
        ph: float,
        normal_ph: float = 7.40
    ) -> float:
        """
        Estimate what potassium would be at normal pH.
        
        For every 0.1 decrease in pH, K+ increases ~0.6 mEq/L
        (H+ enters cells, K+ exits to maintain electroneutrality)
        
        This helps identify true total body potassium status.
        """
        ph_change = normal_ph - ph
        k_shift = ph_change * 6  # 0.6 per 0.1 pH unit
        return potassium - k_shift
    
    @classmethod
    def generate_electrolytes(
        cls,
        hco3: float,
        ph: float = 7.40,
        # Anion gap parameters
        elevated_anion_gap: bool = False,
        target_anion_gap: Optional[float] = None,
        anion_gap_cause: Optional[str] = None,
        # Individual electrolyte targets
        sodium_target: Optional[float] = None,
        potassium_target: Optional[float] = None,
        chloride_target: Optional[float] = None,
        glucose_target: Optional[float] = None,
        lactate_target: Optional[float] = None,
        albumin: float = 4.0,
    ) -> ElectrolyteState:
        """
        Generate electrolyte values based on parameters.
        
        This is the primary generation method for electrolytes.
        """
        # Default values
        sodium = sodium_target if sodium_target else 140.0
        potassium = potassium_target if potassium_target else 4.0
        glucose = glucose_target if glucose_target else 95.0
        lactate = lactate_target if lactate_target else 1.0
        
        # Calculate anion gap and chloride
        if target_anion_gap is not None:
            anion_gap = target_anion_gap
        elif elevated_anion_gap:
            # Generate elevated AG based on cause
            if anion_gap_cause == "dka":
                anion_gap = 24.0  # Typical DKA
            elif anion_gap_cause == "lactic":
                anion_gap = 20.0  # Lactic acidosis
            elif anion_gap_cause == "renal":
                anion_gap = 18.0  # Renal failure
            elif anion_gap_cause == "toxic":
                anion_gap = 28.0  # Toxic ingestion
            else:
                anion_gap = 22.0  # Generic elevation
        else:
            anion_gap = 10.0  # Normal
        
        # Calculate chloride from anion gap equation: Cl = Na - AG - HCO3
        if chloride_target is not None:
            chloride = chloride_target
            # Recalculate actual AG
            anion_gap = sodium - (chloride + hco3)
        else:
            chloride = sodium - anion_gap - hco3
            # Ensure chloride is in reasonable range
            chloride = max(min(chloride, 120), 85)
        
        # Correct anion gap for albumin
        corrected_ag = cls.correct_anion_gap_for_albumin(anion_gap, albumin)
        
        # Calculate delta values
        delta_gap = cls.calculate_delta_gap(corrected_ag)
        delta_ratio = cls.calculate_delta_ratio(corrected_ag, hco3)
        
        # Analyze for hidden disorders
        has_non_gap, has_met_alk = cls.analyze_delta_ratio(delta_ratio)
        
        # Categorize anion gap
        if corrected_ag > 14:
            ag_category = AnionGapCategory.ELEVATED
        elif corrected_ag < 6:
            ag_category = AnionGapCategory.LOW
        else:
            ag_category = AnionGapCategory.NORMAL
        
        # Calculate osmolality
        calc_osm = cls.calculate_osmolality(sodium, glucose)
        
        return ElectrolyteState(
            sodium=sodium,
            potassium=potassium,
            chloride=chloride,
            glucose=glucose,
            lactate=lactate,
            albumin=albumin,
            anion_gap=anion_gap,
            corrected_anion_gap=corrected_ag,
            delta_gap=delta_gap,
            delta_ratio=delta_ratio,
            anion_gap_category=ag_category,
            has_hidden_non_gap_acidosis=has_non_gap,
            has_hidden_metabolic_alkalosis=has_met_alk,
            calculated_osmolality=calc_osm
        )
    
    @classmethod
    def get_anion_gap_causes(cls, elevated: bool = True) -> List[str]:
        """
        Get common causes of elevated or low anion gap.
        """
        if elevated:
            return [
                "MUDPILES mnemonic:",
                "- Methanol",
                "- Uremia (renal failure)",
                "- DKA/Diabetic ketoacidosis",
                "- Propylene glycol",
                "- INH/Iron/Isoniazid",
                "- Lactic acidosis",
                "- Ethylene glycol",
                "- Salicylates",
                "",
                "Also: Alcoholic ketoacidosis, starvation ketosis"
            ]
        else:
            return [
                "Low anion gap causes:",
                "- Hypoalbuminemia (most common)",
                "- Multiple myeloma (cationic paraproteins)",
                "- Lithium toxicity",
                "- Severe hypercalcemia",
                "- Severe hypermagnesemia",
                "- Laboratory error"
            ]
    
    @classmethod
    def interpret_electrolytes(cls, state: ElectrolyteState, hco3: float) -> List[str]:
        """
        Generate interpretation points for electrolyte analysis.
        """
        points = []
        
        # Anion gap analysis
        if state.anion_gap_category == AnionGapCategory.ELEVATED:
            points.append(f"Elevated anion gap ({state.corrected_anion_gap:.0f} mEq/L) - "
                         "suggests accumulation of unmeasured anions")
            
            if state.lactate > 4:
                points.append(f"Elevated lactate ({state.lactate:.1f} mmol/L) - "
                             "lactic acidosis contributing to AG")
        
        # Delta-delta analysis
        if state.has_hidden_non_gap_acidosis:
            points.append("Delta ratio < 1 suggests concurrent non-anion gap acidosis "
                         "(hyperchloremic acidosis)")
        
        if state.has_hidden_metabolic_alkalosis:
            points.append("Delta ratio > 2 suggests concurrent metabolic alkalosis "
                         "or pre-existing elevated HCO3")
        
        # Sodium analysis
        if state.sodium < NORMAL_SODIUM[0]:
            if state.glucose > 200:
                corrected_na = cls.correct_sodium_for_glucose(state.sodium, state.glucose)
                points.append(f"Hyponatremia - corrected for hyperglycemia: {corrected_na:.0f} mEq/L")
            else:
                points.append(f"Hyponatremia ({state.sodium:.0f} mEq/L)")
        elif state.sodium > NORMAL_SODIUM[1]:
            points.append(f"Hypernatremia ({state.sodium:.0f} mEq/L)")
        
        # Potassium analysis
        if state.potassium < NORMAL_POTASSIUM[0]:
            points.append(f"Hypokalemia ({state.potassium:.1f} mEq/L)")
        elif state.potassium > NORMAL_POTASSIUM[1]:
            points.append(f"Hyperkalemia ({state.potassium:.1f} mEq/L)")
        
        # Glucose analysis
        if state.glucose > 250:
            points.append(f"Significant hyperglycemia ({state.glucose:.0f} mg/dL)")
        
        return points

