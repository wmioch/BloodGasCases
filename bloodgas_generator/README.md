# Blood Gas Generator

A physiologically-accurate blood gas value generator for medical education. Generate realistic ABG values driven by patient conditions with full clinical interpretation.

## Features

- **Physiologically Accurate**: Uses Henderson-Hasselbalch equation, compensation rules, and established clinical formulas
- **Multi-Condition Support**: Generate complex scenarios with multiple simultaneous conditions (e.g., DKA + opioid overdose)
- **Comprehensive Output**: Core ABG, oxygenation, electrolytes, anion gap analysis, and clinical interpretation
- **Realistic Variability**: Adds physiological noise for realistic, non-textbook values
- **Educational**: Includes teaching points and clinical implications
- **Cross-Platform**: Python library + TypeScript/JavaScript library + Web frontend

## Quick Start

### Web Interface

Open `frontend/index.html` in your browser - no server required!

The web interface includes two powerful tools:

1. **Blood Gas Generator** (`generator.html`)
   - Generate complete blood gas results from clinical scenarios
   - Select from 40+ conditions with adjustable severity
   - View step-by-step analysis and interpretation
   - Perfect for learning ABG interpretation

2. **Blood Gas Explorer** (`explorer.html`)
   - Interactive exploration of blood gas values
   - Start with normal values, unlock any parameter
   - Change values and watch real-time recalculation
   - Understand physiological relationships hands-on

### Python

```python
from bloodgas import generate_blood_gas, ClinicalCondition, Severity

# Single condition
result = generate_blood_gas(
    conditions=[ClinicalCondition.DKA],
    condition_severities={ClinicalCondition.DKA: Severity.SEVERE}
)

print(result.summary())
print(result.interpretation.to_text())

# Multiple conditions (e.g., T1DM in DKA who took opioids)
result = generate_blood_gas(
    conditions=[ClinicalCondition.DKA, ClinicalCondition.OPIOID_OVERDOSE],
    condition_severities={
        ClinicalCondition.DKA: Severity.MODERATE,
        ClinicalCondition.OPIOID_OVERDOSE: Severity.SEVERE
    }
)
# Result: Mixed metabolic + respiratory acidosis
```

### TypeScript/JavaScript

```typescript
import { generateBloodGas, ClinicalCondition, Severity } from 'bloodgas-generator';

const result = generateBloodGas({
  conditions: [ClinicalCondition.DKA, ClinicalCondition.OPIOID_OVERDOSE],
  severities: {
    [ClinicalCondition.DKA]: Severity.MODERATE,
    [ClinicalCondition.OPIOID_OVERDOSE]: Severity.SEVERE,
  },
  patientFactors: { age: 22 },
  fio2: 0.21,
});

console.log(result);
```

## Supported Conditions

### Respiratory
- COPD Exacerbation
- Asthma Attack
- Pulmonary Embolism
- ARDS
- Pneumonia
- Opioid Overdose
- Hyperventilation (Anxiety/Pain)
- Neuromuscular Weakness

### Metabolic Acidosis - High Anion Gap
- Diabetic Ketoacidosis (DKA)
- Hyperosmolar Hyperglycemic State (HHS)
- Lactic Acidosis (Sepsis/Shock/Seizure)
- Renal Failure (Acute/Chronic)
- Toxic Ingestions (Methanol, Ethylene Glycol, Salicylate)
- Alcoholic Ketoacidosis
- Starvation Ketosis

### Metabolic Acidosis - Normal Anion Gap
- Diarrhea
- Renal Tubular Acidosis (Types 1, 2, 4)
- Saline Infusion

### Metabolic Alkalosis
- Vomiting
- NG Suction
- Diuretic Use
- Hypokalemia
- Hyperaldosteronism

### Normal Variants
- Healthy Adult
- Pregnancy
- High Altitude

## Output Structure

```javascript
{
  // Core ABG
  ph: 7.12,
  pco2: 52,      // mmHg
  po2: 58,       // mmHg
  hco3: 16,      // mEq/L
  baseExcess: -12,
  sao2: 86,      // %

  // Oxygenation
  fio2: 0.21,
  pao2Fio2Ratio: 276,
  aaGradient: 35,
  expectedAaGradient: 14,

  // Electrolytes
  sodium: 136,
  potassium: 5.8,
  chloride: 100,
  glucose: 420,

  // Calculated
  anionGap: 20,
  correctedAnionGap: 20,
  deltaGap: 8,
  lactate: 3.2,

  // Interpretation
  interpretation: {
    primaryDisorder: "Mixed Metabolic and Respiratory Acidosis",
    severity: "severe",
    teachingPoints: [...],
    // ...
  }
}
```

## Project Structure

```
bloodgas_generator/
├── python/                 # Python library
│   ├── bloodgas/
│   │   ├── models/        # Data models
│   │   ├── physiology/    # Calculation engines
│   │   ├── scenarios/     # Clinical conditions
│   │   ├── generator.py   # Main generator
│   │   └── interpretation.py
│   └── pyproject.toml
├── typescript/             # TypeScript library
│   ├── src/
│   │   ├── types.ts
│   │   ├── physiology.ts
│   │   ├── conditions.ts
│   │   └── generator.ts
│   └── package.json
├── frontend/              # Web interface
│   ├── index.html         # Landing page
│   ├── generator.html     # Blood Gas Generator tool
│   ├── explorer.html      # Blood Gas Explorer tool
│   ├── styles.css
│   ├── app.js            # Generator logic
│   ├── explorer.js       # Explorer logic
│   └── bloodgas.bundle.js
└── shared/
    └── schemas/           # JSON schemas
```

## Installation

### Python

```bash
cd bloodgas_generator/python
pip install -e .
```

### TypeScript

```bash
cd bloodgas_generator/typescript
npm install
npm run build
```

## Physiological Models

### Acid-Base
- Henderson-Hasselbalch equation: `pH = 6.1 + log([HCO3-] / (0.03 × pCO2))`
- Winter's formula for metabolic acidosis compensation
- Compensation rules for all primary disorders

### Oxygenation
- Alveolar gas equation
- A-a gradient with age adjustment
- O2-Hb dissociation curve (Hill equation with Bohr effect)
- P/F ratio for ARDS classification

### Anion Gap
- Standard and albumin-corrected anion gap
- Delta-delta analysis for mixed disorders

## License

MIT License - For educational purposes only. Not for clinical use.

## Contributing

Contributions welcome! Please ensure physiological accuracy by citing sources for any new conditions or formulas.

