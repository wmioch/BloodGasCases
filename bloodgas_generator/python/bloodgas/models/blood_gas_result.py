"""Blood gas result dataclasses."""

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
from enum import Enum
import json


class InterpretationSeverity(Enum):
    """Severity classification for clinical interpretation."""
    NORMAL = "normal"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    CRITICAL = "critical"


@dataclass
class ClinicalInterpretation:
    """Clinical interpretation of blood gas results."""
    
    # Primary interpretation
    primary_disorder: str
    primary_disorder_description: str
    
    # Compensation assessment
    compensation_status: str
    compensation_description: str
    
    # Secondary/mixed disorder if present
    secondary_disorder: Optional[str] = None
    secondary_disorder_description: Optional[str] = None
    
    # Oxygenation assessment
    oxygenation_status: str = "normal"
    oxygenation_description: str = ""
    
    # Anion gap analysis
    anion_gap_status: str = "normal"
    anion_gap_description: str = ""
    delta_delta_analysis: Optional[str] = None
    
    # Overall severity
    severity: InterpretationSeverity = InterpretationSeverity.NORMAL
    
    # Clinical implications
    clinical_implications: List[str] = field(default_factory=list)
    
    # Teaching points for education
    teaching_points: List[str] = field(default_factory=list)
    
    # Conditions that generated this result
    generating_conditions: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result['severity'] = self.severity.value
        return result
    
    def to_text(self) -> str:
        """Generate human-readable interpretation text."""
        lines = []
        
        # Primary disorder
        lines.append(f"PRIMARY DISORDER: {self.primary_disorder}")
        lines.append(f"  {self.primary_disorder_description}")
        
        # Compensation
        lines.append(f"\nCOMPENSATION: {self.compensation_status}")
        lines.append(f"  {self.compensation_description}")
        
        # Secondary disorder if present
        if self.secondary_disorder:
            lines.append(f"\nSECONDARY DISORDER: {self.secondary_disorder}")
            lines.append(f"  {self.secondary_disorder_description}")
        
        # Oxygenation
        if self.oxygenation_status != "normal":
            lines.append(f"\nOXYGENATION: {self.oxygenation_status}")
            lines.append(f"  {self.oxygenation_description}")
        
        # Anion gap
        if self.anion_gap_status != "normal":
            lines.append(f"\nANION GAP: {self.anion_gap_status}")
            lines.append(f"  {self.anion_gap_description}")
            if self.delta_delta_analysis:
                lines.append(f"  Delta-delta: {self.delta_delta_analysis}")
        
        # Clinical implications
        if self.clinical_implications:
            lines.append("\nCLINICAL IMPLICATIONS:")
            for impl in self.clinical_implications:
                lines.append(f"  • {impl}")
        
        # Teaching points
        if self.teaching_points:
            lines.append("\nTEACHING POINTS:")
            for point in self.teaching_points:
                lines.append(f"  • {point}")
        
        return "\n".join(lines)


@dataclass
class GenerationParams:
    """Parameters used to generate the blood gas result."""
    
    # Generation mode
    mode: str  # "disorder" or "scenario"
    
    # Disorder-based params
    primary_disorder: Optional[str] = None
    secondary_disorder: Optional[str] = None
    specified_compensation: Optional[str] = None
    
    # Scenario-based params
    conditions: List[str] = field(default_factory=list)
    condition_severities: Dict[str, str] = field(default_factory=dict)
    
    # Patient factors
    patient_age: Optional[int] = None
    chronic_conditions: List[str] = field(default_factory=list)
    
    # Environment
    fio2: float = 0.21
    altitude_meters: int = 0
    
    # Random seed for reproducibility
    seed: Optional[int] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return asdict(self)


