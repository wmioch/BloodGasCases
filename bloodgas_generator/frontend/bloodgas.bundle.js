/**
 * Blood Gas Generator Bundle
 * 
 * Self-contained blood gas generator for browser use.
 * This is the compiled/bundled version of the TypeScript library.
 */

var BloodGas = (function() {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // ENUMS
  // ═══════════════════════════════════════════════════════════════
  
  const Severity = {
    MILD: 'MILD',
    MODERATE: 'MODERATE',
    SEVERE: 'SEVERE',
  };

  const Compensation = {
    NONE: 'NONE',
    PARTIAL: 'PARTIAL',
    APPROPRIATE: 'APPROPRIATE',
    EXCESSIVE: 'EXCESSIVE',
  };

  // ═══════════════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════════════

  const NORMAL_PH = [7.35, 7.45];
  const NORMAL_PCO2 = [35, 45];
  const NORMAL_HCO3 = [22, 26];
  const PK = 6.1;
  const CO2_SOLUBILITY = 0.03;

  // ═══════════════════════════════════════════════════════════════
  // CONDITION EFFECTS (COMPREHENSIVE)
  // ═══════════════════════════════════════════════════════════════

  const CONDITION_EFFECTS = {
    // Respiratory
    COPD_EXACERBATION: { pco2: [15, 40], hco3: [4, 12], po2: [45, 65], aaElevated: true, ag: null },
    ASTHMA_ATTACK: { pco2: [-15, -5], hco3: [-4, 0], po2: [60, 85], aaElevated: true, ag: null },
    PULMONARY_EMBOLISM: { pco2: [-12, -5], hco3: [-3, 0], po2: [55, 80], aaElevated: true, ag: null },
    ARDS: { pco2: [5, 25], hco3: [-2, 4], po2: [40, 70], aaElevated: true, ag: null },
    PNEUMONIA: { pco2: [-10, 0], hco3: [-2, 0], po2: [55, 80], aaElevated: true, ag: null },
    OPIOID_OVERDOSE: { pco2: [20, 50], hco3: [0, 3], po2: [40, 65], aaElevated: false, ag: null, blocksCompensation: true },
    HYPERVENTILATION_ANXIETY: { pco2: [-20, -10], hco3: [-4, -1], po2: [100, 115], aaElevated: false, ag: null },
    HYPERVENTILATION_PAIN: { pco2: [-12, -5], hco3: [-2, 0], po2: [90, 105], aaElevated: false, ag: null },
    NEUROMUSCULAR_WEAKNESS: { pco2: [8, 25], hco3: [2, 8], po2: [60, 80], aaElevated: false, ag: null },
    
    // High AG metabolic acidosis
    DKA: { pco2: [-20, -8], hco3: [-18, -10], po2: [90, 110], aaElevated: false, ag: [20, 35], glucose: [250, 800], lactate: [2, 5], k: [-0.5, 2.0] },
    HHS: { pco2: [-8, 0], hco3: [-8, -2], po2: [85, 100], aaElevated: false, ag: [12, 20], glucose: [600, 1200], lactate: [1.5, 4] },
    LACTIC_ACIDOSIS_SEPSIS: { pco2: [-15, -5], hco3: [-14, -6], po2: [60, 90], aaElevated: true, ag: [18, 30], lactate: [4, 15] },
    LACTIC_ACIDOSIS_SHOCK: { pco2: [-18, -8], hco3: [-16, -8], po2: [50, 80], aaElevated: true, ag: [22, 35], lactate: [6, 20], k: [0.5, 2.0] },
    LACTIC_ACIDOSIS_SEIZURE: { pco2: [-10, 0], hco3: [-10, -4], po2: [70, 95], aaElevated: false, ag: [16, 24], lactate: [3, 10] },
    RENAL_FAILURE_ACUTE: { pco2: [-10, -3], hco3: [-10, -4], po2: [75, 95], aaElevated: false, ag: [14, 22], k: [0.5, 2.5] },
    RENAL_FAILURE_CHRONIC: { pco2: [-8, 0], hco3: [-8, -2], po2: [80, 100], aaElevated: false, ag: [12, 18] },
    TOXIC_INGESTION_METHANOL: { pco2: [-20, -10], hco3: [-20, -12], po2: [90, 105], aaElevated: false, ag: [25, 40] },
    TOXIC_INGESTION_ETHYLENE_GLYCOL: { pco2: [-20, -10], hco3: [-20, -12], po2: [90, 105], aaElevated: false, ag: [25, 40] },
    TOXIC_INGESTION_SALICYLATE: { pco2: [-15, -5], hco3: [-12, -4], po2: [85, 100], aaElevated: false, ag: [18, 28], lactate: [2, 6] },
    STARVATION_KETOSIS: { pco2: [-5, 0], hco3: [-6, -2], po2: [90, 100], aaElevated: false, ag: [12, 18], glucose: [50, 80] },
    ALCOHOLIC_KETOACIDOSIS: { pco2: [-12, -3], hco3: [-12, -4], po2: [85, 100], aaElevated: false, ag: [18, 28], glucose: [40, 150], lactate: [2, 5] },
    
    // Normal AG metabolic acidosis
    DIARRHEA: { pco2: [-10, -3], hco3: [-10, -4], po2: [90, 100], aaElevated: false, ag: null, k: [-1.5, -0.3], cl: [4, 12] },
    RTA_TYPE1: { pco2: [-8, -2], hco3: [-14, -6], po2: [90, 100], aaElevated: false, ag: null, k: [-1.5, -0.3] },
    RTA_TYPE2: { pco2: [-5, 0], hco3: [-8, -3], po2: [90, 100], aaElevated: false, ag: null, k: [-1.0, 0] },
    RTA_TYPE4: { pco2: [-5, 0], hco3: [-6, -2], po2: [90, 100], aaElevated: false, ag: null, k: [0.5, 2.0] },
    SALINE_INFUSION: { pco2: [-3, 0], hco3: [-4, -1], po2: [90, 100], aaElevated: false, ag: null, cl: [4, 10] },
    
    // Metabolic alkalosis
    VOMITING: { pco2: [2, 10], hco3: [4, 14], po2: [75, 90], aaElevated: false, ag: null, k: [-1.5, -0.5], cl: [-15, -5] },
    NG_SUCTION: { pco2: [3, 10], hco3: [4, 12], po2: [75, 90], aaElevated: false, ag: null, k: [-1.2, -0.3], cl: [-12, -4] },
    DIURETIC_USE: { pco2: [2, 8], hco3: [3, 10], po2: [80, 95], aaElevated: false, ag: null, k: [-1.0, -0.3], cl: [-8, -2] },
    HYPOKALEMIA: { pco2: [2, 6], hco3: [2, 8], po2: [85, 100], aaElevated: false, ag: null, k: [-1.5, -0.8] },
    HYPERALDOSTERONISM: { pco2: [2, 8], hco3: [4, 12], po2: [85, 100], aaElevated: false, ag: null, na: [2, 8], k: [-1.2, -0.5] },
    MILK_ALKALI_SYNDROME: { pco2: [4, 12], hco3: [6, 16], po2: [80, 95], aaElevated: false, ag: null },
    POST_HYPERCAPNIA: { pco2: [-5, 5], hco3: [4, 12], po2: [80, 95], aaElevated: false, ag: null },
    
    // Normal
    HEALTHY: { pco2: [-2, 2], hco3: [-1, 1], po2: [90, 100], aaElevated: false, ag: null },
    PREGNANCY: { pco2: [-10, -6], hco3: [-4, -2], po2: [100, 110], aaElevated: false, ag: null },
    HIGH_ALTITUDE: { pco2: [-12, -5], hco3: [-4, -1], po2: [55, 75], aaElevated: false, ag: null },
  };

  // ═══════════════════════════════════════════════════════════════
  // PHYSIOLOGY CALCULATIONS
  // ═══════════════════════════════════════════════════════════════

  function calculatePh(hco3, pco2) {
    return PK + Math.log10(hco3 / (CO2_SOLUBILITY * pco2));
  }

  function calculateBaseExcess(ph, hco3, hemoglobin = 14) {
    return (hco3 - 24.4) + (2.3 * hemoglobin + 7.7) * (ph - 7.4);
  }

  function calculateAlveolarPo2(fio2, paco2) {
    return fio2 * (760 - 47) - (paco2 / 0.8);
  }

  function expectedAaGradient(age) {
    return (age / 4) + 4;
  }

  function calculateSao2(pao2, ph = 7.4) {
    const p50 = 27 + (7.4 - ph) * 5;
    const n = 2.7;
    if (pao2 <= 0) return 0;
    let sao2 = 100 * Math.pow(pao2, n) / (Math.pow(p50, n) + Math.pow(pao2, n));
    return Math.min(Math.max(sao2, 0), 100);
  }

  function addVariability(value, cv, min, max) {
    const u1 = Math.random();
    const u2 = Math.random();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let varied = value + value * cv * noise;
    if (min !== undefined) varied = Math.max(varied, min);
    if (max !== undefined) varied = Math.min(varied, max);
    return varied;
  }

  // ═══════════════════════════════════════════════════════════════
  // MAIN GENERATOR
  // ═══════════════════════════════════════════════════════════════

  function generateBloodGas(options) {
    const conditions = options.conditions || [];
    const severities = options.severities || {};
    const patientFactors = options.patientFactors || {};
    const fio2 = options.fio2 || 0.21;
    const addVar = options.addVariability !== false;

    const age = patientFactors.age || 40;
    const chronicConditions = patientFactors.chronicConditions || [];

    // Baselines
    let baselinePco2 = 40;
    let baselineHco3 = 24;
    
    if (chronicConditions.includes('COPD')) baselinePco2 = 45;
    if (chronicConditions.includes('CHRONIC_KIDNEY_DISEASE')) baselineHco3 = 20;

    // Accumulate effects
    let pco2Delta = 0;
    let hco3Delta = 0;
    let po2Target = 95;
    let aaGradientElevated = false;
    let anionGapElevated = false;
    let targetAnionGap = 10;
    let sodiumDelta = 0;
    let potassiumDelta = 0;
    let chlorideDelta = 0;
    let glucoseTarget = 95;
    let lactateTarget = 1.0;
    let compensationBlocked = false;

    for (const condition of conditions) {
      const severity = severities[condition] || Severity.MODERATE;
      const severityFactor = severity === Severity.MILD ? 0.33 : severity === Severity.MODERATE ? 0.66 : 1.0;
      const effect = CONDITION_EFFECTS[condition];
      
      if (!effect) continue;

      const pco2Range = effect.pco2[1] - effect.pco2[0];
      pco2Delta += effect.pco2[0] + pco2Range * severityFactor;

      const hco3Range = effect.hco3[1] - effect.hco3[0];
      hco3Delta += effect.hco3[0] + hco3Range * severityFactor;

      const po2Range = effect.po2[1] - effect.po2[0];
      po2Target = Math.min(po2Target, effect.po2[0] + po2Range * (1 - severityFactor));

      if (effect.aaElevated) aaGradientElevated = true;

      if (effect.ag) {
        anionGapElevated = true;
        const agRange = effect.ag[1] - effect.ag[0];
        targetAnionGap = Math.max(targetAnionGap, effect.ag[0] + agRange * severityFactor);
      }

      if (effect.na) {
        const naRange = effect.na[1] - effect.na[0];
        sodiumDelta += effect.na[0] + naRange * severityFactor;
      }

      if (effect.k) {
        const kRange = effect.k[1] - effect.k[0];
        potassiumDelta += effect.k[0] + kRange * severityFactor;
      }

      if (effect.cl) {
        const clRange = effect.cl[1] - effect.cl[0];
        chlorideDelta += effect.cl[0] + clRange * severityFactor;
      }

      if (effect.glucose) {
        const gRange = effect.glucose[1] - effect.glucose[0];
        glucoseTarget = Math.max(glucoseTarget, effect.glucose[0] + gRange * severityFactor);
      }

      if (effect.lactate) {
        const lRange = effect.lactate[1] - effect.lactate[0];
        lactateTarget = Math.max(lactateTarget, effect.lactate[0] + lRange * severityFactor);
      }

      if (effect.blocksCompensation) compensationBlocked = true;
    }

    // Apply compensation blocking
    if (compensationBlocked && hco3Delta < -4 && pco2Delta < 0) {
      pco2Delta *= 0.3; // Opioids block respiratory compensation
    }

    // Calculate final values
    let pco2 = Math.max(Math.min(baselinePco2 + pco2Delta, 120), 12);
    let hco3 = Math.max(Math.min(baselineHco3 + hco3Delta, 50), 4);
    let ph = calculatePh(hco3, pco2);
    ph = Math.max(Math.min(ph, 7.8), 6.8);

    // Oxygenation
    const pao2Alveolar = calculateAlveolarPo2(fio2, pco2);
    const expectedAa = expectedAaGradient(age);
    const aaGrad = aaGradientElevated ? Math.max(30, expectedAa + 15) : expectedAa;
    let po2 = pao2Alveolar - aaGrad;
    if (po2Target < 90) po2 = po2Target;
    po2 = Math.max(po2, 25);

    // Electrolytes
    let sodium = 140 + sodiumDelta;
    let potassium = 4.0 + potassiumDelta;
    let chloride = anionGapElevated 
      ? sodium - targetAnionGap - hco3 + chlorideDelta
      : sodium - 10 - hco3 + chlorideDelta;
    chloride = Math.max(Math.min(chloride, 120), 85);
    let glucose = glucoseTarget;
    let lactate = lactateTarget;

    // Apply variability
    if (addVar) {
      ph = addVariability(ph, 0.005, 6.8, 7.8);
      pco2 = addVariability(pco2, 0.03, 10, 150);
      po2 = addVariability(po2, 0.05, 20, 600);
      hco3 = addVariability(hco3, 0.03, 4, 50);
      sodium = addVariability(sodium, 0.015, 110, 180);
      potassium = addVariability(potassium, 0.05, 2, 9);
      chloride = addVariability(chloride, 0.02, 80, 130);
      glucose = addVariability(glucose, 0.08, 20, 1200);
      lactate = addVariability(lactate, 0.10, 0.3, 25);
    }

    // Calculated values
    const hemoglobin = 14;
    const albumin = 4.0;
    const sao2 = calculateSao2(po2, ph);
    const baseExcess = calculateBaseExcess(ph, hco3, hemoglobin);
    const actualAaGradient = pao2Alveolar - po2;
    const pfRatio = po2 / fio2;
    const anionGap = sodium - (chloride + hco3);
    const correctedAg = anionGap + 2.5 * (4 - albumin);
    const deltaGap = correctedAg - 12;

    // Generate interpretation
    const interpretation = generateInterpretation(ph, pco2, hco3, po2, anionGap, correctedAg, conditions);

    return {
      ph: round(ph, 2),
      pco2: round(pco2, 0),
      po2: round(po2, 0),
      hco3: round(hco3, 0),
      baseExcess: round(baseExcess, 0),
      sao2: round(sao2, 0),
      fio2: round(fio2, 2),
      pao2Fio2Ratio: round(pfRatio, 0),
      aaGradient: round(actualAaGradient, 0),
      expectedAaGradient: round(expectedAa, 0),
      sodium: round(sodium, 0),
      potassium: round(potassium, 1),
      chloride: round(chloride, 0),
      glucose: round(glucose, 0),
      anionGap: round(anionGap, 0),
      correctedAnionGap: round(correctedAg, 0),
      deltaGap: round(deltaGap, 1),
      lactate: round(lactate, 1),
      hemoglobin: hemoglobin,
      albumin: albumin,
      interpretation: interpretation,
      generationParams: {
        mode: 'scenario',
        conditions: conditions,
        conditionSeverities: severities,
        patientAge: age,
        chronicConditions: chronicConditions,
        fio2: fio2,
      },
    };
  }

  function generateInterpretation(ph, pco2, hco3, po2, anionGap, correctedAg, conditions) {
    let primaryDisorder;
    
    if (ph >= NORMAL_PH[0] && ph <= NORMAL_PH[1]) {
      if (pco2 < NORMAL_PCO2[0] && hco3 < NORMAL_HCO3[0]) {
        primaryDisorder = 'Compensated Metabolic Acidosis';
      } else if (pco2 > NORMAL_PCO2[1] && hco3 > NORMAL_HCO3[1]) {
        primaryDisorder = 'Compensated Respiratory Acidosis';
      } else {
        primaryDisorder = 'Normal';
      }
    } else if (ph < NORMAL_PH[0]) {
      if (pco2 > NORMAL_PCO2[1] && hco3 < NORMAL_HCO3[0]) {
        primaryDisorder = 'Mixed Respiratory and Metabolic Acidosis';
      } else if (pco2 > NORMAL_PCO2[1]) {
        primaryDisorder = 'Respiratory Acidosis';
      } else {
        primaryDisorder = 'Metabolic Acidosis';
      }
    } else {
      if (pco2 < NORMAL_PCO2[0] && hco3 > NORMAL_HCO3[1]) {
        primaryDisorder = 'Mixed Respiratory and Metabolic Alkalosis';
      } else if (pco2 < NORMAL_PCO2[0]) {
        primaryDisorder = 'Respiratory Alkalosis';
      } else {
        primaryDisorder = 'Metabolic Alkalosis';
      }
    }

    const severityWord = ph < 7.2 || ph > 7.55 ? 'Severe' : ph < 7.3 || ph > 7.5 ? 'Moderate' : 'Mild';
    const primaryDesc = primaryDisorder === 'Normal' 
      ? 'Normal acid-base status' 
      : `${severityWord} ${primaryDisorder.toLowerCase()} with pH ${ph.toFixed(2)}`;

    let severity;
    if (ph < 7.1 || ph > 7.6 || po2 < 40) severity = 'critical';
    else if (ph < 7.2 || ph > 7.55 || po2 < 50) severity = 'severe';
    else if (ph < 7.3 || ph > 7.5 || po2 < 60) severity = 'moderate';
    else if (ph < 7.35 || ph > 7.45 || po2 < 80) severity = 'mild';
    else severity = 'normal';

    // Compensation
    let compensationDesc = 'N/A';
    if (primaryDisorder.includes('Metabolic Acidosis')) {
      const expectedPco2 = 1.5 * hco3 + 8;
      if (pco2 >= expectedPco2 - 2 && pco2 <= expectedPco2 + 2) {
        compensationDesc = `Appropriate respiratory compensation (expected pCO2: ${expectedPco2.toFixed(0)} ± 2)`;
      } else if (pco2 < expectedPco2 - 2) {
        compensationDesc = 'Concurrent respiratory alkalosis (pCO2 lower than expected)';
      } else {
        compensationDesc = 'Concurrent respiratory acidosis or impaired compensation';
      }
    } else if (primaryDisorder.includes('Metabolic Alkalosis')) {
      const expectedPco2 = 0.7 * hco3 + 21;
      compensationDesc = `Expected pCO2: ${expectedPco2.toFixed(0)} ± 2`;
    }

    // Teaching points
    const teachingPoints = ['ABG interpretation: pH → Primary disorder → Compensation → Anion gap'];
    
    if (primaryDisorder.includes('Metabolic Acidosis')) {
      if (correctedAg > 14) {
        teachingPoints.push('High anion gap acidosis: think MUDPILES (Methanol, Uremia, DKA, Propylene glycol, INH, Lactic acidosis, Ethylene glycol, Salicylates)');
        
        const deltaRatio = (correctedAg - 12) / (24 - hco3);
        if (hco3 < 24) {
          if (deltaRatio < 1) {
            teachingPoints.push('Delta ratio < 1: concurrent non-anion gap metabolic acidosis');
          } else if (deltaRatio > 2) {
            teachingPoints.push('Delta ratio > 2: concurrent metabolic alkalosis or pre-existing high HCO3');
          }
        }
      } else {
        teachingPoints.push('Normal anion gap acidosis: GI bicarbonate loss (diarrhea), RTA, or dilutional');
      }
    }

    return {
      primaryDisorder,
      primaryDisorderDescription: primaryDesc,
      compensationStatus: compensationDesc.includes('Appropriate') ? 'Appropriate' : 'See analysis',
      compensationDescription: compensationDesc,
      oxygenationStatus: po2 < 60 ? 'Severe hypoxemia' : po2 < 80 ? 'Mild hypoxemia' : 'Normal',
      oxygenationDescription: `PaO2 ${po2.toFixed(0)} mmHg`,
      anionGapStatus: correctedAg > 14 ? 'Elevated' : 'Normal',
      anionGapDescription: `Anion gap ${anionGap.toFixed(0)} mEq/L (corrected: ${correctedAg.toFixed(0)})`,
      severity,
      clinicalImplications: [],
      teachingPoints,
      generatingConditions: conditions,
    };
  }

  function round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════════════

  return {
    generateBloodGas,
    Severity,
    Compensation,
    CONDITION_EFFECTS,
  };

})();

// Make available globally
if (typeof window !== 'undefined') {
  window.BloodGas = BloodGas;
}

