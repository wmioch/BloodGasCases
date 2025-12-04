/**
 * Blood Gas Generator Library
 * 
 * A physiologically-accurate blood gas value generator for medical education.
 */

// Export all types
export * from './types';

// Export generator
export { generateBloodGas, getAvailableConditions } from './generator';

// Export physiology functions for advanced use
export {
  calculatePh,
  calculateHco3,
  calculatePco2,
  calculateBaseExcess,
  calculateAlveolarPo2,
  calculateAaGradient,
  expectedAaGradient,
  calculatePfRatio,
  calculateSao2,
  calculateAnionGap,
  correctAnionGapForAlbumin,
  calculateDeltaGap,
  calculateDeltaRatio,
  calculateOsmolality,
  expectedPco2MetabolicAcidosis,
  expectedPco2MetabolicAlkalosis,
  expectedHco3RespiratoryAcidosisAcute,
  expectedHco3RespiratoryAcidosisChronic,
  expectedHco3RespiratoryAlkalosisAcute,
  expectedHco3RespiratoryAlkalosisChronic,
  NORMAL_PH,
  NORMAL_PCO2,
  NORMAL_HCO3,
  NORMAL_PO2,
} from './physiology';

// Export condition effects for reference
export { getConditionEffect, CONDITION_EFFECTS } from './conditions';