@dataclass
class BloodGasResult:
    """Complete blood gas result with all parameters and interpretation."""
    
    # Core ABG values
    ph: float
    pco2: float  # mmHg
    po2: float   # mmHg
    hco3: float  # mEq/L (calculated or measured)
    base_excess: float  # mEq/L
    sao2: float  # percentage (0-100)
    
    # Oxygenation parameters
    fio2: float  # fraction (0.21-1.0)
    pao2_fio2_ratio: float  # P/F ratio
    aa_gradient: float  # A-a gradient in mmHg
    expected_aa_gradient: float  # Age-adjusted expected A-a gradient
    
    # Electrolytes
    sodium: float  # mEq/L
    potassium: float  # mEq/L
    chloride: float  # mEq/L
    glucose: float  # mg/dL
    
    # Calculated values
    anion_gap: float  # mEq/L
    corrected_anion_gap: float  # Albumin-corrected anion gap
    delta_gap: float  # For mixed disorder analysis
    lactate: float  # mmol/L
    hemoglobin: float  # g/dL
    
    # Additional calculated values
    albumin: float = 4.0  # g/dL (for anion gap correction)
    
    # Interpretation and metadata
    interpretation: ClinicalInterpretation = None
    generation_params: GenerationParams = None
    
    def __post_init__(self):
        """Ensure interpretation exists."""
        if self.interpretation is None:
            self.interpretation = ClinicalInterpretation(
                primary_disorder="Unknown",
                primary_disorder_description="Not interpreted",
                compensation_status="Unknown",
                compensation_description="Not assessed"
            )
        if self.generation_params is None:
            self.generation_params = GenerationParams(mode="unknown")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = {
            # Core ABG
            "ph": round(self.ph, 3),
            "pco2": round(self.pco2, 1),
            "po2": round(self.po2, 1),
            "hco3": round(self.hco3, 1),
            "base_excess": round(self.base_excess, 1),
            "sao2": round(self.sao2, 1),
            
            # Oxygenation
            "fio2": round(self.fio2, 2),
            "pao2_fio2_ratio": round(self.pao2_fio2_ratio, 0),
            "aa_gradient": round(self.aa_gradient, 1),
            "expected_aa_gradient": round(self.expected_aa_gradient, 1),
            
            # Electrolytes
            "sodium": round(self.sodium, 0),
            "potassium": round(self.potassium, 1),
            "chloride": round(self.chloride, 0),
            "glucose": round(self.glucose, 0),
            
            # Calculated
            "anion_gap": round(self.anion_gap, 1),
            "corrected_anion_gap": round(self.corrected_anion_gap, 1),
            "delta_gap": round(self.delta_gap, 1),
            "lactate": round(self.lactate, 1),
            "hemoglobin": round(self.hemoglobin, 1),
            "albumin": round(self.albumin, 1),
            
            # Metadata
            "interpretation": self.interpretation.to_dict() if self.interpretation else None,
            "generation_params": self.generation_params.to_dict() if self.generation_params else None,
        }
        return result
    
    def to_json(self, indent: int = 2) -> str:
        """Convert to JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "BloodGasResult":
        """Create BloodGasResult from dictionary."""
        # Extract nested objects
        interp_data = data.pop("interpretation", None)
        params_data = data.pop("generation_params", None)
        
        # Create interpretation if present
        interpretation = None
        if interp_data:
            severity_str = interp_data.pop("severity", "normal")
            interp_data["severity"] = InterpretationSeverity(severity_str)
            interpretation = ClinicalInterpretation(**interp_data)
        
        # Create generation params if present
        generation_params = None
        if params_data:
            generation_params = GenerationParams(**params_data)
        
        return cls(
            **data,
            interpretation=interpretation,
            generation_params=generation_params
        )
    
    def summary(self) -> str:
        """Generate a concise summary of the blood gas."""
        lines = [
            "═" * 50,
            "ARTERIAL BLOOD GAS RESULTS",
            "═" * 50,
            f"  pH:     {self.ph:.2f}     (7.35-7.45)",
            f"  pCO2:   {self.pco2:.0f} mmHg  (35-45)",
            f"  pO2:    {self.po2:.0f} mmHg  (80-100)",
            f"  HCO3:   {self.hco3:.0f} mEq/L (22-26)",
            f"  BE:     {self.base_excess:+.0f} mEq/L (-2 to +2)",
            f"  SaO2:   {self.sao2:.0f}%     (95-100%)",
            "─" * 50,
            f"  FiO2:   {self.fio2:.0%}",
            f"  P/F:    {self.pao2_fio2_ratio:.0f}    (>400 normal)",
            f"  A-a:    {self.aa_gradient:.0f} mmHg (expected: {self.expected_aa_gradient:.0f})",
            "─" * 50,
            f"  Na:     {self.sodium:.0f} mEq/L",
            f"  K:      {self.potassium:.1f} mEq/L",
            f"  Cl:     {self.chloride:.0f} mEq/L",
            f"  Glucose:{self.glucose:.0f} mg/dL",
            f"  Lactate:{self.lactate:.1f} mmol/L",
            "─" * 50,
            f"  AG:     {self.anion_gap:.0f} mEq/L (8-12)",
            f"  AG(corr):{self.corrected_anion_gap:.0f} mEq/L",
            f"  Delta:  {self.delta_gap:.1f}",
            "═" * 50,
        ]
        return "\n".join(lines)

