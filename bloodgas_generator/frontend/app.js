/**
 * Blood Gas Generator - Frontend Application
 * 
 * Interactive UI for generating and displaying blood gas results.
 */

// ═══════════════════════════════════════════════════════════════
// CONDITION DATA
// ═══════════════════════════════════════════════════════════════

const CONDITIONS = {
  'Respiratory': [
    { value: 'COPD_EXACERBATION', label: 'COPD Exacerbation' },
    { value: 'ASTHMA_ATTACK', label: 'Asthma Attack' },
    { value: 'PULMONARY_EMBOLISM', label: 'Pulmonary Embolism' },
    { value: 'ARDS', label: 'ARDS' },
    { value: 'PNEUMONIA', label: 'Pneumonia' },
    { value: 'OPIOID_OVERDOSE', label: 'Opioid Overdose' },
    { value: 'HYPERVENTILATION_ANXIETY', label: 'Hyperventilation (Anxiety)' },
    { value: 'NEUROMUSCULAR_WEAKNESS', label: 'Neuromuscular Weakness' },
  ],
  'Metabolic Acidosis (High AG)': [
    { value: 'DKA', label: 'Diabetic Ketoacidosis (DKA)' },
    { value: 'HHS', label: 'Hyperosmolar Hyperglycemic State' },
    { value: 'LACTIC_ACIDOSIS_SEPSIS', label: 'Lactic Acidosis (Sepsis)' },
    { value: 'LACTIC_ACIDOSIS_SHOCK', label: 'Lactic Acidosis (Shock)' },
    { value: 'RENAL_FAILURE_ACUTE', label: 'Acute Kidney Injury' },
    { value: 'RENAL_FAILURE_CHRONIC', label: 'Chronic Kidney Disease' },
    { value: 'TOXIC_INGESTION_METHANOL', label: 'Methanol Poisoning' },
    { value: 'TOXIC_INGESTION_ETHYLENE_GLYCOL', label: 'Ethylene Glycol Poisoning' },
    { value: 'TOXIC_INGESTION_SALICYLATE', label: 'Salicylate Toxicity' },
    { value: 'ALCOHOLIC_KETOACIDOSIS', label: 'Alcoholic Ketoacidosis' },
  ],
  'Metabolic Acidosis (Normal AG)': [
    { value: 'DIARRHEA', label: 'Diarrhea' },
    { value: 'RTA_TYPE1', label: 'RTA Type 1 (Distal)' },
    { value: 'RTA_TYPE2', label: 'RTA Type 2 (Proximal)' },
    { value: 'RTA_TYPE4', label: 'RTA Type 4' },
    { value: 'SALINE_INFUSION', label: 'Saline Infusion' },
  ],
  'Metabolic Alkalosis': [
    { value: 'VOMITING', label: 'Vomiting' },
    { value: 'NG_SUCTION', label: 'NG Suction' },
    { value: 'DIURETIC_USE', label: 'Diuretic Use' },
    { value: 'HYPOKALEMIA', label: 'Hypokalemia' },
    { value: 'HYPERALDOSTERONISM', label: 'Hyperaldosteronism' },
  ],
  'Normal Variants': [
    { value: 'HEALTHY', label: 'Healthy Adult' },
    { value: 'PREGNANCY', label: 'Pregnancy' },
    { value: 'HIGH_ALTITUDE', label: 'High Altitude' },
  ],
};

// ═══════════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════════

const state = {
  selectedConditions: new Map(), // condition -> severity
  currentResult: null,
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initConditionSelector();
  initEventListeners();
});

function initConditionSelector() {
  const container = document.getElementById('conditionSelector');
  
  for (const [category, conditions] of Object.entries(CONDITIONS)) {
    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'condition-category';
    
    const header = document.createElement('div');
    header.className = 'category-header';
    header.textContent = category;
    categoryDiv.appendChild(header);
    
    const list = document.createElement('div');
    list.className = 'condition-list';
    
    for (const condition of conditions) {
      const option = document.createElement('label');
      option.className = 'condition-option';
      option.innerHTML = `
        <input type="checkbox" value="${condition.value}">
        <span>${condition.label}</span>
      `;
      
      option.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          addCondition(condition.value, condition.label);
        } else {
          removeCondition(condition.value);
        }
      });
      
      list.appendChild(option);
    }
    
    categoryDiv.appendChild(list);
    container.appendChild(categoryDiv);
  }
}

function initEventListeners() {
  // FiO2 slider
  const fio2Slider = document.getElementById('fio2');
  const fio2Value = document.getElementById('fio2Value');
  fio2Slider.addEventListener('input', () => {
    fio2Value.textContent = `${fio2Slider.value}%`;
  });
  
  // Generate button
  document.getElementById('generateBtn').addEventListener('click', generateBloodGas);
  
  // Copy button
  document.getElementById('copyBtn').addEventListener('click', copyToClipboard);
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportJSON);
}

// ═══════════════════════════════════════════════════════════════
// CONDITION MANAGEMENT
// ═══════════════════════════════════════════════════════════════

function addCondition(value, label) {
  state.selectedConditions.set(value, 'MODERATE');
  renderSelectedConditions();
}

function removeCondition(value) {
  state.selectedConditions.delete(value);
  
  // Uncheck the checkbox
  const checkbox = document.querySelector(`#conditionSelector input[value="${value}"]`);
  if (checkbox) checkbox.checked = false;
  
  renderSelectedConditions();
}

function updateSeverity(value, severity) {
  state.selectedConditions.set(value, severity);
}

function renderSelectedConditions() {
  const container = document.getElementById('selectedConditions');
  container.innerHTML = '';
  
  for (const [value, severity] of state.selectedConditions) {
    const label = getConditionLabel(value);
    
    const div = document.createElement('div');
    div.className = 'selected-condition';
    div.innerHTML = `
      <span class="condition-name">${label}</span>
      <div class="severity-slider">
        <label>Severity:</label>
        <select data-condition="${value}">
          <option value="MILD" ${severity === 'MILD' ? 'selected' : ''}>Mild</option>
          <option value="MODERATE" ${severity === 'MODERATE' ? 'selected' : ''}>Moderate</option>
          <option value="SEVERE" ${severity === 'SEVERE' ? 'selected' : ''}>Severe</option>
        </select>
      </div>
      <button class="remove-btn" data-condition="${value}" title="Remove">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    `;
    
    // Severity change handler
    div.querySelector('select').addEventListener('change', (e) => {
      updateSeverity(value, e.target.value);
    });
    
    // Remove button handler
    div.querySelector('.remove-btn').addEventListener('click', () => {
      removeCondition(value);
    });
    
    container.appendChild(div);
  }
}

