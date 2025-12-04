/**
 * Blood Gas Generator
 * 
 * Main generation engine for TypeScript.
 */

import {
  Disorder,
  Severity,
  Compensation,
  Duration,
  ClinicalCondition,
  PatientFactors,
  BloodGasResult,
  ClinicalInterpretation,
  GenerationParams,
  InterpretationSeverity,
  DisorderGenerationOptions,
  ScenarioGenerationOptions,
  isScenarioOptions,
  GenerationOptions,
} from './types';

import {
  calculatePh,
  calculateHco3,
  calculateBaseExcess,
  calculateAlveolarPo2,
  calculateAaGradient,
  expectedAaGradient,
  calculatePfRatio,
  calculateSao2,
  calculateAnionGap,
  correctAnionGapForAlbumin,
  calculateDeltaGap,
  expectedPco2MetabolicAcidosis,
  expectedPco2MetabolicAlkalosis,
  getDefaultPatientFactors,
  getBaselinePco2,
  getBaselineHco3,
  getBaselineHemoglobin,
  getBaselineAlbumin,
  setSeed,
  addVariability,
  variabilityConfig,
  NORMAL_PH,
  NORMAL_PCO2,
  NORMAL_HCO3,
} from './physiology';

import { getConditionEffect, CONDITION_EFFECTS } from './conditions';

// ═══════════════════════════════════════════════════════════════
// MAIN GENERATOR FUNCTION
// ═══════════════════════════════════════════════════════════════

export function generateBloodGas(options: GenerationOptions): BloodGasResult {
  // Set seed if provided
  if ('seed' in options && options.seed !== undefined) {
    setSeed(options.seed);
  } else {
    setSeed(null);
  }
  
  // Get patient factors
  const patient: PatientFactors = {
    ...getDefaultPatientFactors(),
    ...(options.patientFactors || {}),
  };
  
  const fio2 = options.fio2 ?? 0.21;
  const addVar = options.addVariability ?? true;
  
  if (isScenarioOptions(options)) {
    return generateFromScenarios(options, patient, fio2, addVar);
  } else {
    return generateFromDisorder(options, patient, fio2, addVar);
  }
}

// ═══════════════════════════════════════════════════════════════
// DISORDER-BASED GENERATION
// ═══════════════════════════════════════════════════════════════

