/**
 * Blood Gas Explorer - Interactive Real-Time Calculator
 * 
 * Allows users to lock/unlock any blood gas value and watch other values
 * recalculate in real-time based on physiological relationships.
 */

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const explorerState = {
  // Locked parameters (user has control)
  // FiO2 is unlocked by default, others are locked
  locked: new Set(['fio2']),
  
  // Parameters that should never be locked/unlocked (measured values)
  readonly: new Set(['ph', 'pco2', 'po2', 'hco3', 'sao2']),
  
  // Current values
  values: {
    ph: 7.40,
    pco2: 40,
    po2: 95,
    hco3: 24,
    sao2: 98,
    fio2: 21,
    sodium: 140,
    potassium: 4.0,
    chloride: 106,
    glucose: 90,
    lactate: 1.0,
    albumin: 4.0,
  },
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initializeLockButtons();
  initializeInputs();
  initializeActionButtons();
  initializeDefaultStates();
  recalculateUnlockedValues(); // Calculate initial values based on FiO2
  updateDisplay();
  updateCalculatedValues();
});

function initializeDefaultStates() {
  // FiO2 is unlocked and editable by default
  unlock('fio2');
  
  // Measured blood gas values are always readonly (no lock button)
  // These are calculated from FiO2 and electrolytes
  explorerState.readonly.forEach(param => {
    const input = document.querySelector(`.explorer-input[data-param="${param}"]`);
    if (input) {
      input.setAttribute('readonly', true);
    }
  });
}

function initializeLockButtons() {
  document.querySelectorAll('.lock-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const param = btn.dataset.param;
      // Don't allow toggling readonly parameters
      if (!explorerState.readonly.has(param)) {
        toggleLock(param);
      }
    });
  });
}

function initializeInputs() {
  document.querySelectorAll('.explorer-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const param = input.dataset.param;
      const value = parseFloat(input.value);
      
      if (!isNaN(value)) {
        explorerState.values[param] = value;
        recalculateUnlockedValues();
        updateDisplay();
        updateCalculatedValues();
      }
    });
  });
}

function initializeActionButtons() {
  document.getElementById('resetBtn').addEventListener('click', resetToNormal);
  document.getElementById('lockAllBtn').addEventListener('click', lockAll);
  document.getElementById('unlockAllBtn').addEventListener('click', unlockAll);
  document.getElementById('copyExplorerBtn').addEventListener('click', copyExplorerResults);
}

// ═══════════════════════════════════════════════════════════════
// LOCK/UNLOCK MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function toggleLock(param) {
  if (explorerState.locked.has(param)) {
    unlock(param);
  } else {
    lock(param);
  }
}

function lock(param) {
  explorerState.locked.add(param);
  updateLockButton(param, true);
  updateInputReadonly(param, true);
}

function unlock(param) {
  explorerState.locked.delete(param);
  updateLockButton(param, false);
  updateInputReadonly(param, false);
}

function lockAll() {
  Object.keys(explorerState.values).forEach(param => {
    if (!explorerState.readonly.has(param)) {
      lock(param);
    }
  });
}

function unlockAll() {
  Object.keys(explorerState.values).forEach(param => {
    if (!explorerState.readonly.has(param)) {
      unlock(param);
    }
  });
}

function updateLockButton(param, isLocked) {
  const btn = document.querySelector(`.lock-btn[data-param="${param}"]`);
  if (!btn) return;
  
  const lockIcon = btn.querySelector('.lock-icon');
  const unlockIcon = btn.querySelector('.unlock-icon');
  
  if (isLocked) {
    btn.classList.add('locked');
    btn.classList.remove('unlocked');
    lockIcon.style.display = 'block';
    unlockIcon.style.display = 'none';
    btn.title = 'Click to unlock';
  } else {
    btn.classList.remove('locked');
    btn.classList.add('unlocked');
    lockIcon.style.display = 'none';
    unlockIcon.style.display = 'block';
    btn.title = 'Click to lock';
  }
}

function updateInputReadonly(param, isReadonly) {
  const input = document.querySelector(`.explorer-input[data-param="${param}"]`);
  if (!input) return;
  
  if (isReadonly) {
    input.setAttribute('readonly', true);
    input.parentElement.classList.remove('unlocked');
  } else {
    input.removeAttribute('readonly');
    input.parentElement.classList.add('unlocked');
  }
}

// ═══════════════════════════════════════════════════════════════
// PHYSIOLOGICAL CALCULATIONS
// ═══════════════════════════════════════════════════════════════