function getConditionLabel(value) {
  for (const conditions of Object.values(CONDITIONS)) {
    const found = conditions.find(c => c.value === value);
    if (found) return found.label;
  }
  return value;
}

// ═══════════════════════════════════════════════════════════════
// BLOOD GAS GENERATION
// ═══════════════════════════════════════════════════════════════

function generateBloodGas() {
  const conditions = Array.from(state.selectedConditions.keys());
  
  if (conditions.length === 0) {
    showToast('Please select at least one condition');
    return;
  }
  
  const severities = {};
  for (const [condition, severity] of state.selectedConditions) {
    severities[condition] = severity;
  }
  
  const age = parseInt(document.getElementById('patientAge').value) || 40;
  const fio2 = parseInt(document.getElementById('fio2').value) / 100;
  
  const chronicConditions = [];
  document.querySelectorAll('#chronicConditions input:checked').forEach(input => {
    chronicConditions.push(input.value);
  });
  
  // Check if BloodGas library is loaded
  if (typeof BloodGas !== 'undefined' && BloodGas.generateBloodGas) {
    // Use the TypeScript library
    const result = BloodGas.generateBloodGas({
      conditions: conditions,
      severities: severities,
      patientFactors: {
        age: age,
        chronicConditions: chronicConditions,
      },
      fio2: fio2,
      addVariability: true,
    });
    
    state.currentResult = result;
    displayResults(result);
  } else {
    // Fallback to inline generator
    const result = generateBloodGasInline(conditions, severities, age, fio2, chronicConditions);
    state.currentResult = result;
    displayResults(result);
  }
}

// ═══════════════════════════════════════════════════════════════
// INLINE GENERATOR (FALLBACK)
// ═══════════════════════════════════════════════════════════════