function generateFromDisorder(
  options: DisorderGenerationOptions,
  patient: PatientFactors,
  fio2: number,
  addVar: boolean
): BloodGasResult {
  const disorder = options.primaryDisorder;
  const severity = options.severity ?? Severity.MODERATE;
  const compensation = options.compensation ?? Compensation.APPROPRIATE;
  const duration = options.duration ?? Duration.ACUTE;
  
  // Get baselines
  const baselinePco2 = getBaselinePco2(patient);
  const baselineHco3 = getBaselineHco3(patient);
  const hemoglobin = getBaselineHemoglobin(patient);
  const albumin = getBaselineAlbumin(patient);
  
  // Generate acid-base values based on disorder
  let ph: number, pco2: number, hco3: number;
  
  if (disorder === Disorder.NORMAL) {
    ph = 7.40;
    pco2 = baselinePco2;
    hco3 = baselineHco3;
  } else if (disorder === Disorder.METABOLIC_ACIDOSIS) {
    hco3 = severity === Severity.MILD ? 18 : severity === Severity.MODERATE ? 14 : 8;
    const expectedPco2 = expectedPco2MetabolicAcidosis(hco3);
    pco2 = compensation === Compensation.APPROPRIATE 
      ? (expectedPco2[0] + expectedPco2[1]) / 2
      : compensation === Compensation.NONE ? baselinePco2 : expectedPco2[1];
    ph = calculatePh(hco3, pco2);
  } else if (disorder === Disorder.METABOLIC_ALKALOSIS) {
    hco3 = severity === Severity.MILD ? 30 : severity === Severity.MODERATE ? 36 : 42;
    const expectedPco2 = expectedPco2MetabolicAlkalosis(hco3);
    pco2 = compensation === Compensation.APPROPRIATE
      ? (expectedPco2[0] + expectedPco2[1]) / 2
      : baselinePco2;
    ph = calculatePh(hco3, pco2);
  } else if (disorder === Disorder.RESPIRATORY_ACIDOSIS) {
    pco2 = severity === Severity.MILD ? 52 : severity === Severity.MODERATE ? 65 : 85;
    hco3 = duration === Duration.CHRONIC ? baselineHco3 + (pco2 - 40) * 0.35 : baselineHco3 + (pco2 - 40) * 0.1;
    ph = calculatePh(hco3, pco2);
  } else { // RESPIRATORY_ALKALOSIS
    pco2 = severity === Severity.MILD ? 30 : severity === Severity.MODERATE ? 24 : 18;
    hco3 = duration === Duration.CHRONIC ? baselineHco3 - (40 - pco2) * 0.5 : baselineHco3 - (40 - pco2) * 0.2;
    ph = calculatePh(hco3, pco2);
  }
  
  // Generate oxygenation using pathology-based approach
  const aaGradientElevated = disorder === Disorder.RESPIRATORY_ACIDOSIS;
  // For respiratory acidosis, assume moderate V/Q mismatch with small shunt
  const targetAaGrad = aaGradientElevated ? 30.0 : expectedAaGradient(patient.age);
  const shuntFrac = aaGradientElevated ? 0.10 : 0.0;
  
  // Calculate alveolar PO2 and apply pathology
  const alveolarPo2 = calculateAlveolarPo2(fio2, pco2);
  let po2 = alveolarPo2 - targetAaGrad;
  
  // Apply shunt effect
  if (shuntFrac > 0) {
    const venousPo2 = 40;
    po2 = po2 * (1 - shuntFrac) + venousPo2 * shuntFrac;
  }
  
  po2 = Math.max(po2, 30);  // Floor at 30 mmHg (near-death severe hypoxemia)
  
  // Generate electrolytes
  let sodium = 140;
  let potassium = 4.0;
  let chloride = sodium - 10 - hco3; // From AG equation
  let glucose = 95;
  let lactate = disorder === Disorder.METABOLIC_ACIDOSIS ? 3.0 : 1.0;
  
  // Apply variability
  if (addVar) {
    ph = addVariability(ph, variabilityConfig.ph, 6.8, 7.8);
    pco2 = addVariability(pco2, variabilityConfig.pco2, 10, 150);
    po2 = addVariability(po2, variabilityConfig.po2, 20, 600);
    hco3 = addVariability(hco3, variabilityConfig.hco3, 4, 50);
    sodium = addVariability(sodium, variabilityConfig.sodium, 110, 180);
    potassium = addVariability(potassium, variabilityConfig.potassium, 2, 9);
    chloride = addVariability(chloride, variabilityConfig.chloride, 80, 130);
    glucose = addVariability(glucose, variabilityConfig.glucose, 20, 1200);
    lactate = addVariability(lactate, variabilityConfig.lactate, 0.3, 25);
  }
  
  // Calculate derived values
  const sao2 = calculateSao2(po2, ph);
  const baseExcess = calculateBaseExcess(ph, hco3, hemoglobin);
  const aaGradient = calculateAaGradient(po2, pco2, fio2);
  const expectedAa = expectedAaGradient(patient.age);
  const pfRatio = calculatePfRatio(po2, fio2);
  const anionGap = calculateAnionGap(sodium, chloride, hco3);
  const correctedAg = correctAnionGapForAlbumin(anionGap, albumin);
  const deltaGap = calculateDeltaGap(correctedAg);
  
  // Create interpretation
  const interpretation = createInterpretation(ph, pco2, hco3, po2, anionGap, correctedAg, fio2, patient.age);
  
  // Create generation params
  const generationParams: GenerationParams = {
    mode: 'disorder',
    primaryDisorder: disorder,
    conditions: [],
    conditionSeverities: {},
    patientAge: patient.age,
    chronicConditions: patient.chronicConditions as string[],
    fio2,
    seed: options.seed ?? null,
  };
  
  return {
    ph: round(ph, 2),
    pco2: round(pco2, 0),
    po2: round(po2, 0),
    hco3: round(hco3, 0),
    baseExcess: round(baseExcess, 0),
    sao2: round(sao2, 0),
    fio2: round(fio2, 2),
    pao2Fio2Ratio: round(pfRatio, 0),
    aaGradient: round(aaGradient, 0),
    expectedAaGradient: round(expectedAa, 0),
    sodium: round(sodium, 0),
    potassium: round(potassium, 1),
    chloride: round(chloride, 0),
    glucose: round(glucose, 0),
    anionGap: round(anionGap, 0),
    correctedAnionGap: round(correctedAg, 0),
    deltaGap: round(deltaGap, 1),
    lactate: round(lactate, 1),
    hemoglobin: round(hemoglobin, 1),
    albumin: round(albumin, 1),
    interpretation,
    generationParams,
  };
}

