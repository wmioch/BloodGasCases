# Fix Summary: FiO2 to PaO2 Relationship in Explorer

## Problem
In the Blood Gas Explorer, when users changed the FiO2 (fraction of inspired oxygen) value, the PaO2 (partial pressure of oxygen in arterial blood) did not update accordingly. This is physiologically incorrect, as FiO2 directly affects PaO2 through the alveolar gas equation.

## Root Cause
The `recalculateUnlockedValues()` function in `explorer.js` was missing the logic to recalculate PaO2 when FiO2 or PaCO2 changed.

## Solution
Added oxygenation calculation logic to properly update PaO2 based on FiO2 and PaCO2 changes using the alveolar gas equation:

### Changes Made

1. **Added `calculateAlveolarPO2()` function** (line ~263):
   - Implements the alveolar gas equation: PAO2 = FiO2 × (Patm - PH2O) - PaCO2/RQ
   - Parameters:
     - Atmospheric pressure: 760 mmHg (sea level)
     - Water vapor pressure: 47 mmHg (at 37°C)
     - Respiratory quotient: 0.8

2. **Updated oxygenation calculations in `recalculateUnlockedValues()`** (line ~195):
   - Added logic to recalculate PaO2 when FiO2 or PaCO2 is user-controlled
   - Maintains proper priority: SaO2 ↔ PaO2 relationship takes precedence over FiO2 → PaO2
   - Applies a normal A-a gradient (age-adjusted, ~14 mmHg for age 40)
   - Clamps PaO2 to physiological range (30-600 mmHg)

### Calculation Priority
The fix implements the following calculation priority:

1. **If user controls SaO2**: Calculate PaO2 from SaO2
2. **Else if user controls FiO2 or PaCO2**: Calculate PaO2 from alveolar gas equation
3. **Always**: Recalculate SaO2 from PaO2 (if user isn't controlling SaO2)

## How to Test
1. Open `bloodgas_generator/frontend/explorer.html` in a browser
2. Click the lock icon next to FiO2 to unlock it for editing
3. Change FiO2 from 21% to 100%
4. Observe that PaO2 updates automatically (should increase significantly)
5. Change FiO2 back to 21%
6. Observe that PaO2 returns to approximately the original value

### Expected Results
- **FiO2 21%** (room air): PaO2 ~90-95 mmHg
- **FiO2 100%**: PaO2 ~650-670 mmHg
- **FiO2 50%**: PaO2 ~340-350 mmHg

## Technical Details

### Understanding the "locked" Set
In the explorer code, the naming is counter-intuitive:
- **IN the `locked` Set** = User is controlling this parameter (editable/unlocked in UI)
- **NOT in the `locked` Set** = System is controlling this parameter (readonly/locked in UI)

### Physiological Relationships Implemented
- **Alveolar Gas Equation**: PAO2 = FiO2 × (Patm - PH2O) - PaCO2/RQ
- **A-a Gradient**: Normal gradient assumed (~14 mmHg), subtracted from alveolar PO2 to get arterial PO2
- **Oxygen-Hemoglobin Dissociation**: SaO2 calculated from PaO2 using Hill equation

## Files Modified
- `/workspace/bloodgas_generator/frontend/explorer.js`

## Related Functions
- `calculateAlveolarPO2()`: New function for alveolar gas equation
- `calculateSaO2FromPO2()`: Existing function for O2-Hb dissociation curve
- `calculatePO2FromSaO2()`: Existing function for inverse O2-Hb dissociation
- `recalculateUnlockedValues()`: Updated to include FiO2 → PaO2 logic
- `calculateAAGradient()`: Used in calculated values display