function recalculateUnlockedValues() {
  const v = explorerState.values;
  const locked = explorerState.locked;
  
  // ===== SIMPLIFIED LOGIC FOR INITIAL IMPLEMENTATION =====
  // For now, we keep acid-base at normal values and focus on FiO2 -> PaO2
  // Later we can add more sophisticated interactions
  
  // ===== ACID-BASE CALCULATIONS =====
  // Maintain normal pH and pCO2 for now
  // Calculate HCO3 from Henderson-Hasselbalch
  v.ph = 7.40;
  v.pco2 = 40;
  v.hco3 = calculateHCO3FromPHandPCO2(v.ph, v.pco2);
  
  // ===== OXYGENATION CALCULATIONS =====
  // FiO2 is user-controlled, calculate PaO2 from it
  if (locked.has('fio2')) {
    // FiO2 is being controlled by user
    const alveolarPo2 = calculateAlveolarPO2(v.fio2, v.pco2);
    // Assume a reasonable A-a gradient (age-dependent, age 40)
    const aaGradient = (40 / 4) + 4; // ~14 mmHg
    v.po2 = alveolarPo2 - aaGradient;
    v.po2 = Math.max(30, Math.min(600, v.po2)); // Clamp to physiological range
  }
  
  // Always calculate SaO2 from pO2
  v.sao2 = calculateSaO2FromPO2(v.po2, v.ph);
  
  // ===== ELECTROLYTE RELATIONSHIPS =====
  // If electrolytes are locked (user-controlled), we respect their values
  // Otherwise maintain normal relationships
  
  // Maintain anion gap if electrolytes are being modified
  const targetAG = 10;
  
  // If sodium is locked but chloride isn't, adjust chloride
  if (locked.has('sodium') && !locked.has('chloride')) {
    v.chloride = v.sodium - v.hco3 - targetAG;
    v.chloride = Math.max(85, Math.min(120, v.chloride));
  }
  // If chloride is locked but sodium isn't, adjust sodium
  else if (locked.has('chloride') && !locked.has('sodium')) {
    v.sodium = v.chloride + v.hco3 + targetAG;
    v.sodium = Math.max(115, Math.min(165, v.sodium));
  }
  
  // Clamp all values to physiological ranges
  clampValues();
}

// ===== HENDERSON-HASSELBALCH AND RELATED EQUATIONS =====

function calculatePHFromHCO3AndPCO2(hco3, pco2) {
  // Henderson-Hasselbalch: pH = 6.1 + log10(HCO3 / (0.03 * pCO2))
  const ph = 6.1 + Math.log10(hco3 / (0.03 * pco2));
  return Math.max(6.8, Math.min(7.8, ph));
}

function calculateHCO3FromPHandPCO2(ph, pco2) {
  // Rearranged H-H: HCO3 = 0.03 * pCO2 * 10^(pH - 6.1)
  const hco3 = 0.03 * pco2 * Math.pow(10, ph - 6.1);
  return Math.max(4, Math.min(50, hco3));
}

function calculatePCO2FromPHandHCO3(ph, hco3) {
  // Rearranged H-H: pCO2 = HCO3 / (0.03 * 10^(pH - 6.1))
  const pco2 = hco3 / (0.03 * Math.pow(10, ph - 6.1));
  return Math.max(12, Math.min(120, pco2));
}

// ===== OXYGENATION CALCULATIONS =====

function calculateAlveolarPO2(fio2Percent, pco2) {
  // Alveolar gas equation: PAO2 = FiO2 * (Patm - PH2O) - PaCO2/RQ
  const fio2 = fio2Percent / 100;
  const atmosphericPressure = 760; // mmHg at sea level
  const waterVaporPressure = 47; // mmHg at 37°C
  const respiratoryQuotient = 0.8;
  
  const pio2 = fio2 * (atmosphericPressure - waterVaporPressure);
  const pao2 = pio2 - (pco2 / respiratoryQuotient);
  
  return pao2;
}

function calculateSaO2FromPO2(po2, ph) {
  // Oxygen-hemoglobin dissociation curve (Hill equation)
  // P50 varies with pH (Bohr effect)
  const p50 = 27 + (7.4 - ph) * 5; // P50 shifts with pH
  const hillCoefficient = 2.7;
  
  const sao2 = 100 * Math.pow(po2, hillCoefficient) / 
               (Math.pow(p50, hillCoefficient) + Math.pow(po2, hillCoefficient));
  
  return Math.max(0, Math.min(100, sao2));
}

function calculatePO2FromSaO2(sao2, ph) {
  // Inverse of Hill equation
  const p50 = 27 + (7.4 - ph) * 5;
  const hillCoefficient = 2.7;
  
  // SaO2/100 = pO2^n / (P50^n + pO2^n)
  // Solving for pO2: pO2 = P50 * (SaO2 / (100 - SaO2))^(1/n)
  const satFraction = sao2 / 100;
  if (satFraction >= 0.999) return 100; // Avoid division issues
  if (satFraction <= 0.001) return 30;
  
  const po2 = p50 * Math.pow(satFraction / (1 - satFraction), 1 / hillCoefficient);
  return Math.max(30, Math.min(600, po2));
}

