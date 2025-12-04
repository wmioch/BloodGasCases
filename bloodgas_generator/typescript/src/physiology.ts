/**
 * Physiology Engine
 * 
 * Core physiological calculations for blood gas generation.
 */

import {
  Disorder,
  Severity,
  Compensation,
  Duration,
  PatientFactors,
} from './types';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

export const NORMAL_PH: [number, number] = [7.35, 7.45];
export const NORMAL_PCO2: [number, number] = [35, 45];
export const NORMAL_HCO3: [number, number] = [22, 26];
export const NORMAL_PO2: [number, number] = [80, 100];

const PK = 6.1; // pKa of carbonic acid
const CO2_SOLUBILITY = 0.03; // mmol/L per mmHg
const ATMOSPHERIC_PRESSURE = 760; // mmHg
const WATER_VAPOR_PRESSURE = 47; // mmHg at 37°C
const RESPIRATORY_QUOTIENT = 0.8;

// ═══════════════════════════════════════════════════════════════
// ACID-BASE CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function calculatePh(hco3: number, pco2: number): number {
  if (pco2 <= 0 || hco3 <= 0) {
    throw new Error('pCO2 and HCO3 must be positive');
  }
  const ratio = hco3 / (CO2_SOLUBILITY * pco2);
  return PK + Math.log10(ratio);
}

export function calculateHco3(ph: number, pco2: number): number {
  return CO2_SOLUBILITY * pco2 * Math.pow(10, ph - PK);
}

export function calculatePco2(ph: number, hco3: number): number {
  return hco3 / (CO2_SOLUBILITY * Math.pow(10, ph - PK));
}

export function calculateBaseExcess(ph: number, hco3: number, hemoglobin: number = 15): number {
  return (hco3 - 24.4) + (2.3 * hemoglobin + 7.7) * (ph - 7.4);
}

// ═══════════════════════════════════════════════════════════════
// COMPENSATION FORMULAS
// ═══════════════════════════════════════════════════════════════

export function expectedPco2MetabolicAcidosis(hco3: number): [number, number] {
  const expected = 1.5 * hco3 + 8;
  return [expected - 2, expected + 2];
}

export function expectedPco2MetabolicAlkalosis(hco3: number): [number, number] {
  const expected = 0.7 * hco3 + 21;
  return [expected - 2, expected + 2];
}

export function expectedHco3RespiratoryAcidosisAcute(pco2: number): [number, number] {
  const deltaPco2 = pco2 - 40;
  const expectedDeltaHco3 = deltaPco2 / 10;
  const expected = 24 + expectedDeltaHco3;
  return [expected - 2, expected + 2];
}

export function expectedHco3RespiratoryAcidosisChronic(pco2: number): [number, number] {
  const deltaPco2 = pco2 - 40;
  const expectedDeltaHco3 = 3.5 * (deltaPco2 / 10);
  const expected = 24 + expectedDeltaHco3;
  return [expected - 2, expected + 2];
}

export function expectedHco3RespiratoryAlkalosisAcute(pco2: number): [number, number] {
  const deltaPco2 = 40 - pco2;
  const expectedDeltaHco3 = 2 * (deltaPco2 / 10);
  const expected = 24 - expectedDeltaHco3;
  return [Math.max(expected - 2, 8), expected + 2];
}

export function expectedHco3RespiratoryAlkalosisChronic(pco2: number): [number, number] {
  const deltaPco2 = 40 - pco2;
  const expectedDeltaHco3 = 5 * (deltaPco2 / 10);
  const expected = 24 - expectedDeltaHco3;
  return [Math.max(expected - 2, 12), expected + 2];
}

// ═══════════════════════════════════════════════════════════════
// OXYGENATION CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function calculateAlveolarPo2(
  fio2: number,
  paco2: number,
  atmosphericPressure: number = ATMOSPHERIC_PRESSURE
): number {
  const pio2 = fio2 * (atmosphericPressure - WATER_VAPOR_PRESSURE);
  return pio2 - (paco2 / RESPIRATORY_QUOTIENT);
}

export function calculateAaGradient(
  pao2Arterial: number,
  paco2: number,
  fio2: number,
  atmosphericPressure: number = ATMOSPHERIC_PRESSURE
): number {
  const pao2Alveolar = calculateAlveolarPo2(fio2, paco2, atmosphericPressure);
  return pao2Alveolar - pao2Arterial;
}

export function expectedAaGradient(age: number): number {
  return (age / 4) + 4;
}

export function calculatePfRatio(pao2: number, fio2: number): number {
  if (fio2 <= 0) throw new Error('FiO2 must be positive');
  return pao2 / fio2;
}

export function calculateSao2(
  pao2: number,
  ph: number = 7.4,
  temperature: number = 37,
  pco2: number = 40
): number {
  const p50 = calculateP50(ph, temperature, pco2);
  const n = 2.7; // Hill coefficient
  
  if (pao2 <= 0) return 0;
  
  const sao2 = 100 * Math.pow(pao2, n) / (Math.pow(p50, n) + Math.pow(pao2, n));
  return Math.min(Math.max(sao2, 0), 100);
}

