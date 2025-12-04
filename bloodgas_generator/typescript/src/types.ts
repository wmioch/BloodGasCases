/**
 * Blood Gas Generator Type Definitions
 * 
 * TypeScript types mirroring the Python dataclasses.
 */

// ═══════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════

export enum Disorder {
  NORMAL = 'NORMAL',
  METABOLIC_ACIDOSIS = 'METABOLIC_ACIDOSIS',
  METABOLIC_ALKALOSIS = 'METABOLIC_ALKALOSIS',
  RESPIRATORY_ACIDOSIS = 'RESPIRATORY_ACIDOSIS',
  RESPIRATORY_ALKALOSIS = 'RESPIRATORY_ALKALOSIS',
}

export enum Severity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export enum Compensation {
  NONE = 'NONE',
  PARTIAL = 'PARTIAL',
  APPROPRIATE = 'APPROPRIATE',
  EXCESSIVE = 'EXCESSIVE',
}

export enum Duration {
  ACUTE = 'ACUTE',
  SUBACUTE = 'SUBACUTE',
  CHRONIC = 'CHRONIC',
}

export enum ClinicalCondition {
  // Respiratory conditions
  COPD_EXACERBATION = 'COPD_EXACERBATION',
  ASTHMA_ATTACK = 'ASTHMA_ATTACK',
  PULMONARY_EMBOLISM = 'PULMONARY_EMBOLISM',
  ARDS = 'ARDS',
  PNEUMONIA = 'PNEUMONIA',
  OPIOID_OVERDOSE = 'OPIOID_OVERDOSE',
  HYPERVENTILATION_ANXIETY = 'HYPERVENTILATION_ANXIETY',
  HYPERVENTILATION_PAIN = 'HYPERVENTILATION_PAIN',
  NEUROMUSCULAR_WEAKNESS = 'NEUROMUSCULAR_WEAKNESS',
  
  // Metabolic acidosis - high anion gap
  DKA = 'DKA',
  HHS = 'HHS',
  LACTIC_ACIDOSIS_SEPSIS = 'LACTIC_ACIDOSIS_SEPSIS',
  LACTIC_ACIDOSIS_SHOCK = 'LACTIC_ACIDOSIS_SHOCK',
  LACTIC_ACIDOSIS_SEIZURE = 'LACTIC_ACIDOSIS_SEIZURE',
  RENAL_FAILURE_ACUTE = 'RENAL_FAILURE_ACUTE',
  RENAL_FAILURE_CHRONIC = 'RENAL_FAILURE_CHRONIC',
  TOXIC_INGESTION_METHANOL = 'TOXIC_INGESTION_METHANOL',
  TOXIC_INGESTION_ETHYLENE_GLYCOL = 'TOXIC_INGESTION_ETHYLENE_GLYCOL',
  TOXIC_INGESTION_SALICYLATE = 'TOXIC_INGESTION_SALICYLATE',
  STARVATION_KETOSIS = 'STARVATION_KETOSIS',
  ALCOHOLIC_KETOACIDOSIS = 'ALCOHOLIC_KETOACIDOSIS',
  
  // Metabolic acidosis - normal anion gap
  DIARRHEA = 'DIARRHEA',
  RTA_TYPE1 = 'RTA_TYPE1',
  RTA_TYPE2 = 'RTA_TYPE2',
  RTA_TYPE4 = 'RTA_TYPE4',
  SALINE_INFUSION = 'SALINE_INFUSION',
  
  // Metabolic alkalosis
  VOMITING = 'VOMITING',
  NG_SUCTION = 'NG_SUCTION',
  DIURETIC_USE = 'DIURETIC_USE',
  HYPOKALEMIA = 'HYPOKALEMIA',
  HYPERALDOSTERONISM = 'HYPERALDOSTERONISM',
  MILK_ALKALI_SYNDROME = 'MILK_ALKALI_SYNDROME',
  POST_HYPERCAPNIA = 'POST_HYPERCAPNIA',
  
  // Normal/physiological variants
  HEALTHY = 'HEALTHY',
  PREGNANCY = 'PREGNANCY',
  HIGH_ALTITUDE = 'HIGH_ALTITUDE',
}

export enum ChronicCondition {
  TYPE1_DIABETES = 'TYPE1_DIABETES',
  TYPE2_DIABETES = 'TYPE2_DIABETES',
  COPD = 'COPD',
  CHRONIC_KIDNEY_DISEASE = 'CHRONIC_KIDNEY_DISEASE',
  HEART_FAILURE = 'HEART_FAILURE',
  CIRRHOSIS = 'CIRRHOSIS',
  OBESITY_HYPOVENTILATION = 'OBESITY_HYPOVENTILATION',
  ANEMIA_CHRONIC = 'ANEMIA_CHRONIC',
}