// ═══════════════════════════════════════════════════════════════
// SCENARIO-BASED GENERATION
// ═══════════════════════════════════════════════════════════════

function generateFromScenarios(
  options: ScenarioGenerationOptions,
  patient: PatientFactors,
  fio2: number,
  addVar: boolean
): BloodGasResult {
  const conditions = options.conditions;
  const severities = options.severities ?? {};
  
  // Get baselines
  const baselinePco2 = getBaselinePco2(patient);
  const baselineHco3 = getBaselineHco3(patient);
  const hemoglobin = getBaselineHemoglobin(patient);
  const albumin = getBaselineAlbumin(patient);
  
  // Accumulate deltas from all conditions
  let pco2Delta = 0;
  let hco3Delta = 0;
  let aaGradientElevated = false;
  let targetAaGradient = 10.0;  // Normal baseline
  let shuntFraction = 0.0;
  let anionGapElevated = false;
  let targetAnionGap = 10;
  let sodiumDelta = 0;
  let potassiumDelta = 0;
  let glucoseTarget = 95;
  let lactateTarget = 1.0;
  let respiratoryDriveMultiplier = 1.0;
  let compensationBlocked = false;
  
  for (const condition of conditions) {
    const severity = severities[condition] ?? Severity.MODERATE;
    const effect = getConditionEffect(condition);
    
    // Severity factor
    const severityFactor = severity === Severity.MILD ? 0.33 : severity === Severity.MODERATE ? 0.66 : 1.0;
    
    // Apply effects
    const pco2Range = effect.pco2Effect[1] - effect.pco2Effect[0];
    pco2Delta += effect.pco2Effect[0] + pco2Range * severityFactor;
    
    const hco3Range = effect.hco3Effect[1] - effect.hco3Effect[0];
    hco3Delta += effect.hco3Effect[0] + hco3Range * severityFactor;
    
    // Oxygenation - now pathology-based
    aaGradientElevated = aaGradientElevated || effect.aaGradientElevated;
    
    // Calculate A-a gradient based on severity (higher severity = worse)
    const aaRange = effect.aaGradientRange[1] - effect.aaGradientRange[0];
    const conditionAaGradient = effect.aaGradientRange[0] + aaRange * severityFactor;
    targetAaGradient = Math.max(targetAaGradient, conditionAaGradient);
    
    // Calculate shunt fraction based on severity
    const shuntRange = effect.shuntFractionRange[1] - effect.shuntFractionRange[0];
    const conditionShunt = effect.shuntFractionRange[0] + shuntRange * severityFactor;
    // Combine shunts: take max and add partial contribution from other
    shuntFraction = Math.min(0.5, Math.max(shuntFraction, conditionShunt) + Math.min(shuntFraction, conditionShunt) * 0.5);
    
    if (effect.anionGapElevated) {
      anionGapElevated = true;
      const agRange = effect.typicalAnionGap[1] - effect.typicalAnionGap[0];
      targetAnionGap = Math.max(targetAnionGap, effect.typicalAnionGap[0] + agRange * severityFactor);
    }
    
    const naRange = effect.sodiumEffect[1] - effect.sodiumEffect[0];
    sodiumDelta += effect.sodiumEffect[0] + naRange * severityFactor;
    
    const kRange = effect.potassiumEffect[1] - effect.potassiumEffect[0];
    potassiumDelta += effect.potassiumEffect[0] + kRange * severityFactor;
    
    const glucoseRange = effect.glucoseEffect[1] - effect.glucoseEffect[0];
    glucoseTarget = Math.max(glucoseTarget, effect.glucoseEffect[0] + glucoseRange * severityFactor);
    
    const lactateRange = effect.lactateEffect[1] - effect.lactateEffect[0];
    lactateTarget = Math.max(lactateTarget, effect.lactateEffect[0] + lactateRange * severityFactor);
    
    if (effect.affectsRespiratoryDrive) {
      respiratoryDriveMultiplier *= effect.respiratoryDriveMultiplier;
    }
    
    if (effect.compensationBlocked) {
      compensationBlocked = true;
    }
  }
  
  // Apply compensation blocking (e.g., opioids block respiratory compensation)
  if (compensationBlocked && hco3Delta < -4 && pco2Delta < 0) {
    pco2Delta *= respiratoryDriveMultiplier;
  }
  
  // Calculate final values
  let pco2 = Math.max(Math.min(baselinePco2 + pco2Delta, 120), 12);
  let hco3 = Math.max(Math.min(baselineHco3 + hco3Delta, 50), 4);
  let ph = calculatePh(hco3, pco2);
  ph = Math.max(Math.min(ph, 7.8), 6.8);
  
  // Oxygenation - now properly calculated based on FiO2, A-a gradient, and shunt
  // Calculate alveolar PO2 using alveolar gas equation
  const alveolarPo2 = calculateAlveolarPo2(fio2, pco2);
  
  // Calculate arterial PO2 from A-a gradient
  let po2 = alveolarPo2 - targetAaGradient;
  
  // Apply shunt effect - shunted blood doesn't benefit from supplemental O2
  if (shuntFraction > 0) {
    const venousPo2 = 40;  // Approximate mixed venous PO2
    po2 = po2 * (1 - shuntFraction) + venousPo2 * shuntFraction;
  }
  
  // Ensure PO2 is physiologically possible
  po2 = Math.max(po2, 30);  // Floor at 30 mmHg (near-death severe hypoxemia)
  
  // Electrolytes
  let sodium = 140 + sodiumDelta;
  let potassium = 4.0 + potassiumDelta;
  let chloride = anionGapElevated 
    ? sodium - targetAnionGap - hco3
    : sodium - 10 - hco3;
  chloride = Math.max(Math.min(chloride, 120), 85);
  let glucose = glucoseTarget;
  let lactate = lactateTarget;
  
  // Apply variability
  if (addVar) {
    ph = addVariability(ph, variabilityConfig.ph, 6.8, 7.8);
    pco2 = addVariability(pco2, variabilityConfig.pco2, 10, 150);
    po2 = addVariability(po2, variabilityConfig.po2, 20, 600);
    hco3 = addVariability(hco3, variabilityConfig.hco3, 4, 50);
    sodium = addVariability(sodium, variabilityConfig.sodium, 110, 180);
    potassium = addVariability(potassium, variabilityConfig.potassium, 2, 9);
    chloride = addVariability(chloride, variabilityConfig.chloride, 80, 130);
    glucose = addVariability(glucose, variabilityConfig.glucose, 20, 1200);
    lactate = addVariability(lactate, variabilityConfig.lactate, 0.3, 25);
  }
  
  // Calculate derived values
  const sao2 = calculateSao2(po2, ph);
  const baseExcess = calculateBaseExcess(ph, hco3, hemoglobin);
  const aaGradient = calculateAaGradient(po2, pco2, fio2);
  const expectedAa = expectedAaGradient(patient.age);
  const pfRatio = calculatePfRatio(po2, fio2);
  const anionGap = calculateAnionGap(sodium, chloride, hco3);
  const correctedAg = correctAnionGapForAlbumin(anionGap, albumin);
  const deltaGap = calculateDeltaGap(correctedAg);
  
  // Create interpretation
  const interpretation = createInterpretation(
    ph, pco2, hco3, po2, anionGap, correctedAg, fio2, patient.age, conditions
  );
  
  // Create generation params
  const generationParams: GenerationParams = {
    mode: 'scenario',
    conditions: conditions as string[],
    conditionSeverities: Object.fromEntries(
      Object.entries(severities).map(([k, v]) => [k, v as string])
    ),
    patientAge: patient.age,
    chronicConditions: patient.chronicConditions as string[],
    fio2,
    seed: options.seed ?? null,
  };
  
  return {
    ph: round(ph, 2),
    pco2: round(pco2, 0),
    po2: round(po2, 0),
    hco3: round(hco3, 0),
    baseExcess: round(baseExcess, 0),
    sao2: round(sao2, 0),
    fio2: round(fio2, 2),
    pao2Fio2Ratio: round(pfRatio, 0),
    aaGradient: round(aaGradient, 0),
    expectedAaGradient: round(expectedAa, 0),
    sodium: round(sodium, 0),
    potassium: round(potassium, 1),
    chloride: round(chloride, 0),
    glucose: round(glucose, 0),
    anionGap: round(anionGap, 0),
    correctedAnionGap: round(correctedAg, 0),
    deltaGap: round(deltaGap, 1),
    lactate: round(lactate, 1),
    hemoglobin: round(hemoglobin, 1),
    albumin: round(albumin, 1),
    interpretation,
    generationParams,
  };
}

