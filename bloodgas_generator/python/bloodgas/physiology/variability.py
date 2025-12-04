"""
Variability Engine

Generates physiological noise and measurement variation
to create realistic blood gas values.
"""

import random
import math
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class VariabilityConfig:
    """Configuration for variability generation."""
    
    # Enable/disable variability
    enabled: bool = True
    
    # Seed for reproducibility (None = random each time)
    seed: Optional[int] = None
    
    # Coefficient of variation for each parameter (as fraction, e.g., 0.02 = 2%)
    ph_cv: float = 0.005  # Very tight physiological control
    pco2_cv: float = 0.03
    po2_cv: float = 0.05  # More variable
    hco3_cv: float = 0.03
    
    # Electrolyte variation
    sodium_cv: float = 0.015
    potassium_cv: float = 0.05  # More variable
    chloride_cv: float = 0.02
    glucose_cv: float = 0.08  # Quite variable
    lactate_cv: float = 0.10  # Most variable
    
    # Measurement error (added to physiological variation)
    measurement_error: bool = True
    measurement_error_magnitude: float = 0.5  # Relative magnitude


class VariabilityEngine:
    """
    Engine for adding realistic variability to blood gas values.
    
    Variability comes from two sources:
    1. Physiological variation (biological)
    2. Measurement error (analytical)
    
    This creates more realistic generated values that aren't
    perfectly "textbook" numbers.
    """
    
    def __init__(self, config: Optional[VariabilityConfig] = None):
        """Initialize with configuration."""
        self.config = config or VariabilityConfig()
        
        if self.config.seed is not None:
            random.seed(self.config.seed)
    
    def add_variability(
        self,
        value: float,
        cv: float,
        min_value: Optional[float] = None,
        max_value: Optional[float] = None,
        distribution: str = "normal"
    ) -> float:
        """
        Add variability to a value.
        
        Args:
            value: The base value
            cv: Coefficient of variation (standard deviation as fraction of mean)
            min_value: Minimum allowed value
            max_value: Maximum allowed value
            distribution: "normal" or "lognormal"
        
        Returns:
            Value with added variability
        """
        if not self.config.enabled:
            return value
        
        if cv <= 0:
            return value
        
        # Calculate standard deviation
        sd = abs(value) * cv
        
        if distribution == "lognormal":
            # Lognormal for values that can't be negative
            # Convert to log-space parameters
            mu = math.log(value) - (cv ** 2) / 2
            sigma = cv
            varied = random.lognormvariate(mu, sigma)
        else:
            # Normal distribution
            varied = random.gauss(value, sd)
        
        # Add measurement error if enabled
        if self.config.measurement_error:
            measurement_sd = sd * self.config.measurement_error_magnitude * 0.5
            varied += random.gauss(0, measurement_sd)
        
        # Apply bounds
        if min_value is not None:
            varied = max(varied, min_value)
        if max_value is not None:
            varied = min(varied, max_value)
        
        return varied
    
    def vary_ph(self, ph: float) -> float:
        """Add variability to pH value."""
        # pH is tightly controlled - use very small variation
        # Also has physiological limits
        return self.add_variability(
            ph,
            self.config.ph_cv,
            min_value=6.80,
            max_value=7.80
        )
    
    def vary_pco2(self, pco2: float) -> float:
        """Add variability to pCO2."""
        return self.add_variability(
            pco2,
            self.config.pco2_cv,
            min_value=10.0,
            max_value=150.0
        )
    
    def vary_po2(self, po2: float) -> float:
        """Add variability to pO2."""
        return self.add_variability(
            po2,
            self.config.po2_cv,
            min_value=20.0,
            max_value=600.0,  # Can be high on 100% O2
            distribution="lognormal"
        )
    
    def vary_hco3(self, hco3: float) -> float:
        """Add variability to HCO3."""
        return self.add_variability(
            hco3,
            self.config.hco3_cv,
            min_value=4.0,
            max_value=50.0
        )
    
    def vary_sodium(self, sodium: float) -> float:
        """Add variability to sodium."""
        return self.add_variability(
            sodium,
            self.config.sodium_cv,
            min_value=110.0,
            max_value=180.0
        )
    
    def vary_potassium(self, potassium: float) -> float:
        """Add variability to potassium."""
        # Potassium is more variable, especially with hemolysis
        return self.add_variability(
            potassium,
            self.config.potassium_cv,
            min_value=2.0,
            max_value=9.0
        )
    
    def vary_chloride(self, chloride: float) -> float:
        """Add variability to chloride."""
        return self.add_variability(
            chloride,
            self.config.chloride_cv,
            min_value=80.0,
            max_value=130.0
        )
    
    def vary_glucose(self, glucose: float) -> float:
        """Add variability to glucose."""
        # Glucose is quite variable
        return self.add_variability(
            glucose,
            self.config.glucose_cv,
            min_value=20.0,
            max_value=1200.0,
            distribution="lognormal"
        )
    
    def vary_lactate(self, lactate: float) -> float:
        """Add variability to lactate."""
        # Lactate is most variable
        return self.add_variability(
            lactate,
            self.config.lactate_cv,
            min_value=0.3,
            max_value=25.0,
            distribution="lognormal"
        )
    
    def vary_hemoglobin(self, hemoglobin: float) -> float:
        """Add variability to hemoglobin."""
        return self.add_variability(
            hemoglobin,
            0.02,  # Relatively stable
            min_value=3.0,
            max_value=22.0
        )
    
    def vary_sao2(self, sao2: float) -> float:
        """Add variability to SaO2."""
        # SaO2 calculated from pO2, small measurement variation
        return self.add_variability(
            sao2,
            0.01,
            min_value=0.0,
            max_value=100.0
        )
    
    @classmethod
    def generate_in_range(
        cls,
        low: float,
        high: float,
        center_bias: float = 0.5,
        seed: Optional[int] = None
    ) -> float:
        """
        Generate a value within a range with optional center bias.
        
        Args:
            low: Lower bound
            high: Upper bound
            center_bias: 0-1, higher = more likely to be near center
            seed: Random seed for reproducibility
        
        Returns:
            Random value in range
        """
        if seed is not None:
            random.seed(seed)
        
        # Use beta distribution for center bias
        if center_bias > 0:
            # Shape parameters for beta distribution
            # Higher values = more peaked at center
            alpha = beta = 1 + (center_bias * 10)
            fraction = random.betavariate(alpha, beta)
        else:
            fraction = random.random()
        
        return low + (high - low) * fraction
    
    @classmethod
    def generate_severity_value(
        cls,
        mild_range: Tuple[float, float],
        moderate_range: Tuple[float, float],
        severe_range: Tuple[float, float],
        severity: str = "moderate",
        seed: Optional[int] = None
    ) -> float:
        """
        Generate a value appropriate for a severity level.
        
        Args:
            mild_range: (min, max) for mild severity
            moderate_range: (min, max) for moderate severity
            severe_range: (min, max) for severe severity
            severity: "mild", "moderate", or "severe"
            seed: Random seed for reproducibility
        
        Returns:
            Value in the appropriate range
        """
        if severity == "mild":
            return cls.generate_in_range(*mild_range, center_bias=0.3, seed=seed)
        elif severity == "severe":
            return cls.generate_in_range(*severe_range, center_bias=0.3, seed=seed)
        else:  # moderate
            return cls.generate_in_range(*moderate_range, center_bias=0.5, seed=seed)


def create_variability_engine(
    enabled: bool = True,
    seed: Optional[int] = None,
    low_noise: bool = False
) -> VariabilityEngine:
    """
    Factory function to create a variability engine.
    
    Args:
        enabled: Whether to add variability
        seed: Random seed for reproducibility
        low_noise: If True, reduce all variation by 50%
    
    Returns:
        Configured VariabilityEngine
    """
    config = VariabilityConfig(
        enabled=enabled,
        seed=seed
    )
    
    if low_noise:
        # Reduce all CVs by half
        config.ph_cv *= 0.5
        config.pco2_cv *= 0.5
        config.po2_cv *= 0.5
        config.hco3_cv *= 0.5
        config.sodium_cv *= 0.5
        config.potassium_cv *= 0.5
        config.chloride_cv *= 0.5
        config.glucose_cv *= 0.5
        config.lactate_cv *= 0.5
    
    return VariabilityEngine(config)

