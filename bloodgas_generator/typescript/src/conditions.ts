/**
 * Clinical Condition Definitions
 * 
 * Maps clinical conditions to their physiological effects.
 */

import {
  ClinicalCondition,
  Disorder,
  Compensation,
  ConditionEffect,
} from './types';

export const CONDITION_EFFECTS: Record<ClinicalCondition, ConditionEffect> = {
  // ═══════════════════════════════════════════════════════════════
  // RESPIRATORY CONDITIONS
  // ═══════════════════════════════════════════════════════════════
  
  [ClinicalCondition.COPD_EXACERBATION]: {
    primaryDisorder: Disorder.RESPIRATORY_ACIDOSIS,
    phRange: [7.25, 7.35, 7.42],
    pco2Effect: [15, 40],
    hco3Effect: [4, 12],
    po2Effect: [45, 65],
    aaGradientElevated: true,
    aaGradientRange: [25.0, 50.0],  // V/Q mismatch causes elevated A-a gradient
    shuntFractionRange: [0.05, 0.15],  // Small shunt component
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 110],
    lactateEffect: [0.8, 2.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'COPD exacerbation with acute-on-chronic respiratory acidosis',
    teachingPoints: [
      'COPD patients often have chronic CO2 retention with compensatory elevated HCO3',
      'Acute exacerbation causes further pCO2 rise without immediate HCO3 compensation',
      'Look for baseline ABGs to distinguish acute vs chronic changes',
      'Hypoxemia due to V/Q mismatch - A-a gradient elevated',
    ],
  },
  
  [ClinicalCondition.OPIOID_OVERDOSE]: {
    primaryDisorder: Disorder.RESPIRATORY_ACIDOSIS,
    phRange: [7.15, 7.25, 7.35],
    pco2Effect: [20, 50],
    hco3Effect: [0, 3],
    po2Effect: [40, 65],
    aaGradientElevated: false,
    aaGradientRange: [8.0, 15.0],  // NORMAL A-a gradient - lungs are fine
    shuntFractionRange: [0.0, 0.0],  // NO shunt - pure hypoventilation
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.5],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 130],
    lactateEffect: [1.5, 5.0],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: true,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 0.3,
    description: 'Opioid-induced respiratory depression',
    teachingPoints: [
      'Classic pure respiratory acidosis with NORMAL A-a gradient',
      'Hypoxemia corrects with oxygen (no V/Q mismatch)',
      'Blocks respiratory compensation for any metabolic acidosis present',
      'Calculate expected pO2: PAO2 - A-a gradient (should be normal A-a)',
    ],
  },
  
  [ClinicalCondition.ASTHMA_ATTACK]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.35, 7.45, 7.55],
    pco2Effect: [-15, -5],
    hco3Effect: [-4, 0],
    po2Effect: [60, 85],
    aaGradientElevated: true,
    aaGradientRange: [15.0, 35.0],  // V/Q mismatch from bronchospasm
    shuntFractionRange: [0.0, 0.05],  // Minimal shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [80, 140],
    lactateEffect: [1.0, 3.0],
    expectedCompensation: Compensation.PARTIAL,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.5,
    description: 'Acute asthma attack',
    teachingPoints: [
      'Early/moderate asthma: hyperventilation causes respiratory alkalosis',
      'Normal or rising pCO2 in acute asthma is ominous - indicates fatigue/impending failure',
      'Severe attack can progress to respiratory acidosis if patient tires',
      'Lactate may rise due to increased work of breathing',
    ],
  },
  
  [ClinicalCondition.PULMONARY_EMBOLISM]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.42, 7.48, 7.55],
    pco2Effect: [-12, -5],
    hco3Effect: [-3, 0],
    po2Effect: [55, 80],
    aaGradientElevated: true,
    aaGradientRange: [20.0, 45.0],  // V/Q mismatch from dead space
    shuntFractionRange: [0.05, 0.20],  // Larger PE has more shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [80, 130],
    lactateEffect: [1.0, 4.0],
    expectedCompensation: Compensation.PARTIAL,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Pulmonary embolism with hypoxemia',
    teachingPoints: [
      'Classic triad: hypoxemia, respiratory alkalosis, elevated A-a gradient',
      'Hypoxemia that doesn\'t fully correct with oxygen suggests shunt (large PE)',
      'Normal ABG does not exclude PE',
      'Lactate elevation suggests hemodynamic compromise',
    ],
  },
  
  [ClinicalCondition.ARDS]: {
    primaryDisorder: Disorder.RESPIRATORY_ACIDOSIS,
    phRange: [7.20, 7.32, 7.40],
    pco2Effect: [5, 25],
    hco3Effect: [-2, 4],
    po2Effect: [40, 70],
    aaGradientElevated: true,
    aaGradientRange: [35.0, 60.0],  // Very elevated A-a gradient
    shuntFractionRange: [0.20, 0.45],  // Significant shunt - doesn't respond well to O2
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-3, 3],
    potassiumEffect: [-0.3, 0.5],
    chlorideEffect: [-3, 3],
    glucoseEffect: [90, 180],
    lactateEffect: [2.0, 8.0],
    expectedCompensation: Compensation.PARTIAL,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Acute respiratory distress syndrome',
    teachingPoints: [
      'Defined by P/F ratio: Mild 200-300, Moderate 100-200, Severe <100',
      'Bilateral infiltrates on imaging required for diagnosis',
      'Hypoxemia refractory to oxygen due to shunt physiology',
      'May require permissive hypercapnia in lung-protective ventilation',
    ],
  },
  
  [ClinicalCondition.PNEUMONIA]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.38, 7.45, 7.52],
    pco2Effect: [-10, 0],
    hco3Effect: [-2, 0],
    po2Effect: [55, 80],
    aaGradientElevated: true,
    aaGradientRange: [20.0, 40.0],  // V/Q mismatch in consolidated lung
    shuntFractionRange: [0.05, 0.15],  // Some shunt through consolidated areas
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-3, 3],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [90, 160],
    lactateEffect: [1.0, 4.0],
    expectedCompensation: Compensation.PARTIAL,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Community or hospital-acquired pneumonia',
    teachingPoints: [
      'Typically causes respiratory alkalosis from hyperventilation',
      'A-a gradient elevated due to V/Q mismatch in affected lung',
      'Rising pCO2 may indicate respiratory failure/fatigue',
      'Can progress to ARDS or sepsis',
    ],
  },
  
  [ClinicalCondition.HYPERVENTILATION_ANXIETY]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.50, 7.55, 7.65],
    pco2Effect: [-20, -10],
    hco3Effect: [-4, -1],
    po2Effect: [100, 115],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // NORMAL A-a gradient - lungs are healthy
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-1, 1],
    potassiumEffect: [-0.3, 0.2],
    chlorideEffect: [-1, 1],
    glucoseEffect: [80, 120],
    lactateEffect: [0.8, 2.0],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.8,
    description: 'Hyperventilation syndrome / panic attack',
    teachingPoints: [
      'Acute respiratory alkalosis with normal A-a gradient',
      'pO2 often normal or elevated (no lung pathology)',
      'Symptoms (tingling, spasm) from hypocalcemia due to alkalosis',
      'Diagnosis of exclusion - rule out PE, MI, etc. first',
    ],
  },
  
  [ClinicalCondition.HYPERVENTILATION_PAIN]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.45, 7.50, 7.55],
    pco2Effect: [-12, -5],
    hco3Effect: [-2, 0],
    po2Effect: [90, 105],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-1, 1],
    potassiumEffect: [-0.2, 0.2],
    chlorideEffect: [-1, 1],
    glucoseEffect: [90, 140],
    lactateEffect: [1.0, 2.5],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.4,
    description: 'Pain-induced hyperventilation',
    teachingPoints: [
      'Pain causes tachypnea and respiratory alkalosis',
      'Important to consider underlying cause of pain',
      'May coexist with other acid-base disorders',
    ],
  },
  
  [ClinicalCondition.NEUROMUSCULAR_WEAKNESS]: {
    primaryDisorder: Disorder.RESPIRATORY_ACIDOSIS,
    phRange: [7.28, 7.35, 7.40],
    pco2Effect: [8, 25],
    hco3Effect: [2, 8],
    po2Effect: [60, 80],
    aaGradientElevated: false,
    aaGradientRange: [8.0, 15.0],  // NORMAL A-a gradient - pump failure, not lung failure
    shuntFractionRange: [0.0, 0.0],  // No shunt - lungs work fine
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 110],
    lactateEffect: [0.8, 2.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Neuromuscular respiratory failure (GBS, MG, ALS)',
    teachingPoints: [
      'Respiratory acidosis with normal A-a gradient (pump failure, not lung failure)',
      'Hypoxemia responds well to supplemental oxygen',
      'Rising pCO2 in GBS/MG crisis is indication for intubation',
      'May be chronic in ALS with compensatory elevated HCO3',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // METABOLIC ACIDOSIS - HIGH ANION GAP
  // ═══════════════════════════════════════════════════════════════
  
  [ClinicalCondition.DKA]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.00, 7.20, 7.30],
    pco2Effect: [-20, -8],
    hco3Effect: [-18, -10],
    po2Effect: [90, 110],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient - lungs are fine
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [20, 35],
    sodiumEffect: [-8, 0],
    potassiumEffect: [-0.5, 2.0],
    chlorideEffect: [-4, 2],
    glucoseEffect: [250, 800],
    lactateEffect: [2.0, 5.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.8,
    description: 'Diabetic ketoacidosis',
    teachingPoints: [
      'High anion gap metabolic acidosis from ketone bodies',
      'Kussmaul breathing (deep, rapid) is respiratory compensation',
      'Potassium is often HIGH despite total body depletion - will drop with insulin',
      'Calculate corrected sodium: add 1.6 mEq/L per 100 mg/dL glucose above 100',
      'Delta-delta ratio helps identify concurrent disorders',
    ],
  },
  
  [ClinicalCondition.HHS]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.25, 7.35, 7.42],
    pco2Effect: [-8, 0],
    hco3Effect: [-8, -2],
    po2Effect: [85, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [12, 20],
    sodiumEffect: [0, 15],
    potassiumEffect: [-0.5, 1.0],
    chlorideEffect: [-2, 4],
    glucoseEffect: [600, 1200],
    lactateEffect: [1.5, 4.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Hyperosmolar hyperglycemic state',
    teachingPoints: [
      'Less acidosis than DKA - insufficient insulin but enough to prevent ketosis',
      'Extreme hyperglycemia and dehydration',
      'Serum sodium needs correction for glucose',
      'High mortality especially in elderly',
    ],
  },
  
  [ClinicalCondition.LACTIC_ACIDOSIS_SEPSIS]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.10, 7.25, 7.35],
    pco2Effect: [-15, -5],
    hco3Effect: [-14, -6],
    po2Effect: [60, 90],
    aaGradientElevated: true,
    aaGradientRange: [20.0, 45.0],  // Elevated - often sepsis-induced lung injury
    shuntFractionRange: [0.05, 0.20],  // Some shunt from ARDS/pneumonia in sepsis
    anionGapElevated: true,
    typicalAnionGap: [18, 30],
    sodiumEffect: [-4, 4],
    potassiumEffect: [0, 1.0],
    chlorideEffect: [-4, 2],
    glucoseEffect: [100, 200],
    lactateEffect: [4.0, 15.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.3,
    description: 'Lactic acidosis from sepsis',
    teachingPoints: [
      'Lactate is key marker for tissue hypoperfusion in sepsis',
      'Type A lactic acidosis (hypoxic) from poor oxygen delivery',
      'Lactate clearance is prognostic marker',
      'May have concurrent respiratory alkalosis from sepsis-induced hyperventilation',
    ],
  },
  
  [ClinicalCondition.LACTIC_ACIDOSIS_SHOCK]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.00, 7.15, 7.25],
    pco2Effect: [-18, -8],
    hco3Effect: [-16, -8],
    po2Effect: [50, 80],
    aaGradientElevated: true,
    aaGradientRange: [25.0, 50.0],  // Elevated from pulmonary edema in shock
    shuntFractionRange: [0.10, 0.25],  // Cardiogenic shock causes pulmonary edema/shunt
    anionGapElevated: true,
    typicalAnionGap: [22, 35],
    sodiumEffect: [-4, 4],
    potassiumEffect: [0.5, 2.0],
    chlorideEffect: [-4, 2],
    glucoseEffect: [80, 180],
    lactateEffect: [6.0, 20.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.5,
    description: 'Lactic acidosis from cardiogenic/hypovolemic shock',
    teachingPoints: [
      'Severe tissue hypoxia leads to anaerobic metabolism',
      'Very high lactate (>10) associated with poor prognosis',
      'Treatment is restoring perfusion, not buffering',
      'Potassium often elevated from cellular release',
    ],
  },
  
  [ClinicalCondition.LACTIC_ACIDOSIS_SEIZURE]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.15, 7.25, 7.35],
    pco2Effect: [-10, 0],
    hco3Effect: [-10, -4],
    po2Effect: [70, 95],
    aaGradientElevated: false,
    aaGradientRange: [8.0, 15.0],  // Normal A-a gradient - lungs are fine
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [16, 24],
    sodiumEffect: [-2, 2],
    potassiumEffect: [0.3, 1.5],
    chlorideEffect: [-2, 2],
    glucoseEffect: [100, 200],
    lactateEffect: [3.0, 10.0],
    expectedCompensation: Compensation.PARTIAL,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Post-seizure lactic acidosis',
    teachingPoints: [
      'Massive muscle activity generates lactate',
      'Usually resolves within 60-90 minutes',
      'May have concurrent respiratory acidosis if post-ictal',
      'Lactate normalizes quickly without specific treatment',
    ],
  },
  
  [ClinicalCondition.RENAL_FAILURE_ACUTE]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.20, 7.30, 7.38],
    pco2Effect: [-10, -3],
    hco3Effect: [-10, -4],
    po2Effect: [75, 95],
    aaGradientElevated: false,
    aaGradientRange: [8.0, 15.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.05],  // May have mild pulmonary edema
    anionGapElevated: true,
    typicalAnionGap: [14, 22],
    sodiumEffect: [-4, 4],
    potassiumEffect: [0.5, 2.5],
    chlorideEffect: [-2, 4],
    glucoseEffect: [80, 140],
    lactateEffect: [1.0, 3.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Acute kidney injury with metabolic acidosis',
    teachingPoints: [
      'Failure to excrete daily acid load',
      'High anion gap from retained sulfates, phosphates, urate',
      'Hyperkalemia is common and dangerous',
      'May need emergent dialysis for severe acidosis/hyperkalemia',
    ],
  },
  
  [ClinicalCondition.RENAL_FAILURE_CHRONIC]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.28, 7.35, 7.40],
    pco2Effect: [-8, 0],
    hco3Effect: [-8, -2],
    po2Effect: [80, 100],
    aaGradientElevated: false,
    aaGradientRange: [8.0, 15.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [12, 18],
    sodiumEffect: [-3, 3],
    potassiumEffect: [0, 1.5],
    chlorideEffect: [-2, 4],
    glucoseEffect: [80, 130],
    lactateEffect: [0.8, 2.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Chronic kidney disease with chronic metabolic acidosis',
    teachingPoints: [
      'Compensated chronic metabolic acidosis',
      'Lower HCO3 becomes "new normal" for patient',
      'Contributes to bone disease and muscle wasting',
      'Oral bicarbonate supplementation often used',
    ],
  },
  
  [ClinicalCondition.TOXIC_INGESTION_METHANOL]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [6.90, 7.10, 7.25],
    pco2Effect: [-20, -10],
    hco3Effect: [-20, -12],
    po2Effect: [90, 105],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient - lungs fine
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [25, 40],
    sodiumEffect: [-2, 4],
    potassiumEffect: [-0.3, 0.5],
    chlorideEffect: [-4, 2],
    glucoseEffect: [70, 120],
    lactateEffect: [1.0, 3.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.6,
    description: 'Methanol poisoning',
    teachingPoints: [
      'Formic acid causes severe high AG acidosis + blindness',
      'ELEVATED OSMOLAR GAP early, then AG rises as metabolized',
      'Treatment: fomepizole, dialysis, folate',
      'Visual symptoms are pathognomonic',
    ],
  },
  
  [ClinicalCondition.TOXIC_INGESTION_ETHYLENE_GLYCOL]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [6.90, 7.10, 7.25],
    pco2Effect: [-20, -10],
    hco3Effect: [-20, -12],
    po2Effect: [90, 105],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient - lungs fine
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [25, 40],
    sodiumEffect: [-2, 4],
    potassiumEffect: [-0.3, 0.5],
    chlorideEffect: [-4, 2],
    glucoseEffect: [70, 120],
    lactateEffect: [1.0, 3.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.6,
    description: 'Ethylene glycol poisoning',
    teachingPoints: [
      'Glycolic and oxalic acid cause AG acidosis + renal failure',
      'ELEVATED OSMOLAR GAP early, then AG rises',
      'Calcium oxalate crystals in urine',
      'Treatment: fomepizole, dialysis',
    ],
  },
  
  [ClinicalCondition.TOXIC_INGESTION_SALICYLATE]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.30, 7.45, 7.55],
    pco2Effect: [-15, -5],
    hco3Effect: [-12, -4],
    po2Effect: [85, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [18, 28],
    sodiumEffect: [-3, 3],
    potassiumEffect: [-0.5, 0.3],
    chlorideEffect: [-4, 2],
    glucoseEffect: [60, 100],
    lactateEffect: [2.0, 6.0],
    expectedCompensation: Compensation.EXCESSIVE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.6,
    description: 'Salicylate toxicity',
    teachingPoints: [
      'CLASSIC MIXED DISORDER: respiratory alkalosis + metabolic acidosis',
      'Direct CNS stimulation causes respiratory alkalosis',
      'Uncouples oxidative phosphorylation causing metabolic acidosis',
      'Adults often present alkalemic, children more acidemic',
      'Alkalinize urine to enhance excretion (ion trapping)',
    ],
  },
  
  [ClinicalCondition.STARVATION_KETOSIS]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.30, 7.36, 7.40],
    pco2Effect: [-5, 0],
    hco3Effect: [-6, -2],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [12, 18],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.5, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [50, 80],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Starvation ketosis',
    teachingPoints: [
      'Mild ketoacidosis from prolonged fasting',
      'Much milder than DKA',
      'Glucose is low (opposite of DKA)',
      'Resolves with feeding',
    ],
  },
  
  [ClinicalCondition.ALCOHOLIC_KETOACIDOSIS]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.20, 7.32, 7.42],
    pco2Effect: [-12, -3],
    hco3Effect: [-12, -4],
    po2Effect: [85, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: true,
    typicalAnionGap: [18, 28],
    sodiumEffect: [-4, 2],
    potassiumEffect: [-1.0, 0.3],
    chlorideEffect: [-4, 2],
    glucoseEffect: [40, 150],
    lactateEffect: [2.0, 5.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Alcoholic ketoacidosis',
    teachingPoints: [
      'Occurs after binge drinking followed by starvation/vomiting',
      'Glucose often low or normal (not like DKA)',
      'May have concurrent metabolic alkalosis from vomiting',
      'Treats with glucose and volume - resolves quickly',
      'Nitroprusside test may be negative (beta-hydroxybutyrate predominates)',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // METABOLIC ACIDOSIS - NORMAL ANION GAP
  // ═══════════════════════════════════════════════════════════════
  
  [ClinicalCondition.DIARRHEA]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.25, 7.32, 7.38],
    pco2Effect: [-10, -3],
    hco3Effect: [-10, -4],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-4, 2],
    potassiumEffect: [-1.5, -0.3],
    chlorideEffect: [4, 12],
    glucoseEffect: [70, 110],
    lactateEffect: [0.8, 2.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Diarrhea with bicarbonate loss',
    teachingPoints: [
      'GI loss of bicarbonate causes normal AG (hyperchloremic) acidosis',
      'Chloride rises to maintain electroneutrality as HCO3 falls',
      'Hypokalemia common from GI losses',
      'Urine AG helps distinguish from RTA',
    ],
  },
  
  [ClinicalCondition.RTA_TYPE1]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.25, 7.32, 7.38],
    pco2Effect: [-8, -2],
    hco3Effect: [-14, -6],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-1.5, -0.3],
    chlorideEffect: [4, 10],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Distal (Type 1) renal tubular acidosis',
    teachingPoints: [
      'Failure to secrete H+ in distal tubule',
      'Urine pH inappropriately HIGH (>5.5) despite systemic acidosis',
      'Hypokalemia common',
      'Associated with nephrolithiasis and nephrocalcinosis',
    ],
  },
  
  [ClinicalCondition.RTA_TYPE2]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.30, 7.35, 7.40],
    pco2Effect: [-5, 0],
    hco3Effect: [-8, -3],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-1.0, 0],
    chlorideEffect: [2, 8],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Proximal (Type 2) renal tubular acidosis',
    teachingPoints: [
      'Failure to reabsorb bicarbonate in proximal tubule',
      'Sets new lower threshold for HCO3 reabsorption',
      'Once at new steady state, urine pH can be low',
      'May be part of Fanconi syndrome',
    ],
  },
  
  [ClinicalCondition.RTA_TYPE4]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.30, 7.35, 7.40],
    pco2Effect: [-5, 0],
    hco3Effect: [-6, -2],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [0.5, 2.0],
    chlorideEffect: [2, 6],
    glucoseEffect: [70, 130],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Type 4 RTA (hypoaldosteronism)',
    teachingPoints: [
      'Aldosterone deficiency or resistance',
      'HYPERKALEMIA is the hallmark (opposite of Type 1 and 2)',
      'Common in diabetics (hyporeninemic hypoaldosteronism)',
      'Mild acidosis compared to other RTAs',
    ],
  },
  
  [ClinicalCondition.SALINE_INFUSION]: {
    primaryDisorder: Disorder.METABOLIC_ACIDOSIS,
    phRange: [7.32, 7.36, 7.40],
    pco2Effect: [-3, 0],
    hco3Effect: [-4, -1],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [0, 4],
    potassiumEffect: [-0.3, 0.2],
    chlorideEffect: [4, 10],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Dilutional acidosis from normal saline',
    teachingPoints: [
      'Large volume NS (Cl- 154 mEq/L) causes hyperchloremic acidosis',
      'Chloride excess relative to sodium',
      'Usually mild and clinically insignificant',
      'Balanced crystalloids (LR, Plasmalyte) avoid this',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // METABOLIC ALKALOSIS
  // ═══════════════════════════════════════════════════════════════
  
  [ClinicalCondition.VOMITING]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.45, 7.52, 7.60],
    pco2Effect: [2, 10],
    hco3Effect: [4, 14],
    po2Effect: [75, 90],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-4, 2],
    potassiumEffect: [-1.5, -0.5],
    chlorideEffect: [-15, -5],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 2.0],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Metabolic alkalosis from vomiting',
    teachingPoints: [
      'Loss of HCl from stomach causes alkalosis',
      'HYPOCHLOREMIA and HYPOKALEMIA are hallmarks',
      'Volume depletion maintains alkalosis (avid Na/HCO3 reabsorption)',
      'Saline-responsive - give NS to correct',
      'Chloride-responsive alkalosis (urine Cl < 20)',
    ],
  },
  
  [ClinicalCondition.NG_SUCTION]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.45, 7.52, 7.58],
    pco2Effect: [3, 10],
    hco3Effect: [4, 12],
    po2Effect: [75, 90],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-3, 2],
    potassiumEffect: [-1.2, -0.3],
    chlorideEffect: [-12, -4],
    glucoseEffect: [70, 120],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Metabolic alkalosis from NG suction',
    teachingPoints: [
      'Same mechanism as vomiting - gastric HCl loss',
      'Common in post-surgical patients',
      'Replace losses with appropriate fluids',
    ],
  },
  
  [ClinicalCondition.DIURETIC_USE]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.44, 7.48, 7.55],
    pco2Effect: [2, 8],
    hco3Effect: [3, 10],
    po2Effect: [80, 95],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-4, 2],
    potassiumEffect: [-1.0, -0.3],
    chlorideEffect: [-8, -2],
    glucoseEffect: [80, 130],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Diuretic-induced metabolic alkalosis',
    teachingPoints: [
      'Loop and thiazide diuretics cause Cl/K losses',
      'Volume contraction maintains the alkalosis',
      'Saline-responsive (urine Cl < 20)',
      'Hypokalemia perpetuates H+ secretion',
    ],
  },
  
  [ClinicalCondition.HYPOKALEMIA]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.44, 7.48, 7.52],
    pco2Effect: [2, 6],
    hco3Effect: [2, 8],
    po2Effect: [85, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-1.5, -0.8],
    chlorideEffect: [-4, 0],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Metabolic alkalosis from severe hypokalemia',
    teachingPoints: [
      'K+ depletion causes intracellular H+ shift',
      'Also increases renal H+ secretion',
      'Must correct K+ to correct the alkalosis',
    ],
  },
  
  [ClinicalCondition.HYPERALDOSTERONISM]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.44, 7.50, 7.55],
    pco2Effect: [2, 8],
    hco3Effect: [4, 12],
    po2Effect: [85, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [2, 8],
    potassiumEffect: [-1.2, -0.5],
    chlorideEffect: [-6, 0],
    glucoseEffect: [80, 120],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Primary hyperaldosteronism (Conn\'s syndrome)',
    teachingPoints: [
      'Saline-RESISTANT alkalosis (urine Cl > 20)',
      'Autonomous aldosterone secretion',
      'Hypertension + hypokalemia + alkalosis is classic triad',
      'Look for adrenal adenoma or hyperplasia',
    ],
  },
  
  [ClinicalCondition.MILK_ALKALI_SYNDROME]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.48, 7.55, 7.62],
    pco2Effect: [4, 12],
    hco3Effect: [6, 16],
    po2Effect: [80, 95],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.5, 0.3],
    chlorideEffect: [-6, 0],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Milk-alkali syndrome from calcium/antacid ingestion',
    teachingPoints: [
      'Triad: hypercalcemia, alkalosis, renal insufficiency',
      'From excessive calcium carbonate (antacid) intake',
      'More common than previously thought',
    ],
  },
  
  [ClinicalCondition.POST_HYPERCAPNIA]: {
    primaryDisorder: Disorder.METABOLIC_ALKALOSIS,
    phRange: [7.45, 7.50, 7.55],
    pco2Effect: [-5, 5],
    hco3Effect: [4, 12],
    po2Effect: [80, 95],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.5, 0.3],
    chlorideEffect: [-4, 2],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Post-hypercapnic metabolic alkalosis',
    teachingPoints: [
      'After correcting chronic respiratory acidosis',
      'Elevated HCO3 (from compensation) persists while pCO2 normalizes',
      'Common when COPD patients are over-ventilated',
      'Takes days for kidneys to excrete excess bicarbonate',
    ],
  },
  
  // ═══════════════════════════════════════════════════════════════
  // NORMAL / PHYSIOLOGICAL VARIANTS
  // ═══════════════════════════════════════════════════════════════
  
  [ClinicalCondition.HEALTHY]: {
    primaryDisorder: Disorder.NORMAL,
    phRange: [7.38, 7.40, 7.42],
    pco2Effect: [-2, 2],
    hco3Effect: [-1, 1],
    po2Effect: [90, 100],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 100],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.NONE,
    compensationBlocked: false,
    affectsRespiratoryDrive: false,
    respiratoryDriveMultiplier: 1.0,
    description: 'Healthy individual with normal blood gas',
    teachingPoints: [
      'Normal ABG values for reference',
      'Small day-to-day variation is normal',
    ],
  },
  
  [ClinicalCondition.PREGNANCY]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.40, 7.44, 7.46],
    pco2Effect: [-10, -6],
    hco3Effect: [-4, -2],
    po2Effect: [100, 110],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-4, 0],
    potassiumEffect: [-0.3, 0.2],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 110],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.3,
    description: 'Normal pregnancy (chronic respiratory alkalosis)',
    teachingPoints: [
      'Progesterone stimulates respiratory center',
      'Chronic compensated respiratory alkalosis is normal',
      'Lower pCO2 baseline (28-32) and HCO3 (18-22)',
      'Important when interpreting ABGs in pregnant patients',
    ],
  },
  
  [ClinicalCondition.HIGH_ALTITUDE]: {
    primaryDisorder: Disorder.RESPIRATORY_ALKALOSIS,
    phRange: [7.42, 7.46, 7.50],
    pco2Effect: [-12, -5],
    hco3Effect: [-4, -1],
    po2Effect: [55, 75],
    aaGradientElevated: false,
    aaGradientRange: [5.0, 12.0],  // Normal A-a gradient - lungs are fine
    shuntFractionRange: [0.0, 0.0],  // No shunt
    anionGapElevated: false,
    typicalAnionGap: [8, 12],
    sodiumEffect: [-2, 2],
    potassiumEffect: [-0.3, 0.3],
    chlorideEffect: [-2, 2],
    glucoseEffect: [70, 100],
    lactateEffect: [0.5, 1.5],
    expectedCompensation: Compensation.APPROPRIATE,
    compensationBlocked: false,
    affectsRespiratoryDrive: true,
    respiratoryDriveMultiplier: 1.4,
    description: 'High altitude acclimatization',
    teachingPoints: [
      'Hypoxic drive causes hyperventilation',
      'Respiratory alkalosis develops',
      'Over days, renal compensation occurs',
      'Expected pO2 decreases with altitude',
    ],
  },
};

export function getConditionEffect(condition: ClinicalCondition): ConditionEffect {
  const effect = CONDITION_EFFECTS[condition];
  if (!effect) {
    throw new Error(`Unknown condition: ${condition}`);
  }
  return effect;
}