function generateBloodGasInline(conditions, severities, age, fio2, chronicConditions) {
  // Simplified inline generation for when the full library isn't loaded
  const baselinePco2 = chronicConditions.includes('COPD') ? 45 : 40;
  const baselineHco3 = chronicConditions.includes('CHRONIC_KIDNEY_DISEASE') ? 20 : 24;
  
  let pco2Delta = 0;
  let hco3Delta = 0;
  let aaGradientElevated = false;
  let anionGapElevated = false;
  let targetAnionGap = 10;
  let glucoseTarget = 95;
  let lactateTarget = 1.0;
  let potassiumDelta = 0;
  
  // Condition effects (simplified)
  // NOTE: po2 is now calculated dynamically based on FiO2, A-a gradient, and shunt
  // aaElevated flag indicates V/Q mismatch or shunt physiology
  const EFFECTS = {
    'DKA': { hco3: -14, pco2: -12, ag: 28, glucose: 450, lactate: 3.5, k: 0.8, aaElevated: false },
    'OPIOID_OVERDOSE': { pco2: 30, hco3: 1, aaElevated: false },
    'LACTIC_ACIDOSIS_SEPSIS': { hco3: -10, pco2: -8, ag: 22, lactate: 8, aaElevated: true },
    'LACTIC_ACIDOSIS_SHOCK': { hco3: -14, pco2: -12, ag: 28, lactate: 14, aaElevated: true },
    'VOMITING': { hco3: 10, pco2: 6, k: -1.0, aaElevated: false },
    'COPD_EXACERBATION': { pco2: 25, hco3: 6, aaElevated: true },
    'ASTHMA_ATTACK': { pco2: -8, hco3: -2, aaElevated: true },
    'PULMONARY_EMBOLISM': { pco2: -8, hco3: -1, aaElevated: true },
    'ARDS': { pco2: 15, hco3: 2, aaElevated: true },
    'PNEUMONIA': { pco2: -5, hco3: -1, aaElevated: true },
    'RENAL_FAILURE_ACUTE': { hco3: -8, pco2: -6, ag: 18, k: 1.2, aaElevated: false },
    'RENAL_FAILURE_CHRONIC': { hco3: -4, pco2: -3, ag: 15, aaElevated: false },
    'DIARRHEA': { hco3: -8, pco2: -6, k: -1.0, aaElevated: false },
    'HYPERVENTILATION_ANXIETY': { pco2: -15, hco3: -2, aaElevated: false },
    'TOXIC_INGESTION_SALICYLATE': { hco3: -8, pco2: -10, ag: 22, lactate: 4, aaElevated: false },
    'TOXIC_INGESTION_METHANOL': { hco3: -16, pco2: -14, ag: 32, aaElevated: false },
    'TOXIC_INGESTION_ETHYLENE_GLYCOL': { hco3: -16, pco2: -14, ag: 32, aaElevated: false },
    'HEALTHY': { hco3: 0, pco2: 0, aaElevated: false },
    'PREGNANCY': { pco2: -8, hco3: -3, aaElevated: false },
    'HIGH_ALTITUDE': { pco2: -8, hco3: -2, aaElevated: false },
    'DIURETIC_USE': { hco3: 6, pco2: 4, k: -0.7, aaElevated: false },
    'ALCOHOLIC_KETOACIDOSIS': { hco3: -10, pco2: -8, ag: 22, glucose: 70, aaElevated: false },
    'RTA_TYPE1': { hco3: -10, pco2: -6, k: -1.0, aaElevated: false },
    'RTA_TYPE4': { hco3: -4, pco2: -3, k: 1.0, aaElevated: false },
    'NG_SUCTION': { hco3: 8, pco2: 5, k: -0.8, aaElevated: false },
    'HHS': { hco3: -4, pco2: -2, ag: 14, glucose: 800, aaElevated: false },
  };
  
  // Apply effects from all conditions
  for (const condition of conditions) {
    const severity = severities[condition] || 'MODERATE';
    const severityFactor = severity === 'MILD' ? 0.33 : severity === 'MODERATE' ? 0.66 : 1.0;
    const effect = EFFECTS[condition] || { hco3: 0, pco2: 0 };
    
    pco2Delta += (effect.pco2 || 0) * severityFactor;
    hco3Delta += (effect.hco3 || 0) * severityFactor;
    
    // Mark if A-a gradient should be elevated (V/Q mismatch or shunt physiology)
    if (effect.aaElevated) aaGradientElevated = true;
    
    if (effect.ag) {
      anionGapElevated = true;
      targetAnionGap = Math.max(targetAnionGap, effect.ag * severityFactor);
    }
    if (effect.glucose) glucoseTarget = Math.max(glucoseTarget, effect.glucose * severityFactor);
    if (effect.lactate) lactateTarget = Math.max(lactateTarget, effect.lactate * severityFactor);
    if (effect.k) potassiumDelta += effect.k * severityFactor;
  }
  
  // Calculate final values
  let pco2 = Math.max(Math.min(baselinePco2 + pco2Delta, 120), 12);
  let hco3 = Math.max(Math.min(baselineHco3 + hco3Delta, 50), 4);
  let ph = 6.1 + Math.log10(hco3 / (0.03 * pco2));
  ph = Math.max(Math.min(ph, 7.8), 6.8);
  
  // Oxygenation - properly FiO2-responsive calculation
  // Calculate alveolar PO2 using alveolar gas equation
  const pao2Alveolar = fio2 * (760 - 47) - (pco2 / 0.8);
  
  // Calculate A-a gradient based on pathology
  const expectedAa = (age / 4) + 4;
  const aaGradient = aaGradientElevated ? 30 : expectedAa;
  
  // Calculate arterial PO2 from alveolar PO2 and A-a gradient
  let po2 = pao2Alveolar - aaGradient;
  
  // Apply shunt effect if present - shunted blood doesn't benefit from supplemental O2
  // Estimate shunt fraction based on severity
  let shuntFraction = 0.0;
  if (aaGradientElevated) {
    // Conditions with V/Q mismatch typically have some shunt component
    shuntFraction = 0.10; // 10% shunt for moderate lung pathology
    const venousPo2 = 40;  // Mixed venous PO2
    po2 = po2 * (1 - shuntFraction) + venousPo2 * shuntFraction;
  }
  
  // Floor at severe hypoxemia
  po2 = Math.max(po2, 30);
  
  // SaO2 from dissociation curve
  const p50 = 27 + (7.4 - ph) * 5;
  let sao2 = 100 * Math.pow(po2, 2.7) / (Math.pow(p50, 2.7) + Math.pow(po2, 2.7));
  sao2 = Math.min(Math.max(sao2, 0), 100);
  
  // Electrolytes
  let sodium = 140 + addNoise(0, 3);
  let potassium = 4.0 + potassiumDelta + addNoise(0, 0.2);
  let chloride = anionGapElevated ? sodium - targetAnionGap - hco3 : sodium - 10 - hco3;
  chloride = Math.max(Math.min(chloride, 115), 90);
  let glucose = glucoseTarget + addNoise(0, 10);
  let lactate = lactateTarget + addNoise(0, 0.3);
  
  // Add variability
  ph += addNoise(0, 0.02);
  pco2 += addNoise(0, 1);
  po2 += addNoise(0, 3);
  hco3 += addNoise(0, 0.5);
  
  // Calculated values
  const baseExcess = (hco3 - 24.4) + 14.83 * (ph - 7.4);
  const pfRatio = po2 / fio2;
  const anionGap = sodium - (chloride + hco3);
  const correctedAg = anionGap + 2.5 * (4 - 4); // Assuming normal albumin
  const deltaGap = correctedAg - 12;
  
  // Generate interpretation
  const interpretation = generateInterpretation(ph, pco2, hco3, po2, anionGap, conditions);
  
  return {
    ph: round(ph, 2),
    pco2: round(pco2, 0),
    po2: round(po2, 0),
    hco3: round(hco3, 0),
    baseExcess: round(baseExcess, 0),
    sao2: round(sao2, 0),
    fio2: round(fio2, 2),
    pao2Fio2Ratio: round(pfRatio, 0),
    aaGradient: round(pao2Alveolar - po2, 0),
    expectedAaGradient: round(expectedAa, 0),
    sodium: round(sodium, 0),
    potassium: round(potassium, 1),
    chloride: round(chloride, 0),
    glucose: round(glucose, 0),
    anionGap: round(anionGap, 0),
    correctedAnionGap: round(correctedAg, 0),
    deltaGap: round(deltaGap, 1),
    lactate: round(lactate, 1),
    hemoglobin: 14.0,
    albumin: 4.0,
    interpretation: interpretation,
    generationParams: {
      mode: 'scenario',
      conditions: conditions,
      conditionSeverities: severities,
      patientAge: age,
      fio2: fio2,
    },
  };
}