// ═══════════════════════════════════════════════════════════════
// INTERPRETATION
// ═══════════════════════════════════════════════════════════════

function createInterpretation(
  ph: number,
  pco2: number,
  hco3: number,
  po2: number,
  anionGap: number,
  correctedAg: number,
  fio2: number,
  age: number,
  conditions?: ClinicalCondition[]
): ClinicalInterpretation {
  // Identify primary disorder
  let primaryDisorder: string;
  let primaryDesc: string;
  
  if (ph >= NORMAL_PH[0] && ph <= NORMAL_PH[1]) {
    if (pco2 < NORMAL_PCO2[0] && hco3 < NORMAL_HCO3[0]) {
      primaryDisorder = 'Compensated Metabolic Acidosis';
    } else if (pco2 > NORMAL_PCO2[1] && hco3 > NORMAL_HCO3[1]) {
      primaryDisorder = 'Compensated Respiratory Acidosis';
    } else {
      primaryDisorder = 'Normal';
    }
  } else if (ph < NORMAL_PH[0]) {
    if (pco2 > NORMAL_PCO2[1]) {
      primaryDisorder = 'Respiratory Acidosis';
    } else if (hco3 < NORMAL_HCO3[0]) {
      primaryDisorder = 'Metabolic Acidosis';
    } else {
      primaryDisorder = 'Mixed Acidosis';
    }
  } else {
    if (pco2 < NORMAL_PCO2[0]) {
      primaryDisorder = 'Respiratory Alkalosis';
    } else if (hco3 > NORMAL_HCO3[1]) {
      primaryDisorder = 'Metabolic Alkalosis';
    } else {
      primaryDisorder = 'Mixed Alkalosis';
    }
  }
  
  const severityWord = ph < 7.2 || ph > 7.55 ? 'Severe' : ph < 7.3 || ph > 7.5 ? 'Moderate' : 'Mild';
  primaryDesc = `${severityWord} ${primaryDisorder.toLowerCase()} with pH ${ph.toFixed(2)}`;
  
  // Compensation
  let compensationStatus = 'N/A';
  let compensationDesc = 'No disorder to compensate';
  
  if (primaryDisorder !== 'Normal') {
    if (primaryDisorder.includes('Metabolic Acidosis')) {
      const expected = expectedPco2MetabolicAcidosis(hco3);
      if (pco2 >= expected[0] && pco2 <= expected[1]) {
        compensationStatus = 'Appropriate';
        compensationDesc = `pCO2 ${pco2.toFixed(0)} is appropriate for the degree of acidosis`;
      } else if (pco2 < expected[0]) {
        compensationStatus = 'Excessive';
        compensationDesc = `pCO2 lower than expected - concurrent respiratory alkalosis`;
      } else {
        compensationStatus = 'Inadequate';
        compensationDesc = `pCO2 higher than expected - concurrent respiratory acidosis`;
      }
    } else {
      compensationStatus = 'Present';
      compensationDesc = 'Compensation present';
    }
  }
  
  // Oxygenation
  let oxygenationStatus = 'Normal';
  let oxygenationDesc = `PaO2 ${po2.toFixed(0)} mmHg`;
  
  if (po2 < 60) {
    oxygenationStatus = 'Severe hypoxemia';
  } else if (po2 < 80) {
    oxygenationStatus = 'Mild hypoxemia';
  }
  
  // Anion gap
  let anionGapStatus = 'Normal';
  let anionGapDesc = `Anion gap ${anionGap.toFixed(0)} mEq/L`;
  
  if (correctedAg > 14) {
    anionGapStatus = 'Elevated';
    anionGapDesc = `Elevated anion gap (${correctedAg.toFixed(0)} corrected) - unmeasured anions present`;
  }
  
  // Severity
  let severity: InterpretationSeverity;
  if (ph < 7.1 || ph > 7.6 || po2 < 40) {
    severity = InterpretationSeverity.CRITICAL;
  } else if (ph < 7.2 || ph > 7.55 || po2 < 50) {
    severity = InterpretationSeverity.SEVERE;
  } else if (ph < 7.3 || ph > 7.5 || po2 < 60) {
    severity = InterpretationSeverity.MODERATE;
  } else if (ph < 7.35 || ph > 7.45 || po2 < 80) {
    severity = InterpretationSeverity.MILD;
  } else {
    severity = InterpretationSeverity.NORMAL;
  }
  
  // Teaching points
  const teachingPoints: string[] = [
    'ABG interpretation: pH → Primary disorder → Compensation → Anion gap',
  ];
  
  if (conditions) {
    for (const condition of conditions) {
      const effect = getConditionEffect(condition);
      teachingPoints.push(...effect.teachingPoints.slice(0, 2));
    }
  }
  
  return {
    primaryDisorder,
    primaryDisorderDescription: primaryDesc,
    compensationStatus,
    compensationDescription: compensationDesc,
    oxygenationStatus,
    oxygenationDescription: oxygenationDesc,
    anionGapStatus,
    anionGapDescription: anionGapDesc,
    severity,
    clinicalImplications: [],
    teachingPoints,
    generatingConditions: conditions?.map(c => c as string) ?? [],
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Export condition list for UI
export function getAvailableConditions(): { value: string; label: string; category: string }[] {
  const categories: Record<string, string> = {
    'COPD_EXACERBATION': 'Respiratory',
    'ASTHMA_ATTACK': 'Respiratory',
    'PULMONARY_EMBOLISM': 'Respiratory',
    'ARDS': 'Respiratory',
    'PNEUMONIA': 'Respiratory',
    'OPIOID_OVERDOSE': 'Respiratory',
    'HYPERVENTILATION_ANXIETY': 'Respiratory',
    'HYPERVENTILATION_PAIN': 'Respiratory',
    'NEUROMUSCULAR_WEAKNESS': 'Respiratory',
    'DKA': 'Metabolic Acidosis (High AG)',
    'HHS': 'Metabolic Acidosis (High AG)',
    'LACTIC_ACIDOSIS_SEPSIS': 'Metabolic Acidosis (High AG)',
    'LACTIC_ACIDOSIS_SHOCK': 'Metabolic Acidosis (High AG)',
    'LACTIC_ACIDOSIS_SEIZURE': 'Metabolic Acidosis (High AG)',
    'RENAL_FAILURE_ACUTE': 'Metabolic Acidosis (High AG)',
    'RENAL_FAILURE_CHRONIC': 'Metabolic Acidosis (High AG)',
    'TOXIC_INGESTION_METHANOL': 'Metabolic Acidosis (High AG)',
    'TOXIC_INGESTION_ETHYLENE_GLYCOL': 'Metabolic Acidosis (High AG)',
    'TOXIC_INGESTION_SALICYLATE': 'Metabolic Acidosis (High AG)',
    'STARVATION_KETOSIS': 'Metabolic Acidosis (High AG)',
    'ALCOHOLIC_KETOACIDOSIS': 'Metabolic Acidosis (High AG)',
    'DIARRHEA': 'Metabolic Acidosis (Normal AG)',
    'RTA_TYPE1': 'Metabolic Acidosis (Normal AG)',
    'RTA_TYPE2': 'Metabolic Acidosis (Normal AG)',
    'RTA_TYPE4': 'Metabolic Acidosis (Normal AG)',
    'SALINE_INFUSION': 'Metabolic Acidosis (Normal AG)',
    'VOMITING': 'Metabolic Alkalosis',
    'NG_SUCTION': 'Metabolic Alkalosis',
    'DIURETIC_USE': 'Metabolic Alkalosis',
    'HYPOKALEMIA': 'Metabolic Alkalosis',
    'HYPERALDOSTERONISM': 'Metabolic Alkalosis',
    'MILK_ALKALI_SYNDROME': 'Metabolic Alkalosis',
    'POST_HYPERCAPNIA': 'Metabolic Alkalosis',
    'HEALTHY': 'Normal',
    'PREGNANCY': 'Normal',
    'HIGH_ALTITUDE': 'Normal',
  };
  
  return Object.values(ClinicalCondition).map(value => ({
    value,
    label: formatConditionName(value),
    category: categories[value] ?? 'Other',
  }));
}

function formatConditionName(condition: string): string {
  return condition
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace('Dka', 'DKA')
    .replace('Hhs', 'HHS')
    .replace('Rta', 'RTA')
    .replace('Ng ', 'NG ')
    .replace('Copd', 'COPD')
    .replace('Ards', 'ARDS');
}