export enum InterpretationSeverity {
  NORMAL = 'normal',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  CRITICAL = 'critical',
}

// ═══════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface PatientFactors {
  age: number;
  chronicConditions: ChronicCondition[];
  baselineHemoglobin?: number;
  baselineAlbumin?: number;
  baselineCreatinine?: number;
  altitudeMeters: number;
  temperatureCelsius: number;
  isPregnant: boolean;
  isMechanicallyVentilated: boolean;
}

export interface ClinicalInterpretation {
  primaryDisorder: string;
  primaryDisorderDescription: string;
  compensationStatus: string;
  compensationDescription: string;
  secondaryDisorder?: string | null;
  secondaryDisorderDescription?: string | null;
  oxygenationStatus: string;
  oxygenationDescription: string;
  anionGapStatus: string;
  anionGapDescription: string;
  deltaDeltaAnalysis?: string | null;
  severity: InterpretationSeverity;
  clinicalImplications: string[];
  teachingPoints: string[];
  generatingConditions: string[];
}

export interface GenerationParams {
  mode: 'disorder' | 'scenario';
  primaryDisorder?: string | null;
  secondaryDisorder?: string | null;
  specifiedCompensation?: string | null;
  conditions: string[];
  conditionSeverities: Record<string, string>;
  patientAge?: number | null;
  chronicConditions: string[];
  fio2: number;
  seed?: number | null;
}

export interface BloodGasResult {
  // Core ABG
  ph: number;
  pco2: number;
  po2: number;
  hco3: number;
  baseExcess: number;
  sao2: number;
  
  // Oxygenation
  fio2: number;
  pao2Fio2Ratio: number;
  aaGradient: number;
  expectedAaGradient: number;
  
  // Electrolytes
  sodium: number;
  potassium: number;
  chloride: number;
  glucose: number;
  
  // Calculated
  anionGap: number;
  correctedAnionGap: number;
  deltaGap: number;
  lactate: number;
  hemoglobin: number;
  albumin: number;
  
  // Metadata
  interpretation: ClinicalInterpretation;
  generationParams: GenerationParams;
}

// ═══════════════════════════════════════════════════════════════
// GENERATION OPTIONS
// ═══════════════════════════════════════════════════════════════

export interface DisorderGenerationOptions {
  primaryDisorder: Disorder;
  severity?: Severity;
  compensation?: Compensation;
  secondaryDisorder?: Disorder;
  duration?: Duration;
  patientFactors?: Partial<PatientFactors>;
  fio2?: number;
  addVariability?: boolean;
  seed?: number;
}

export interface ScenarioGenerationOptions {
  conditions: ClinicalCondition[];
  severities?: Partial<Record<ClinicalCondition, Severity>>;
  patientFactors?: Partial<PatientFactors>;
  fio2?: number;
  addVariability?: boolean;
  seed?: number;
}

export type GenerationOptions = DisorderGenerationOptions | ScenarioGenerationOptions;

// Type guard
export function isScenarioOptions(options: GenerationOptions): options is ScenarioGenerationOptions {
  return 'conditions' in options;
}

// ═══════════════════════════════════════════════════════════════
// CONDITION EFFECT DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface ConditionEffect {
  primaryDisorder: Disorder;
  phRange: [number, number, number];
  pco2Effect: [number, number];
  hco3Effect: [number, number];
  po2Effect: [number, number];  // Room air baseline reference
  aaGradientElevated: boolean;
  // A-a gradient range in mmHg: [mild, severe] - normal is ~10-15 for young adult
  aaGradientRange: [number, number];
  // Shunt fraction range (0-1): [mild, severe] - represents true shunt that doesn't respond to O2
  shuntFractionRange: [number, number];
  anionGapElevated: boolean;
  typicalAnionGap: [number, number];
  sodiumEffect: [number, number];
  potassiumEffect: [number, number];
  chlorideEffect: [number, number];
  glucoseEffect: [number, number];
  lactateEffect: [number, number];
  expectedCompensation: Compensation;
  compensationBlocked: boolean;
  affectsRespiratoryDrive: boolean;
  respiratoryDriveMultiplier: number;
  description: string;
  teachingPoints: string[];
}