function addNoise(mean, sd) {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function round(value, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

function generateInterpretation(ph, pco2, hco3, po2, anionGap, conditions) {
  let primaryDisorder;
  let primaryDesc;
  
  if (ph >= 7.35 && ph <= 7.45) {
    if (pco2 < 35 && hco3 < 22) {
      primaryDisorder = 'Compensated Metabolic Acidosis';
    } else if (pco2 > 45 && hco3 > 26) {
      primaryDisorder = 'Compensated Respiratory Acidosis';
    } else {
      primaryDisorder = 'Normal';
    }
  } else if (ph < 7.35) {
    if (pco2 > 45) {
      primaryDisorder = 'Respiratory Acidosis';
    } else if (hco3 < 22) {
      primaryDisorder = 'Metabolic Acidosis';
    } else {
      primaryDisorder = 'Mixed Acidosis';
    }
  } else {
    if (pco2 < 35) {
      primaryDisorder = 'Respiratory Alkalosis';
    } else if (hco3 > 26) {
      primaryDisorder = 'Metabolic Alkalosis';
    } else {
      primaryDisorder = 'Mixed Alkalosis';
    }
  }
  
  const severityWord = ph < 7.2 || ph > 7.55 ? 'Severe' : ph < 7.3 || ph > 7.5 ? 'Moderate' : 'Mild';
  primaryDesc = `${severityWord} ${primaryDisorder.toLowerCase()} with pH ${ph.toFixed(2)}`;
  
  // Determine severity
  let severity;
  if (ph < 7.1 || ph > 7.6 || po2 < 40) {
    severity = 'critical';
  } else if (ph < 7.2 || ph > 7.55 || po2 < 50) {
    severity = 'severe';
  } else if (ph < 7.3 || ph > 7.5 || po2 < 60) {
    severity = 'moderate';
  } else if (ph < 7.35 || ph > 7.45 || po2 < 80) {
    severity = 'mild';
  } else {
    severity = 'normal';
  }
  
  // Teaching points
  const teachingPoints = [
    'ABG interpretation: pH → Primary disorder → Compensation → Anion gap'
  ];
  
  if (primaryDisorder.includes('Metabolic Acidosis')) {
    if (anionGap > 14) {
      teachingPoints.push('High anion gap acidosis: think MUDPILES (Methanol, Uremia, DKA, Propylene glycol, INH, Lactic acidosis, Ethylene glycol, Salicylates)');
    } else {
      teachingPoints.push('Normal anion gap acidosis: think GI losses (diarrhea), RTA, or dilutional');
    }
  }
  
  if (conditions.includes('DKA')) {
    teachingPoints.push('DKA: Potassium is often HIGH despite total body depletion - will drop with insulin');
  }
  
  if (conditions.includes('OPIOID_OVERDOSE')) {
    teachingPoints.push('Opioid OD: Pure respiratory acidosis with NORMAL A-a gradient');
  }
  
  return {
    primaryDisorder,
    primaryDisorderDescription: primaryDesc,
    compensationStatus: 'See analysis',
    compensationDescription: 'Evaluate expected compensation for the primary disorder',
    oxygenationStatus: po2 < 60 ? 'Hypoxemia' : po2 < 80 ? 'Mild hypoxemia' : 'Normal',
    oxygenationDescription: `PaO2 ${po2.toFixed(0)} mmHg`,
    anionGapStatus: anionGap > 14 ? 'Elevated' : 'Normal',
    anionGapDescription: `Anion gap ${anionGap.toFixed(0)} mEq/L`,
    severity,
    clinicalImplications: [],
    teachingPoints,
    generatingConditions: conditions,
  };
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY RESULTS
// ═══════════════════════════════════════════════════════════════

function displayResults(result) {
  document.getElementById('resultsPlaceholder').style.display = 'none';
  document.getElementById('resultsContainer').style.display = 'block';
  
  // Severity badge
  const badge = document.getElementById('severityBadge');
  const severity = result.interpretation?.severity || 'normal';
  badge.className = `severity-badge ${severity}`;
  badge.querySelector('.severity-text').textContent = severity.charAt(0).toUpperCase() + severity.slice(1);
  
  // === MEASURED VALUES ONLY ===
  // Core ABG values
  updateResultItem('result-ph', result.ph, 7.35, 7.45);
  updateResultItem('result-pco2', result.pco2, 35, 45);
  updateResultItem('result-po2', result.po2, 80, 100);
  updateResultItem('result-hco3', result.hco3, 22, 26);
  updateResultItem('result-sao2', result.sao2, 95, 100);
  updateResultItem('result-fio2', (result.fio2 * 100).toFixed(0), 21, 100);
  
  // Electrolytes (measured)
  updateResultItem('result-na', result.sodium, 136, 145);
  updateResultItem('result-k', result.potassium, 3.5, 5.0);
  updateResultItem('result-cl', result.chloride, 98, 106);
  updateResultItem('result-glucose', result.glucose, 70, 100);
  updateResultItem('result-lactate', result.lactate, 0.5, 2.0);
  updateResultItem('result-albumin', result.albumin || 4.0, 3.5, 5.0);
  
  // === WORKING OUT SECTION ===
  const workingOutContent = document.getElementById('workingOutContent');
  workingOutContent.innerHTML = generateWorkingOutSteps(result);
  
  // === FINAL INTERPRETATION ===
  const interpContent = document.getElementById('interpretationContent');
  interpContent.innerHTML = `
    <div class="final-diagnosis">
      <div class="diagnosis-primary">${result.interpretation?.primaryDisorderDescription || 'N/A'}</div>
      <div class="diagnosis-secondary">${generateFinalSummary(result)}</div>
    </div>
  `;
  
  // Teaching points
  const teachingList = document.getElementById('teachingPoints');
  teachingList.innerHTML = '';
  const points = result.interpretation?.teachingPoints || [];
  for (const point of points.slice(0, 5)) {
    const li = document.createElement('li');
    li.textContent = point;
    teachingList.appendChild(li);
  }
}

// ═══════════════════════════════════════════════════════════════
// WORKING OUT STEPS GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateWorkingOutSteps(result) {
  const steps = [];
  const ph = result.ph;
  const pco2 = result.pco2;
  const hco3 = result.hco3;
  const po2 = result.po2;
  const fio2 = result.fio2;
  const sodium = result.sodium;
  const chloride = result.chloride;
  const albumin = result.albumin || 4.0;
  const age = result.generationParams?.patientAge || 40;
  
  // STEP 1: Assess pH
  let phStatus, phStepClass, phIndicator;
  if (ph < 7.35) {
    phStatus = 'ACIDEMIA';
    phStepClass = 'step-acidemia';
    phIndicator = `<span class="result-indicator abnormal-low">↓ Acidemia</span>`;
  } else if (ph > 7.45) {
    phStatus = 'ALKALEMIA';
    phStepClass = 'step-alkalemia';
    phIndicator = `<span class="result-indicator abnormal-high">↑ Alkalemia</span>`;
  } else {
    phStatus = 'NORMAL';
    phStepClass = 'step-normal';
    phIndicator = `<span class="result-indicator normal">✓ Normal</span>`;
  }
  
  steps.push(`
    <div class="working-step ${phStepClass}">
      <div class="step-header">
        <span class="step-number">1</span>
        <span class="step-title">Assess the pH</span>
      </div>
      <div class="step-content">
        <div class="step-calculation">
          pH = <span class="highlight-value">${ph.toFixed(2)}</span>
          <span class="operator">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          Normal range: 7.35 - 7.45
        </div>
        <div class="step-result">
          ${phIndicator}
        </div>
        <div class="step-explanation">
          ${ph < 7.35 ? 'The blood is acidemic. The primary process is either respiratory acidosis (↑pCO₂) or metabolic acidosis (↓HCO₃⁻).' : 
            ph > 7.45 ? 'The blood is alkalemic. The primary process is either respiratory alkalosis (↓pCO₂) or metabolic alkalosis (↑HCO₃⁻).' :
            'pH is within normal limits. This could be normal, or there may be a mixed or compensated disorder.'}
        </div>
      </div>
    </div>
  `);
  
  // STEP 2: Identify Primary Disorder
  let primaryDisorder = '';
  let primaryType = ''; // 'metabolic_acidosis', 'metabolic_alkalosis', 'respiratory_acidosis', 'respiratory_alkalosis', 'mixed', 'normal'
  let step2Class = 'step-info';
  let pco2Status = '', hco3Status = '';
  
  if (pco2 > 45) pco2Status = '↑ elevated';
  else if (pco2 < 35) pco2Status = '↓ low';
  else pco2Status = '→ normal';
  
  if (hco3 > 26) hco3Status = '↑ elevated';
  else if (hco3 < 22) hco3Status = '↓ low';
  else hco3Status = '→ normal';
  
  if (ph < 7.35) {
    // Acidemia - check which variable matches the pH direction
    if (pco2 > 45 && hco3 < 22) {
      primaryDisorder = 'Mixed Acidosis (both respiratory and metabolic components)';
      primaryType = 'mixed_acidosis';
      step2Class = 'step-acidemia';
    } else if (pco2 > 45) {
      // High pCO2 causes acidemia → respiratory acidosis
      primaryDisorder = 'Primary Respiratory Acidosis';
      primaryType = 'respiratory_acidosis';
      step2Class = 'step-acidemia';
    } else if (hco3 < 22) {
      // Low HCO3 causes acidemia → metabolic acidosis
      primaryDisorder = 'Primary Metabolic Acidosis';
      primaryType = 'metabolic_acidosis';
      step2Class = 'step-acidemia';
    }
  } else if (ph > 7.45) {
    // Alkalemia - check which variable matches the pH direction
    if (pco2 < 35 && hco3 > 26) {
      primaryDisorder = 'Mixed Alkalosis (both respiratory and metabolic components)';
      primaryType = 'mixed_alkalosis';
      step2Class = 'step-alkalemia';
    } else if (pco2 < 35) {
      // Low pCO2 causes alkalemia → respiratory alkalosis
      primaryDisorder = 'Primary Respiratory Alkalosis';
      primaryType = 'respiratory_alkalosis';
      step2Class = 'step-alkalemia';
    } else if (hco3 > 26) {
      // High HCO3 causes alkalemia → metabolic alkalosis
      primaryDisorder = 'Primary Metabolic Alkalosis';
      primaryType = 'metabolic_alkalosis';
      step2Class = 'step-alkalemia';
    }
  } else {
    // Normal pH - likely compensated disorder
    if (pco2 < 35 && hco3 < 22) {
      primaryDisorder = 'Compensated Metabolic Acidosis (or Respiratory Alkalosis with renal compensation)';
      primaryType = 'metabolic_acidosis'; // Assume metabolic primary with respiratory compensation
      step2Class = 'step-warning';
    } else if (pco2 > 45 && hco3 > 26) {
      primaryDisorder = 'Compensated Respiratory Acidosis (chronic) or Metabolic Alkalosis';
      primaryType = 'respiratory_acidosis'; // Assume respiratory primary with metabolic compensation
      step2Class = 'step-warning';
    } else {
      primaryDisorder = 'Normal acid-base status';
      primaryType = 'normal';
      step2Class = 'step-normal';
    }
  }
  
  steps.push(`
    <div class="working-step ${step2Class}">
      <div class="step-header">
        <span class="step-number">2</span>
        <span class="step-title">Identify the Primary Disorder</span>
      </div>
      <div class="step-content">
        <div class="step-calculation">
          pCO₂ = <span class="highlight-value">${pco2.toFixed(0)}</span> mmHg (${pco2Status})
          <span class="operator">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
          HCO₃⁻ = <span class="highlight-value">${hco3.toFixed(0)}</span> mEq/L (${hco3Status})
        </div>
        <div class="step-result">
          <span class="result-indicator ${step2Class === 'step-normal' ? 'normal' : step2Class === 'step-warning' ? 'elevated' : 'abnormal-high'}">${primaryDisorder}</span>
        </div>
        <div class="step-explanation">
          ${ph < 7.35 ? 
            'In acidemia: if pCO₂ is elevated → respiratory acidosis. If HCO₃⁻ is low → metabolic acidosis.' :
            ph > 7.45 ?
            'In alkalemia: if pCO₂ is low → respiratory alkalosis. If HCO₃⁻ is elevated → metabolic alkalosis.' :
            'With normal pH, look for signs of compensation or a mixed disorder.'}
        </div>
      </div>
    </div>
  `);
  
  // STEP 3: Check Compensation - based on PRIMARY disorder identified in Step 2
  let expectedPco2, expectedHco3;
  let compensationStatus = '';
  let step3Class = 'step-info';
  let compensationCalc = '';
  
  if (primaryType === 'metabolic_acidosis') {
    // Primary Metabolic Acidosis → check respiratory compensation using Winter's formula
    expectedPco2 = (1.5 * hco3) + 8;
    compensationCalc = `<strong>For Metabolic Acidosis, check respiratory compensation:</strong><br>
      Winter's Formula: Expected pCO₂ = (1.5 × HCO₃⁻) + 8 ± 2<br>
      = (1.5 × ${hco3.toFixed(0)}) + 8 = <span class="highlight-value">${expectedPco2.toFixed(0)} ± 2</span> mmHg`;
    
    if (pco2 >= expectedPco2 - 2 && pco2 <= expectedPco2 + 2) {
      compensationStatus = 'Appropriate respiratory compensation';
      step3Class = 'step-normal';
    } else if (pco2 > expectedPco2 + 2) {
      compensationStatus = 'Concurrent respiratory acidosis (pCO₂ higher than expected)';
      step3Class = 'step-warning';
    } else {
      compensationStatus = 'Concurrent respiratory alkalosis (pCO₂ lower than expected)';
      step3Class = 'step-warning';
    }
  } else if (primaryType === 'metabolic_alkalosis') {
    // Primary Metabolic Alkalosis → check respiratory compensation
    expectedPco2 = 40 + (0.7 * (hco3 - 24));
    compensationCalc = `<strong>For Metabolic Alkalosis, check respiratory compensation:</strong><br>
      Expected pCO₂ = 40 + (0.7 × ΔHCO₃⁻)<br>
      = 40 + (0.7 × ${(hco3 - 24).toFixed(0)}) = <span class="highlight-value">${expectedPco2.toFixed(0)}</span> mmHg (± 5)`;
    
    if (Math.abs(pco2 - expectedPco2) <= 5) {
      compensationStatus = 'Appropriate respiratory compensation';
      step3Class = 'step-normal';
    } else if (pco2 > expectedPco2 + 5) {
      compensationStatus = 'Concurrent respiratory acidosis';
      step3Class = 'step-warning';
    } else {
      compensationStatus = 'Concurrent respiratory alkalosis';
      step3Class = 'step-warning';
    }
  } else if (primaryType === 'respiratory_acidosis') {
    // Primary Respiratory Acidosis → check metabolic (renal) compensation
    const acuteHco3 = 24 + ((pco2 - 40) / 10) * 1;
    const chronicHco3 = 24 + ((pco2 - 40) / 10) * 3.5;
    compensationCalc = `<strong>For Respiratory Acidosis, check metabolic compensation:</strong><br>
      Acute: HCO₃⁻ rises 1 mEq/L per 10 mmHg ↑pCO₂<br>
      &nbsp;&nbsp;Expected HCO₃⁻ = 24 + (1 × ${((pco2 - 40) / 10).toFixed(1)}) = <span class="highlight-value">${acuteHco3.toFixed(0)}</span> mEq/L<br>
      Chronic: HCO₃⁻ rises 3.5 mEq/L per 10 mmHg ↑pCO₂<br>
      &nbsp;&nbsp;Expected HCO₃⁻ = 24 + (3.5 × ${((pco2 - 40) / 10).toFixed(1)}) = <span class="highlight-value">${chronicHco3.toFixed(0)}</span> mEq/L`;
    
    if (hco3 <= acuteHco3 + 2 && hco3 >= 24) {
      compensationStatus = 'Acute respiratory acidosis (minimal renal compensation)';
      step3Class = 'step-info';
    } else if (hco3 >= chronicHco3 - 2) {
      compensationStatus = 'Chronic respiratory acidosis (full renal compensation)';
      step3Class = 'step-normal';
    } else if (hco3 > acuteHco3 + 2 && hco3 < chronicHco3 - 2) {
      compensationStatus = 'Subacute respiratory acidosis (partial compensation)';
      step3Class = 'step-info';
    } else if (hco3 < 24) {
      compensationStatus = 'Concurrent metabolic acidosis (HCO₃⁻ lower than expected)';
      step3Class = 'step-warning';
    } else {
      compensationStatus = 'Concurrent metabolic alkalosis (HCO₃⁻ higher than expected)';
      step3Class = 'step-warning';
    }
  } else if (primaryType === 'respiratory_alkalosis') {
    // Primary Respiratory Alkalosis → check metabolic (renal) compensation
    const acuteHco3 = 24 - ((40 - pco2) / 10) * 2;
    const chronicHco3 = 24 - ((40 - pco2) / 10) * 5;
    compensationCalc = `<strong>For Respiratory Alkalosis, check metabolic compensation:</strong><br>
      Acute: HCO₃⁻ falls 2 mEq/L per 10 mmHg ↓pCO₂<br>
      &nbsp;&nbsp;Expected HCO₃⁻ = 24 - (2 × ${((40 - pco2) / 10).toFixed(1)}) = <span class="highlight-value">${acuteHco3.toFixed(0)}</span> mEq/L<br>
      Chronic: HCO₃⁻ falls 5 mEq/L per 10 mmHg ↓pCO₂<br>
      &nbsp;&nbsp;Expected HCO₃⁻ = 24 - (5 × ${((40 - pco2) / 10).toFixed(1)}) = <span class="highlight-value">${chronicHco3.toFixed(0)}</span> mEq/L`;
    
    if (hco3 >= acuteHco3 - 2 && hco3 <= 24) {
      compensationStatus = 'Acute respiratory alkalosis (minimal renal compensation)';
      step3Class = 'step-info';
    } else if (hco3 <= chronicHco3 + 2) {
      compensationStatus = 'Chronic respiratory alkalosis (full renal compensation)';
      step3Class = 'step-normal';
    } else if (hco3 < acuteHco3 - 2 && hco3 > chronicHco3 + 2) {
      compensationStatus = 'Subacute respiratory alkalosis (partial compensation)';
      step3Class = 'step-info';
    } else if (hco3 > 24) {
      compensationStatus = 'Concurrent metabolic alkalosis (HCO₃⁻ higher than expected)';
      step3Class = 'step-warning';
    } else {
      compensationStatus = 'Concurrent metabolic acidosis (HCO₃⁻ lower than expected)';
      step3Class = 'step-warning';
    }
  } else if (primaryType === 'mixed_acidosis' || primaryType === 'mixed_alkalosis') {
    // Mixed disorder - both systems contributing
    compensationCalc = `<strong>Mixed disorder identified:</strong><br>
      Both pCO₂ and HCO₃⁻ are moving in the same direction (both causing ${primaryType.includes('acidosis') ? 'acidemia' : 'alkalemia'}).<br>
      This is NOT compensation - it's a dual primary disorder.`;
    compensationStatus = 'No compensation expected - dual primary disorder';
    step3Class = 'step-warning';
  } else {
    compensationCalc = 'Primary values are within normal range';
    compensationStatus = 'No significant acid-base disorder requiring compensation';
    step3Class = 'step-normal';
  }
  
  // Determine what to show as "actual" value based on primary disorder
  let actualValueDisplay = '';
  if (primaryType === 'metabolic_acidosis' || primaryType === 'metabolic_alkalosis') {
    actualValueDisplay = `Actual pCO₂ = ${pco2.toFixed(0)} mmHg`;
  } else if (primaryType === 'respiratory_acidosis' || primaryType === 'respiratory_alkalosis') {
    actualValueDisplay = `Actual HCO₃⁻ = ${hco3.toFixed(0)} mEq/L`;
  } else if (primaryType.includes('mixed')) {
    actualValueDisplay = `pCO₂ = ${pco2.toFixed(0)} mmHg, HCO₃⁻ = ${hco3.toFixed(0)} mEq/L`;
  }
  
  steps.push(`
    <div class="working-step ${step3Class}">
      <div class="step-header">
        <span class="step-number">3</span>
        <span class="step-title">Evaluate Compensation</span>
      </div>
      <div class="step-content">
        <div class="step-calculation">${compensationCalc}</div>
        ${actualValueDisplay ? `<div class="step-result">
          ${actualValueDisplay} <span class="step-arrow">→</span> 
          <span class="result-indicator ${step3Class === 'step-normal' ? 'normal' : step3Class === 'step-info' ? 'elevated' : 'abnormal-high'}">${compensationStatus}</span>
        </div>` : `<div class="step-result">
          <span class="result-indicator normal">${compensationStatus}</span>
        </div>`}
      </div>
    </div>
  `);
  
  // STEP 4: Calculate Anion Gap
  const anionGap = sodium - (chloride + hco3);
  const correctedAg = anionGap + (2.5 * (4 - albumin));
  let agStatus, step4Class;
  
  if (correctedAg > 14) {
    agStatus = 'Elevated anion gap → suggests high AG metabolic acidosis (HAGMA)';
    step4Class = 'step-warning';
  } else if (correctedAg < 6) {
    agStatus = 'Low anion gap → consider hypoalbuminemia, paraproteinemia, or lab error';
    step4Class = 'step-info';
  } else {
    agStatus = 'Normal anion gap';
    step4Class = 'step-normal';
  }
  
  steps.push(`
    <div class="working-step ${step4Class}">
      <div class="step-header">
        <span class="step-number">4</span>
        <span class="step-title">Calculate Anion Gap</span>
      </div>
      <div class="step-content">
        <div class="step-calculation">
          AG = Na⁺ − (Cl⁻ + HCO₃⁻)<br>
          AG = ${sodium.toFixed(0)} − (${chloride.toFixed(0)} + ${hco3.toFixed(0)}) = <span class="highlight-value">${anionGap.toFixed(0)}</span> mEq/L
          ${albumin !== 4.0 ? `<br><br>Albumin-corrected AG = ${anionGap.toFixed(0)} + 2.5 × (4 − ${albumin.toFixed(1)}) = <span class="highlight-value">${correctedAg.toFixed(0)}</span> mEq/L` : ''}
        </div>
        <div class="step-result">
          <span class="result-indicator ${step4Class === 'step-normal' ? 'normal' : step4Class === 'step-warning' ? 'elevated' : 'abnormal-low'}">${agStatus}</span>
        </div>
        <div class="step-explanation">
          Normal AG = 8-12 mEq/L. Elevated AG suggests: DKA, lactic acidosis, uremia, or toxic ingestion (MUDPILES mnemonic).
        </div>
      </div>
    </div>
  `);
  
  // STEP 5: Delta-Delta (if elevated AG)
  if (correctedAg > 14) {
    const deltaAg = correctedAg - 12;
    const expectedHco3 = 24 - deltaAg;
    const deltaRatio = deltaAg / (24 - hco3);
    let deltaInterpretation, step5Class;
    
    if (deltaRatio > 2) {
      deltaInterpretation = 'Ratio > 2 → concurrent metabolic alkalosis (or pre-existing high HCO₃⁻)';
      step5Class = 'step-warning';
    } else if (deltaRatio < 1) {
      deltaInterpretation = 'Ratio < 1 → concurrent non-AG (hyperchloremic) metabolic acidosis';
      step5Class = 'step-warning';
    } else {
      deltaInterpretation = 'Ratio 1-2 → pure high AG metabolic acidosis';
      step5Class = 'step-normal';
    }
    
    steps.push(`
      <div class="working-step ${step5Class}">
        <div class="step-header">
          <span class="step-number">5</span>
          <span class="step-title">Delta-Delta Analysis</span>
        </div>
        <div class="step-content">
          <div class="step-calculation">
            ΔAG = AG − 12 = ${correctedAg.toFixed(0)} − 12 = <span class="highlight-value">${deltaAg.toFixed(0)}</span><br>
            ΔHCO₃⁻ = 24 − HCO₃⁻ = 24 − ${hco3.toFixed(0)} = <span class="highlight-value">${(24 - hco3).toFixed(0)}</span><br><br>
            Ratio = ΔAG / ΔHCO₃⁻ = ${deltaAg.toFixed(0)} / ${(24 - hco3).toFixed(0)} = <span class="highlight-value">${isFinite(deltaRatio) ? deltaRatio.toFixed(1) : 'N/A'}</span>
          </div>
          <div class="step-result">
            <span class="result-indicator ${step5Class === 'step-normal' ? 'normal' : 'elevated'}">${deltaInterpretation}</span>
          </div>
          <div class="step-explanation">
            In pure HAGMA, the ΔAG should equal ΔHCO₃⁻ (ratio ≈ 1-2). Deviations suggest a concurrent acid-base disorder.
          </div>
        </div>
      </div>
    `);
  }
  
  // STEP 6: Oxygenation Assessment
  const pao2Alveolar = (fio2 * (760 - 47)) - (pco2 / 0.8);
  const aaGradient = pao2Alveolar - po2;
  const expectedAaGradient = (age / 4) + 4;
  const pfRatio = po2 / fio2;
  
  let oxyStatus, step6Class;
  if (po2 < 60) {
    oxyStatus = 'Severe hypoxemia';
    step6Class = 'step-acidemia';
  } else if (po2 < 80) {
    oxyStatus = 'Hypoxemia';
    step6Class = 'step-warning';
  } else {
    oxyStatus = 'Normal oxygenation';
    step6Class = 'step-normal';
  }
  
  let aaStatus = '';
  if (aaGradient > expectedAaGradient + 5) {
    aaStatus = 'Elevated → V/Q mismatch, shunt, or diffusion impairment';
  } else {
    aaStatus = 'Normal → hypoventilation or low FiO₂';
  }
  
  let pfStatus = '';
  if (pfRatio < 100) {
    pfStatus = 'Severe ARDS';
  } else if (pfRatio < 200) {
    pfStatus = 'Moderate ARDS';
  } else if (pfRatio < 300) {
    pfStatus = 'Mild ARDS';
  } else if (pfRatio < 400) {
    pfStatus = 'Impaired gas exchange';
  } else {
    pfStatus = 'Normal';
  }
  
  const stepNum = correctedAg > 14 ? 6 : 5;
  
  steps.push(`
    <div class="working-step ${step6Class}">
      <div class="step-header">
        <span class="step-number">${stepNum}</span>
        <span class="step-title">Assess Oxygenation</span>
      </div>
      <div class="step-content">
        <div class="step-calculation">
          <strong>A-a Gradient:</strong><br>
          PAO₂ = FiO₂ × (760 − 47) − (PaCO₂ / 0.8)<br>
          PAO₂ = ${fio2.toFixed(2)} × 713 − (${pco2.toFixed(0)} / 0.8) = <span class="highlight-value">${pao2Alveolar.toFixed(0)}</span> mmHg<br>
          A-a = PAO₂ − PaO₂ = ${pao2Alveolar.toFixed(0)} − ${po2.toFixed(0)} = <span class="highlight-value">${aaGradient.toFixed(0)}</span> mmHg<br>
          Expected A-a = (Age/4) + 4 = <span class="highlight-value">${expectedAaGradient.toFixed(0)}</span> mmHg<br><br>
          <strong>P/F Ratio:</strong><br>
          P/F = PaO₂ / FiO₂ = ${po2.toFixed(0)} / ${fio2.toFixed(2)} = <span class="highlight-value">${pfRatio.toFixed(0)}</span>
        </div>
        <div class="step-result">
          <span class="result-indicator ${step6Class === 'step-normal' ? 'normal' : step6Class === 'step-warning' ? 'elevated' : 'abnormal-low'}">${oxyStatus}</span>
          <span class="result-indicator ${aaGradient > expectedAaGradient + 5 ? 'elevated' : 'normal'}">A-a: ${aaStatus}</span>
        </div>
        <div class="step-explanation">
          P/F Ratio: ${pfStatus}. ${aaGradient > expectedAaGradient + 5 ? 
            'Elevated A-a gradient suggests intrinsic lung pathology (V/Q mismatch, shunt, or diffusion defect).' : 
            'Normal A-a gradient suggests hypoventilation or low inspired O₂ as cause of hypoxemia.'}
        </div>
      </div>
    </div>
  `);
  
  return steps.join('');
}

function generateFinalSummary(result) {
  const conditions = result.generationParams?.conditions || [];
  const conditionLabels = conditions.map(c => getConditionLabel(c)).join(', ');
  
  let summary = '';
  
  if (result.anionGap > 14) {
    summary += `High anion gap of ${result.anionGap} mEq/L suggests HAGMA. `;
  }
  
  if (result.lactate > 2.0) {
    summary += `Elevated lactate (${result.lactate} mmol/L) indicates tissue hypoperfusion or anaerobic metabolism. `;
  }
  
  if (result.pao2Fio2Ratio < 300) {
    summary += `P/F ratio of ${result.pao2Fio2Ratio} indicates significant hypoxemia. `;
  }
  
  if (conditionLabels) {
    summary += `Generated from scenario: ${conditionLabels}.`;
  }
  
  return summary || 'See step-by-step analysis above for detailed interpretation.';
}

function updateResultItem(id, value, normalLow, normalHigh) {
  const item = document.getElementById(id);
  if (!item) return;
  
  const valueEl = item.querySelector('.result-value');
  if (valueEl) {
    valueEl.textContent = typeof value === 'number' ? 
      (Number.isInteger(value) ? value : value.toFixed(1)) : value;
  }
  
  // Remove existing abnormal classes
  item.classList.remove('abnormal-low', 'abnormal-high');
  
  // Add abnormal class if outside normal range
  if (typeof value === 'number') {
    if (value < normalLow) {
      item.classList.add('abnormal-low');
    } else if (value > normalHigh) {
      item.classList.add('abnormal-high');
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function copyToClipboard() {
  if (!state.currentResult) {
    showToast('Generate a blood gas first');
    return;
  }
  
  const text = formatResultAsText(state.currentResult);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy');
  });
}

function exportJSON() {
  if (!state.currentResult) {
    showToast('Generate a blood gas first');
    return;
  }
  
  const json = JSON.stringify(state.currentResult, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'blood_gas_result.json';
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('JSON exported!', 'success');
}

function formatResultAsText(result) {
  return `
ARTERIAL BLOOD GAS RESULTS
==========================
pH:     ${result.ph}        (7.35-7.45)
pCO2:   ${result.pco2} mmHg    (35-45)
pO2:    ${result.po2} mmHg    (80-100)
HCO3:   ${result.hco3} mEq/L   (22-26)
BE:     ${result.baseExcess} mEq/L
SaO2:   ${result.sao2}%

OXYGENATION
-----------
FiO2:   ${(result.fio2 * 100).toFixed(0)}%
P/F:    ${result.pao2Fio2Ratio}
A-a:    ${result.aaGradient} mmHg

ELECTROLYTES
------------
Na:     ${result.sodium} mEq/L
K:      ${result.potassium} mEq/L
Cl:     ${result.chloride} mEq/L
Glucose:${result.glucose} mg/dL
AG:     ${result.anionGap} mEq/L
Lactate:${result.lactate} mmol/L

INTERPRETATION
--------------
${result.interpretation?.primaryDisorderDescription || 'N/A'}
${result.interpretation?.compensationDescription || ''}

Conditions: ${(result.generationParams?.conditions || []).join(', ')}
`.trim();
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

