# Blood Gas Cases

A physiologically-accurate blood gas value generator for medical education. Generate realistic ABG (Arterial Blood Gas) values driven by patient conditions with full clinical interpretation.

## 🌐 Live Demo

**Try it now:** [https://wmioch.github.io/BloodGasCases/](https://wmioch.github.io/BloodGasCases/)

The web interface runs entirely in your browser - no server required!

## ✨ Features

- **Physiologically Accurate**: Uses Henderson-Hasselbalch equation, compensation rules, alveolar gas equation, and established clinical formulas
- **FiO₂-Responsive Oxygenation**: PO₂ realistically changes with FiO₂ based on underlying pathology (A-a gradient, shunt fraction)
- **Multi-Condition Support**: Generate complex scenarios with multiple simultaneous conditions (e.g., DKA + opioid overdose)
- **Comprehensive Output**: Core ABG, oxygenation, electrolytes, anion gap analysis, and clinical interpretation
- **Step-by-Step Analysis**: Shows the working out process for educational purposes
- **Realistic Variability**: Adds physiological noise for realistic, non-textbook values
- **Educational**: Includes teaching points and clinical implications
- **Cross-Platform**: Python library + TypeScript/JavaScript library + Web frontend

## 🚀 Quick Start

### Web Interface (Easiest)

1. Visit [https://wmioch.github.io/BloodGasCases/](https://wmioch.github.io/BloodGasCases/)
2. Or open `bloodgas_generator/frontend/index.html` locally in your browser

### Python

```bash
cd bloodgas_generator/python
pip install -e .
```

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

```bash
cd bloodgas_generator/typescript
npm install
npm run build
```

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

## 📋 Supported Clinical Conditions

### Respiratory
| Condition | Primary Disorder | Key Features |
|-----------|-----------------|--------------|
| COPD Exacerbation | Respiratory Acidosis | ↑ A-a gradient, chronic compensation |
| Asthma Attack | Respiratory Alkalosis | ↑ A-a gradient, V/Q mismatch |
| Pulmonary Embolism | Respiratory Alkalosis | ↑ A-a gradient, dead space |
| ARDS | Respiratory Acidosis | High shunt fraction, refractory hypoxemia |
| Pneumonia | Respiratory Alkalosis | V/Q mismatch, consolidation |
| Opioid Overdose | Respiratory Acidosis | **Normal A-a gradient** |
| Hyperventilation | Respiratory Alkalosis | Normal A-a gradient |
| Neuromuscular Weakness | Respiratory Acidosis | Normal A-a gradient (pump failure) |

### Metabolic Acidosis - High Anion Gap (MUDPILES)
| Condition | Typical AG | Key Features |
|-----------|-----------|--------------|
| DKA | 20-35 | ↑ glucose, ketones, Kussmaul breathing |
| HHS | 12-20 | Extreme hyperglycemia, mild acidosis |
| Lactic Acidosis (Sepsis) | 18-30 | ↑ lactate, may have lung injury |
| Lactic Acidosis (Shock) | 22-35 | Very high lactate, poor prognosis |
| Renal Failure | 14-22 | Hyperkalemia common |
| Toxic Ingestions | 25-40 | Methanol, ethylene glycol, salicylates |
| Alcoholic Ketoacidosis | 18-28 | Low/normal glucose |

### Metabolic Acidosis - Normal Anion Gap
- Diarrhea (GI HCO₃⁻ loss)
- RTA Types 1, 2, 4
- Saline Infusion (dilutional)

### Metabolic Alkalosis
- Vomiting / NG Suction (HCl loss)
- Diuretic Use
- Hypokalemia
- Hyperaldosteronism

### Normal Variants
- Healthy Adult
- Pregnancy (chronic respiratory alkalosis)
- High Altitude

## 📊 Output Structure

```javascript
{
  // Core ABG
  ph: 7.12,
  pco2: 52,      // mmHg
  po2: 58,       // mmHg - now responds to FiO2!
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

## 🔬 Physiological Models

### Acid-Base
- **Henderson-Hasselbalch**: `pH = 6.1 + log([HCO₃⁻] / (0.03 × pCO₂))`
- **Winter's formula**: Expected pCO₂ = 1.5 × [HCO₃⁻] + 8 ± 2
- Compensation rules for all primary disorders

### Oxygenation (NEW: Pathology-Based)
- **Alveolar Gas Equation**: PAO₂ = FiO₂(Patm - PH₂O) - PaCO₂/RQ
- **A-a Gradient**: Based on underlying lung pathology
- **Shunt Fraction**: Models refractory hypoxemia (ARDS, severe PE)
- **O₂-Hb Dissociation**: Hill equation with Bohr effect
- **P/F Ratio**: For ARDS classification

### Anion Gap
- Standard and albumin-corrected anion gap
- Delta-delta analysis for mixed disorders

## 📁 Project Structure

```
BloodGasCases/
├── bloodgas_generator/
│   ├── frontend/              # Web interface
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── app.js
│   │   └── bloodgas.bundle.js
│   ├── python/                # Python library
│   │   ├── bloodgas/
│   │   │   ├── models/        # Data models
│   │   │   ├── physiology/    # Calculation engines
│   │   │   ├── scenarios/     # Clinical conditions
│   │   │   ├── generator.py   # Main generator
│   │   │   └── interpretation.py
│   │   └── pyproject.toml
│   ├── typescript/            # TypeScript library
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── physiology.ts
│   │   │   ├── conditions.ts
│   │   │   └── generator.ts
│   │   └── package.json
│   └── shared/
│       └── schemas/           # JSON schemas
└── README.md
```

## 🛠️ Development

### Prerequisites
- Python 3.10+ (for Python library)
- Node.js 18+ (for TypeScript library)

### Building

**Python:**
```bash
cd bloodgas_generator/python
pip install -e ".[dev]"
pytest
```

**TypeScript:**
```bash
cd bloodgas_generator/typescript
npm install
npm run build
npm run build:bundle  # Creates browser bundle
```

### Deploying the Web Interface

The frontend is a static site that can be deployed to GitHub Pages:

1. Enable GitHub Pages in repository settings
2. Set source to `bloodgas_generator/frontend` folder
3. Or deploy using GitHub Actions

## 📝 License

MIT License - For educational purposes only. **Not for clinical use.**

## 🤝 Contributing

Contributions welcome! Please ensure physiological accuracy by citing sources for any new conditions or formulas.

## ⚠️ Disclaimer

This tool is intended for **medical education only**. The generated values are simulated and should **never** be used for clinical decision-making. Always interpret real patient ABGs in their full clinical context.

