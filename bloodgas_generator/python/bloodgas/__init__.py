"""
Blood Gas Generator Library

A physiologically-accurate blood gas value generator for medical education.
Supports disorder-based and clinical scenario-based generation with realistic
variability and comprehensive clinical interpretation.
"""

from bloodgas.models.disorders import (
    Disorder,
    Severity,
    Compensation,
    Duration,
    ClinicalCondition,
    ChronicCondition,
)
from bloodgas.models.blood_gas_result import BloodGasResult, ClinicalInterpretation
from bloodgas.models.patient_state import PatientFactors
from bloodgas.generator import generate_blood_gas

__version__ = "0.1.0"
__all__ = [
    "generate_blood_gas",
    "BloodGasResult",
    "ClinicalInterpretation",
    "PatientFactors",
    "Disorder",
    "Severity",
    "Compensation",
    "Duration",
    "ClinicalCondition",
    "ChronicCondition",
]

