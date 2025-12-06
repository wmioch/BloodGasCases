# Testing Guide: FiO2 to PaO2 Fix

## Quick Demo
Open `demo_fio2_fix.html` in a browser to see an interactive demonstration of the FiO2 → PaO2 calculation working correctly.

## Testing in the Explorer

### Step 1: Open the Explorer
1. Navigate to `bloodgas_generator/frontend/`
2. Open `explorer.html` in a web browser

### Step 2: Test FiO2 → PaO2 Relationship

#### Test Case 1: Room Air to Supplemental Oxygen
1. Observe initial values:
   - FiO2: 21%
   - PaO2: ~95 mmHg
   - P/F Ratio: ~452

2. Click the lock icon next to **FiO2** to unlock it (icon changes to unlocked)

3. Change FiO2 from 21% to 100%

4. **Expected Results:**
   - PaO2 should increase to ~650-670 mmHg
   - SaO2 should remain near 100%
   - P/F Ratio should increase to ~660-670
   - A-a Gradient should remain approximately the same (~10-14 mmHg)

#### Test Case 2: Progressive Oxygen Titration
1. With FiO2 still unlocked, try these values:
   - FiO2 = 40%: PaO2 should be ~250 mmHg
   - FiO2 = 60%: PaO2 should be ~410 mmHg
   - FiO2 = 80%: PaO2 should be ~560 mmHg

#### Test Case 3: FiO2 with Hypercapnia
1. Keep FiO2 unlocked at 21%
2. Unlock **PaCO2**
3. Increase PaCO2 from 40 to 80 mmHg
4. **Expected Results:**
   - PaO2 should **decrease** (because higher PaCO2 reduces alveolar PO2)
   - At PaCO2 = 80 mmHg, PaO2 should drop to ~50-55 mmHg
   - This demonstrates the alveolar gas equation: higher CO2 displaces O2

#### Test Case 4: Verify SaO2 Updates
1. With FiO2 unlocked at 100% and normal PaCO2 (40 mmHg):
   - PaO2 should be ~650-670 mmHg
   - SaO2 should be 100%

2. Change FiO2 to 21%:
   - PaO2 should drop to ~95 mmHg
   - SaO2 should drop to ~97-98%

3. Change FiO2 to 30%:
   - PaO2 should be ~150 mmHg
   - SaO2 should be 99-100%

### Step 3: Test Priority Logic

#### Test Case 5: SaO2 Takes Priority Over FiO2
1. Reset to normal (click "Reset to Normal" button)
2. Unlock **SaO2** and set it to 90%
3. Unlock **FiO2** and change it to 100%
4. **Expected Results:**
   - PaO2 should be calculated from SaO2 (~60 mmHg for 90% saturation)
   - PaO2 should NOT change when FiO2 changes
   - This is correct: when user controls SaO2, that takes priority

#### Test Case 6: PaO2 User Control
1. Reset to normal
2. Unlock **PaO2** and **FiO2**
3. Change FiO2 to 100%
4. **Expected Results:**
   - PaO2 should NOT change automatically
   - User can manually set PaO2 to any value
   - This is correct: user-controlled values don't get overwritten

### Step 4: Verify Calculated Values Update

When FiO2 or PaO2 changes, verify that the calculated values in the "Calculated Values" section update correctly:

- **P/F Ratio**: Should be PaO2 / (FiO2 / 100)
  - Normal: >400
  - Mild ARDS: 200-300
  - Moderate ARDS: 100-200
  - Severe ARDS: <100

- **A-a Gradient**: Should remain relatively stable when only FiO2 changes
  - Normal: <15 mmHg (for age 40)
  - Formula: PAO2 - PaO2

## Expected Physiological Relationships

### FiO2 vs PaO2 (Normal A-a Gradient)
| FiO2 | Expected PaO2 | P/F Ratio |
|------|---------------|-----------|
| 21%  | 90-95 mmHg    | 430-450   |
| 30%  | 150-160 mmHg  | 500-530   |
| 40%  | 250-260 mmHg  | 625-650   |
| 50%  | 340-350 mmHg  | 680-700   |
| 60%  | 410-420 mmHg  | 683-700   |
| 100% | 650-670 mmHg  | 650-670   |

### PaCO2 Effect on PaO2 (at FiO2 21%)
| PaCO2 | Expected PaO2 |
|-------|---------------|
| 20    | 120-130 mmHg  |
| 40    | 90-95 mmHg    |
| 60    | 65-70 mmHg    |
| 80    | 50-55 mmHg    |

## Common Issues (Should NOT Occur)

### ❌ Bug: PaO2 Doesn't Change
**Symptom**: Changing FiO2 has no effect on PaO2

**This was the original bug and should now be fixed.**

### ✓ Expected Behavior: PaO2 Updates Automatically
When FiO2 or PaCO2 is unlocked and changed, PaO2 should update automatically (as long as PaO2 itself is not unlocked).

## Verification Checklist

- [ ] FiO2 21% → 100% increases PaO2 from ~95 to ~650-670 mmHg
- [ ] FiO2 changes update P/F ratio proportionally
- [ ] Increasing PaCO2 decreases PaO2 (when FiO2 is constant)
- [ ] SaO2 updates automatically based on PaO2 changes
- [ ] When SaO2 is unlocked, it takes priority over FiO2
- [ ] When PaO2 is unlocked, user can set it manually
- [ ] A-a gradient remains stable when only FiO2 changes
- [ ] All calculated values update in real-time

## Technical Notes

### Alveolar Gas Equation
```
PAO2 = FiO2 × (Patm - PH2O) - PaCO2/RQ

Where:
- Patm = 760 mmHg (atmospheric pressure at sea level)
- PH2O = 47 mmHg (water vapor pressure at 37°C)
- RQ = 0.8 (respiratory quotient)
```

### A-a Gradient
```
A-a Gradient = PAO2 - PaO2

Normal: (Age / 4) + 4 mmHg
For age 40: ~14 mmHg
```

### Oxygen-Hemoglobin Dissociation
The SaO2 is calculated using the Hill equation with Bohr effect (pH-dependent P50 shift).

## Browser Compatibility
The fix uses standard JavaScript and should work in all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Files Involved
- `frontend/explorer.js` - Main logic file with the fix
- `frontend/explorer.html` - UI file (no changes needed)
- `demo_fio2_fix.html` - Standalone demonstration