// ===== CALCULATED VALUES =====

function calculateBaseExcess(ph, hco3, hemoglobin = 14) {
  // Van Slyke equation
  const be = (hco3 - 24.4) + (2.3 * hemoglobin + 7.7) * (ph - 7.4);
  return be;
}

function calculateAnionGap(sodium, chloride, hco3) {
  return sodium - (chloride + hco3);
}

function calculatePFRatio(po2, fio2Percent) {
  return po2 / (fio2Percent / 100);
}

function calculateAAGradient(po2, pco2, fio2Percent, age = 40) {
  // Alveolar gas equation: PAO2 = FiO2 * (Patm - PH2O) - PaCO2/RQ
  const fio2 = fio2Percent / 100;
  const pao2 = fio2 * (760 - 47) - (pco2 / 0.8);
  const aaGradient = pao2 - po2;
  return Math.max(0, aaGradient);
}

// ===== VALUE CLAMPING =====

function clampValues() {
  const v = explorerState.values;
  
  v.ph = Math.max(6.8, Math.min(7.8, v.ph));
  v.pco2 = Math.max(12, Math.min(120, v.pco2));
  v.po2 = Math.max(30, Math.min(600, v.po2));
  v.hco3 = Math.max(4, Math.min(50, v.hco3));
  v.sao2 = Math.max(0, Math.min(100, v.sao2));
  v.fio2 = Math.max(21, Math.min(100, v.fio2));
  
  v.sodium = Math.max(115, Math.min(165, v.sodium));
  v.potassium = Math.max(2.0, Math.min(7.0, v.potassium));
  v.chloride = Math.max(85, Math.min(120, v.chloride));
  v.glucose = Math.max(20, Math.min(1000, v.glucose));
  v.lactate = Math.max(0, Math.min(20, v.lactate));
  v.albumin = Math.max(1.5, Math.min(6.0, v.albumin));
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY UPDATE
// ═══════════════════════════════════════════════════════════════

function updateDisplay() {
  const v = explorerState.values;
  
  // Update all input fields
  setInputValue('ph', v.ph.toFixed(2));
  setInputValue('pco2', Math.round(v.pco2));
  setInputValue('po2', Math.round(v.po2));
  setInputValue('hco3', Math.round(v.hco3));
  setInputValue('sao2', Math.round(v.sao2));
  setInputValue('fio2', Math.round(v.fio2));
  
  setInputValue('sodium', Math.round(v.sodium));
  setInputValue('potassium', v.potassium.toFixed(1));
  setInputValue('chloride', Math.round(v.chloride));
  setInputValue('glucose', Math.round(v.glucose));
  setInputValue('lactate', v.lactate.toFixed(1));
  setInputValue('albumin', v.albumin.toFixed(1));
  
  // Update visual indicators (abnormal values)
  updateAbnormalIndicators();
}

function setInputValue(param, value) {
  const input = document.querySelector(`.explorer-input[data-param="${param}"]`);
  if (input && input !== document.activeElement) {
    input.value = value;
  }
}

function updateAbnormalIndicators() {
  const v = explorerState.values;
  const ranges = {
    ph: [7.35, 7.45],
    pco2: [35, 45],
    po2: [80, 100],
    hco3: [22, 26],
    sao2: [95, 100],
    sodium: [136, 145],
    potassium: [3.5, 5.0],
    chloride: [98, 106],
    glucose: [70, 100],
    lactate: [0.5, 2.0],
    albumin: [3.5, 5.0],
  };
  
  for (const [param, [low, high]] of Object.entries(ranges)) {
    const item = document.querySelector(`.explorer-item[data-param="${param}"]`);
    if (!item) continue;
    
    item.classList.remove('abnormal-low', 'abnormal-high', 'normal');
    
    const value = v[param];
    if (value < low) {
      item.classList.add('abnormal-low');
    } else if (value > high) {
      item.classList.add('abnormal-high');
    } else {
      item.classList.add('normal');
    }
  }
}

function updateCalculatedValues() {
  const v = explorerState.values;
  
  const baseExcess = calculateBaseExcess(v.ph, v.hco3);
  const anionGap = calculateAnionGap(v.sodium, v.chloride, v.hco3);
  const pfRatio = calculatePFRatio(v.po2, v.fio2);
  const aaGradient = calculateAAGradient(v.po2, v.pco2, v.fio2);
  
  document.getElementById('calc-base-excess').textContent = baseExcess.toFixed(1);
  document.getElementById('calc-anion-gap').textContent = anionGap.toFixed(0);
  document.getElementById('calc-pf-ratio').textContent = pfRatio.toFixed(0);
  document.getElementById('calc-aa-gradient').textContent = aaGradient.toFixed(0);
  
  // Update abnormal indicators for calculated values
  updateCalculatedAbnormalIndicators(baseExcess, anionGap, pfRatio, aaGradient);
}

function updateCalculatedAbnormalIndicators(baseExcess, anionGap, pfRatio, aaGradient) {
  // Base excess
  const beEl = document.getElementById('calc-base-excess').parentElement;
  beEl.classList.remove('abnormal-low', 'abnormal-high', 'normal');
  if (baseExcess < -2) beEl.classList.add('abnormal-low');
  else if (baseExcess > 2) beEl.classList.add('abnormal-high');
  else beEl.classList.add('normal');
  
  // Anion gap
  const agEl = document.getElementById('calc-anion-gap').parentElement;
  agEl.classList.remove('abnormal-low', 'abnormal-high', 'normal');
  if (anionGap > 14) agEl.classList.add('abnormal-high');
  else if (anionGap < 6) agEl.classList.add('abnormal-low');
  else agEl.classList.add('normal');
  
  // P/F ratio
  const pfEl = document.getElementById('calc-pf-ratio').parentElement;
  pfEl.classList.remove('abnormal-low', 'abnormal-high', 'normal');
  if (pfRatio < 300) pfEl.classList.add('abnormal-low');
  else pfEl.classList.add('normal');
  
  // A-a gradient (age-dependent, assume 40 years)
  const expectedAA = (40 / 4) + 4;
  const aaEl = document.getElementById('calc-aa-gradient').parentElement;
  aaEl.classList.remove('abnormal-low', 'abnormal-high', 'normal');
  if (aaGradient > expectedAA + 5) aaEl.classList.add('abnormal-high');
  else aaEl.classList.add('normal');
}

// ═══════════════════════════════════════════════════════════════
// ACTIONS
// ═══════════════════════════════════════════════════════════════

function resetToNormal() {
  // Reset to normal healthy values
  explorerState.values = {
    ph: 7.40,
    pco2: 40,
    po2: 95,
    hco3: 24,
    sao2: 98,
    fio2: 21,
    sodium: 140,
    potassium: 4.0,
    chloride: 106,
    glucose: 90,
    lactate: 1.0,
    albumin: 4.0,
  };
  
  // Reset lock states: only FiO2 is unlocked
  explorerState.locked.clear();
  explorerState.locked.add('fio2'); // FiO2 is unlocked (user-controlled)
  
  // Update UI for all parameters
  Object.keys(explorerState.values).forEach(param => {
    if (explorerState.readonly.has(param)) {
      // Readonly parameters - no lock button, always readonly
      updateInputReadonly(param, true);
    } else if (param === 'fio2') {
      // FiO2 is unlocked by default
      updateLockButton(param, false);
      updateInputReadonly(param, false);
    } else {
      // Other parameters start locked
      updateLockButton(param, true);
      updateInputReadonly(param, true);
    }
  });
  
  updateDisplay();
  updateCalculatedValues();
  showToast('Reset to normal healthy values', 'success');
}

function copyExplorerResults() {
  const v = explorerState.values;
  const text = `
ARTERIAL BLOOD GAS RESULTS (Explorer)
======================================
pH:     ${v.ph.toFixed(2)}        (7.35-7.45)
pCO2:   ${Math.round(v.pco2)} mmHg    (35-45)
pO2:    ${Math.round(v.po2)} mmHg    (80-100)
HCO3:   ${Math.round(v.hco3)} mEq/L   (22-26)
SaO2:   ${Math.round(v.sao2)}%

OXYGENATION
-----------
FiO2:   ${Math.round(v.fio2)}%
P/F:    ${calculatePFRatio(v.po2, v.fio2).toFixed(0)}
A-a:    ${calculateAAGradient(v.po2, v.pco2, v.fio2).toFixed(0)} mmHg

ELECTROLYTES
------------
Na:     ${Math.round(v.sodium)} mEq/L
K:      ${v.potassium.toFixed(1)} mEq/L
Cl:     ${Math.round(v.chloride)} mEq/L
Glucose:${Math.round(v.glucose)} mg/dL
AG:     ${calculateAnionGap(v.sodium, v.chloride, v.hco3).toFixed(0)} mEq/L
Lactate:${v.lactate.toFixed(1)} mmol/L
Albumin:${v.albumin.toFixed(1)} g/dL

CALCULATED
----------
Base Excess: ${calculateBaseExcess(v.ph, v.hco3).toFixed(1)} mEq/L
`.trim();
  
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy');
  });
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}
