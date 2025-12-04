# Blood Gas Generator - Python Library

A physiologically-accurate blood gas value generator for medical education.

## Installation

```bash
pip install -e .
```

## Quick Start

```python
from bloodgas import generate_blood_gas, ClinicalCondition, Severity, PatientFactors

# Generate ABG for a patient with DKA
result = generate_blood_gas(
    conditions=[ClinicalCondition.DKA],
    condition_severities={ClinicalCondition.DKA: Severity.SEVERE}
)

# Print summary
print(result.summary())

# Get clinical interpretation
print(result.interpretation.to_text())

# Export to JSON
print(result.to_json())
```

## Multi-Condition Scenarios

Generate complex, realistic scenarios with multiple simultaneous conditions:

```python
# Type 1 diabetic in DKA who also took an opioid overdose
result = generate_blood_gas(
    conditions=[
        ClinicalCondition.DKA,
        ClinicalCondition.OPIOID_OVERDOSE
    ],
    condition_severities={
        ClinicalCondition.DKA: Severity.MODERATE,
        ClinicalCondition.OPIOID_OVERDOSE: Severity.SEVERE
    },
    patient_factors=PatientFactors(
        age=22,
        chronic_conditions=[ChronicCondition.TYPE1_DIABETES]
    )
)

# This produces a mixed metabolic + respiratory acidosis
# because the opioids block the expected Kussmaul breathing
```

## Disorder-Based Mode

For simpler scenarios, specify the disorder directly:

```python
from bloodgas import Disorder, Compensation, Duration

result = generate_blood_gas(
    primary_disorder=Disorder.METABOLIC_ACIDOSIS,
    severity=Severity.MODERATE,
    compensation=Compensation.APPROPRIATE,
    duration=Duration.ACUTE
)
```

## Patient Factors

Customize patient characteristics:

```python
from bloodgas import PatientFactors, ChronicCondition

patient = PatientFactors(
    age=65,
    chronic_conditions=[
        ChronicCondition.COPD,
        ChronicCondition.TYPE2_DIABETES
    ],
    is_pregnant=False,
    altitude_meters=0
)

result = generate_blood_gas(
    conditions=[ClinicalCondition.COPD_EXACERBATION],
    patient_factors=patient
)
```

## Supported Conditions

### Respiratory
- `COPD_EXACERBATION`
- `ASTHMA_ATTACK`
- `PULMONARY_EMBOLISM`
- `ARDS`
- `PNEUMONIA`
- `OPIOID_OVERDOSE`
- `HYPERVENTILATION_ANXIETY`
- `HYPERVENTILATION_PAIN`
- `NEUROMUSCULAR_WEAKNESS`

### Metabolic Acidosis - High Anion Gap
- `DKA`
- `HHS`
- `LACTIC_ACIDOSIS_SEPSIS`
- `LACTIC_ACIDOSIS_SHOCK`
- `LACTIC_ACIDOSIS_SEIZURE`
- `RENAL_FAILURE_ACUTE`
- `RENAL_FAILURE_CHRONIC`
- `TOXIC_INGESTION_METHANOL`
- `TOXIC_INGESTION_ETHYLENE_GLYCOL`
- `TOXIC_INGESTION_SALICYLATE`
- `ALCOHOLIC_KETOACIDOSIS`
- `STARVATION_KETOSIS`

### Metabolic Acidosis - Normal Anion Gap
- `DIARRHEA`
- `RTA_TYPE1`
- `RTA_TYPE2`
- `RTA_TYPE4`
- `SALINE_INFUSION`

### Metabolic Alkalosis
- `VOMITING`
- `NG_SUCTION`
- `DIURETIC_USE`
- `HYPOKALEMIA`
- `HYPERALDOSTERONISM`
- `MILK_ALKALI_SYNDROME`
- `POST_HYPERCAPNIA`

### Normal Variants
- `HEALTHY`
- `PREGNANCY`
- `HIGH_ALTITUDE`

## API Reference

### `generate_blood_gas()`

Main generation function supporting two modes:

**Parameters:**
- `conditions`: List of `ClinicalCondition` values
- `condition_severities`: Dict mapping conditions to `Severity`
- `primary_disorder`: `Disorder` enum (for disorder-based mode)
- `severity`: `Severity` enum
- `compensation`: `Compensation` enum
- `duration`: `Duration` enum (ACUTE, SUBACUTE, CHRONIC)
- `patient_factors`: `PatientFactors` dataclass
- `fio2`: Fraction of inspired O2 (0.21-1.0)
- `add_variability`: Whether to add realistic noise
- `seed`: Random seed for reproducibility

**Returns:** `BloodGasResult` dataclass

### `BloodGasResult`

Contains all generated values:

```python
@dataclass
class BloodGasResult:
    # Core ABG
    ph: float
    pco2: float        # mmHg
    po2: float         # mmHg
    hco3: float        # mEq/L
    base_excess: float
    sao2: float        # %

    # Oxygenation
    fio2: float
    pao2_fio2_ratio: float
    aa_gradient: float
    expected_aa_gradient: float

    # Electrolytes
    sodium: float
    potassium: float
    chloride: float
    glucose: float     # mg/dL

    # Calculated
    anion_gap: float
    corrected_anion_gap: float
    delta_gap: float
    lactate: float     # mmol/L
    hemoglobin: float  # g/dL

    # Metadata
    interpretation: ClinicalInterpretation
    generation_params: GenerationParams
```

## Educational Use

This library is designed for medical education:

- Generate realistic practice cases
- Create exam questions with known answers
- Teach ABG interpretation systematically
- Demonstrate mixed disorder patterns

**⚠️ NOT FOR CLINICAL USE**

## License

MIT License

