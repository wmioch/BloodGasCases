"""Clinical scenario definitions and mapping."""

from bloodgas.scenarios.clinical_conditions import CONDITION_EFFECTS, get_condition_effect
from bloodgas.scenarios.scenario_mapper import ScenarioMapper

__all__ = [
    "CONDITION_EFFECTS",
    "get_condition_effect",
    "ScenarioMapper",
]