function calculateP50(
  ph: number = 7.4,
  temperature: number = 37,
  pco2: number = 40
): number {
  const baseP50 = 27;
  const phEffect = (7.4 - ph) * 5;
  const tempEffect = (temperature - 37) * 1.5;
  const co2Effect = (pco2 - 40) * 0.05;
  
  return Math.max(Math.min(baseP50 + phEffect + tempEffect + co2Effect, 40), 15);
}

// ═══════════════════════════════════════════════════════════════
// ELECTROLYTE CALCULATIONS
// ═══════════════════════════════════════════════════════════════

export function calculateAnionGap(
  sodium: number,
  chloride: number,
  hco3: number
): number {
  return sodium - (chloride + hco3);
}

export function correctAnionGapForAlbumin(
  anionGap: number,
  albumin: number,
  normalAlbumin: number = 4
): number {
  const correction = 2.5 * (normalAlbumin - albumin);
  return anionGap + correction;
}

export function calculateDeltaGap(anionGap: number, normalAg: number = 12): number {
  return anionGap - normalAg;
}

export function calculateDeltaRatio(
  anionGap: number,
  hco3: number,
  normalAg: number = 12,
  normalHco3: number = 24
): number {
  const deltaAg = anionGap - normalAg;
  const deltaHco3 = normalHco3 - hco3;
  
  if (deltaHco3 <= 0) {
    return deltaAg > 4 ? Infinity : 1;
  }
  return deltaAg / deltaHco3;
}

export function calculateOsmolality(
  sodium: number,
  glucose: number,
  bun: number = 14
): number {
  return (2 * sodium) + (glucose / 18) + (bun / 2.8);
}

// ═══════════════════════════════════════════════════════════════
// PATIENT FACTORS
// ═══════════════════════════════════════════════════════════════

export function getDefaultPatientFactors(): PatientFactors {
  return {
    age: 40,
    chronicConditions: [],
    altitudeMeters: 0,
    temperatureCelsius: 37,
    isPregnant: false,
    isMechanicallyVentilated: false,
  };
}

export function getBaselinePco2(patient: PatientFactors): number {
  let baseline = 40;
  
  if (patient.chronicConditions.includes('COPD' as any)) {
    baseline = 45;
  }
  if (patient.chronicConditions.includes('OBESITY_HYPOVENTILATION' as any)) {
    baseline = 48;
  }
  if (patient.isPregnant) {
    baseline = 32;
  }
  
  return baseline;
}

export function getBaselineHco3(patient: PatientFactors): number {
  let baseline = 24;
  
  if (patient.chronicConditions.includes('CHRONIC_KIDNEY_DISEASE' as any)) {
    baseline = 20;
  }
  if (patient.chronicConditions.includes('COPD' as any)) {
    baseline = 28;
  }
  if (patient.isPregnant) {
    baseline = 20;
  }
  
  return baseline;
}

export function getBaselineHemoglobin(patient: PatientFactors): number {
  if (patient.baselineHemoglobin) return patient.baselineHemoglobin;
  
  let baseline = 14;
  
  if (patient.chronicConditions.includes('ANEMIA_CHRONIC' as any)) {
    baseline = 9;
  } else if (patient.chronicConditions.includes('CHRONIC_KIDNEY_DISEASE' as any)) {
    baseline = 10.5;
  }
  
  if (patient.isPregnant) {
    baseline = 11.5;
  }
  
  return baseline;
}

export function getBaselineAlbumin(patient: PatientFactors): number {
  if (patient.baselineAlbumin) return patient.baselineAlbumin;
  
  let baseline = 4;
  
  if (patient.chronicConditions.includes('CIRRHOSIS' as any)) {
    baseline = 2.5;
  } else if (patient.chronicConditions.includes('CHRONIC_KIDNEY_DISEASE' as any)) {
    baseline = 3.2;
  }
  
  return baseline;
}

// ═══════════════════════════════════════════════════════════════
// VARIABILITY
// ═══════════════════════════════════════════════════════════════

let randomSeed: number | null = null;

function seededRandom(): number {
  if (randomSeed === null) {
    return Math.random();
  }
  // Simple seeded random (Mulberry32)
  let t = randomSeed += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

export function setSeed(seed: number | null): void {
  randomSeed = seed;
}

function gaussianRandom(): number {
  const u1 = seededRandom();
  const u2 = seededRandom();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function addVariability(
  value: number,
  cv: number,
  min?: number,
  max?: number
): number {
  if (cv <= 0) return value;
  
  const sd = Math.abs(value) * cv;
  let varied = value + gaussianRandom() * sd;
  
  if (min !== undefined) varied = Math.max(varied, min);
  if (max !== undefined) varied = Math.min(varied, max);
  
  return varied;
}

export const variabilityConfig = {
  ph: 0.005,
  pco2: 0.03,
  po2: 0.05,
  hco3: 0.03,
  sodium: 0.015,
  potassium: 0.05,
  chloride: 0.02,
  glucose: 0.08,
  lactate: 0.10,
};

