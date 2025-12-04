"""
Clinical Condition Definitions

Defines the physiological effects of each clinical condition
on blood gas values.
"""

from typing import Dict, Optional
from bloodgas.models.disorders import (
    ClinicalCondition,
    Disorder,
    Compensation,
    ConditionEffect,
)


# Comprehensive mapping of clinical conditions to their effects
CONDITION_EFFECTS: Dict[ClinicalCondition, ConditionEffect] = {
    
    # ═══════════════════════════════════════════════════════════════
    # RESPIRATORY CONDITIONS
    # ═══════════════════════════════════════════════════════════════
    
    ClinicalCondition.COPD_EXACERBATION: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ACIDOSIS,
        ph_range=(7.25, 7.35, 7.42),  # Often chronic, partially compensated
        pco2_effect=(5, 20),  # Elevated pCO2 - moderate range to maintain realistic room air PO2
        hco3_effect=(4, 12),  # Chronic compensation
        po2_effect=(45, 65),  # Hypoxemic on room air (reference only)
        aa_gradient_elevated=True,
        aa_gradient_range=(15.0, 32.0),  # V/Q mismatch - reduced from (25,50) for realistic PO2
        shunt_fraction_range=(0.02, 0.08),  # Small shunt - allows good O2 response
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        potassium_effect=(-0.3, 0.3),
        lactate_effect=(0.8, 2.5),
        expected_compensation=Compensation.APPROPRIATE,  # Chronic
        description="COPD exacerbation with acute-on-chronic respiratory acidosis",
        teaching_points=[
            "COPD patients often have chronic CO2 retention with compensatory elevated HCO3",
            "Acute exacerbation causes further pCO2 rise without immediate HCO3 compensation",
            "Look for baseline ABGs to distinguish acute vs chronic changes",
            "Hypoxemia due to V/Q mismatch - A-a gradient elevated but responds well to O2",
        ]
    ),
    
    ClinicalCondition.ASTHMA_ATTACK: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,  # Early, then acidosis if severe
        ph_range=(7.35, 7.45, 7.55),  # Variable depending on severity
        pco2_effect=(-15, -5),  # Low pCO2 in early/moderate attack
        hco3_effect=(-4, 0),  # Minimal acute compensation
        po2_effect=(60, 85),  # Mild hypoxemia on room air (reference only)
        aa_gradient_elevated=True,
        aa_gradient_range=(15.0, 35.0),  # V/Q mismatch from bronchospasm
        shunt_fraction_range=(0.0, 0.05),  # Minimal shunt
        anion_gap_elevated=False,
        lactate_effect=(1.0, 3.0),  # Work of breathing
        affects_respiratory_drive=True,
        respiratory_drive_multiplier=1.5,  # Hyperventilating
        description="Acute asthma attack",
        teaching_points=[
            "Early/moderate asthma: hyperventilation causes respiratory alkalosis",
            "Normal or rising pCO2 in acute asthma is ominous - indicates fatigue/impending failure",
            "Severe attack can progress to respiratory acidosis if patient tires",
            "Lactate may rise due to increased work of breathing",
        ]
    ),
    
    ClinicalCondition.PULMONARY_EMBOLISM: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,
        ph_range=(7.42, 7.48, 7.55),
        pco2_effect=(-12, -5),  # Hyperventilation response
        hco3_effect=(-3, 0),
        po2_effect=(55, 80),  # Hypoxemia on room air (reference only)
        aa_gradient_elevated=True,  # Key finding
        aa_gradient_range=(20.0, 45.0),  # V/Q mismatch from dead space
        shunt_fraction_range=(0.05, 0.20),  # Larger PE has more shunt
        anion_gap_elevated=False,
        lactate_effect=(1.0, 4.0),  # If causing shock
        description="Pulmonary embolism with hypoxemia",
        teaching_points=[
            "Classic triad: hypoxemia, respiratory alkalosis, elevated A-a gradient",
            "Hypoxemia that doesn't fully correct with oxygen suggests shunt (large PE)",
            "Normal ABG does not exclude PE",
            "Lactate elevation suggests hemodynamic compromise",
        ]
    ),
    
    ClinicalCondition.ARDS: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ACIDOSIS,  # When severe
        ph_range=(7.20, 7.32, 7.40),
        pco2_effect=(5, 25),  # May be normal early, elevated late
        hco3_effect=(-2, 4),
        po2_effect=(40, 70),  # Severe hypoxemia on room air (reference only)
        aa_gradient_elevated=True,
        aa_gradient_range=(30.0, 55.0),  # Very elevated A-a gradient - adjusted for realism
        shunt_fraction_range=(0.28, 0.45),  # Large shunt - poor response to O2 alone
        anion_gap_elevated=False,
        lactate_effect=(2.0, 8.0),  # Often associated with sepsis/shock
        description="Acute respiratory distress syndrome",
        teaching_points=[
            "Defined by P/F ratio: Mild 200-300, Moderate 100-200, Severe <100",
            "Bilateral infiltrates on imaging required for diagnosis",
            "Hypoxemia refractory to oxygen due to shunt physiology (28-45% shunt)",
            "May require permissive hypercapnia in lung-protective ventilation",
        ]
    ),
    
    ClinicalCondition.PNEUMONIA: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,  # Usually
        ph_range=(7.38, 7.45, 7.52),
        pco2_effect=(-10, 0),  # Hyperventilation from hypoxemia/fever
        hco3_effect=(-2, 0),
        po2_effect=(55, 80),  # Room air baseline (reference only)
        aa_gradient_elevated=True,
        aa_gradient_range=(20.0, 40.0),  # V/Q mismatch in consolidated lung
        shunt_fraction_range=(0.03, 0.12),  # Small shunt - responds well to O2
        anion_gap_elevated=False,
        lactate_effect=(1.0, 4.0),
        description="Community or hospital-acquired pneumonia",
        teaching_points=[
            "Typically causes respiratory alkalosis from hyperventilation",
            "A-a gradient elevated due to V/Q mismatch in affected lung",
            "Rising pCO2 may indicate respiratory failure/fatigue",
            "Can progress to ARDS or sepsis",
        ]
    ),
    
    ClinicalCondition.OPIOID_OVERDOSE: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ACIDOSIS,
        ph_range=(7.15, 7.25, 7.35),
        pco2_effect=(15, 40),  # Significant hypoventilation - adjusted for realistic PO2
        hco3_effect=(0, 3),  # Acute - minimal compensation
        po2_effect=(40, 65),  # Hypoxemia on room air from hypoventilation (reference only)
        aa_gradient_elevated=False,  # Key! Normal A-a gradient
        aa_gradient_range=(8.0, 15.0),  # NORMAL A-a gradient - lungs are fine
        shunt_fraction_range=(0.0, 0.0),  # NO shunt - pure hypoventilation
        anion_gap_elevated=False,
        lactate_effect=(1.5, 5.0),  # If hypoxic
        compensation_blocked=True,
        affects_respiratory_drive=True,
        respiratory_drive_multiplier=0.3,  # Severely depressed
        description="Opioid-induced respiratory depression",
        teaching_points=[
            "Classic pure respiratory acidosis with NORMAL A-a gradient",
            "Hypoxemia corrects EXCELLENTLY with oxygen (no V/Q mismatch, no shunt)",
            "Blocks respiratory compensation for any metabolic acidosis present",
            "Calculate expected pO2: PAO2 - A-a gradient (should be normal A-a)",
        ]
    ),
    
    ClinicalCondition.HYPERVENTILATION_ANXIETY: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,
        ph_range=(7.50, 7.55, 7.65),
        pco2_effect=(-20, -10),  # Markedly low
        hco3_effect=(-4, -1),  # Acute
        po2_effect=(100, 115),  # Normal or elevated (hyperventilating) (reference only)
        aa_gradient_elevated=False,  # Key! Normal A-a
        aa_gradient_range=(5.0, 12.0),  # NORMAL A-a gradient - lungs are healthy
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        lactate_effect=(0.8, 2.0),
        description="Hyperventilation syndrome / panic attack",
        teaching_points=[
            "Acute respiratory alkalosis with normal A-a gradient",
            "pO2 often normal or elevated (no lung pathology)",
            "Symptoms (tingling, spasm) from hypocalcemia due to alkalosis",
            "Diagnosis of exclusion - rule out PE, MI, etc. first",
        ]
    ),
    
    ClinicalCondition.HYPERVENTILATION_PAIN: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,
        ph_range=(7.45, 7.50, 7.55),
        pco2_effect=(-12, -5),
        hco3_effect=(-2, 0),
        po2_effect=(90, 105),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        lactate_effect=(1.0, 2.5),
        description="Pain-induced hyperventilation",
        teaching_points=[
            "Pain causes tachypnea and respiratory alkalosis",
            "Important to consider underlying cause of pain",
            "May coexist with other acid-base disorders",
        ]
    ),
    
    ClinicalCondition.NEUROMUSCULAR_WEAKNESS: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ACIDOSIS,
        ph_range=(7.28, 7.35, 7.40),
        pco2_effect=(8, 25),  # Hypoventilation
        hco3_effect=(2, 8),  # May be chronic
        po2_effect=(60, 80),  # Room air baseline (reference only)
        aa_gradient_elevated=False,  # Lung is normal
        aa_gradient_range=(8.0, 15.0),  # NORMAL A-a gradient - pump failure, not lung failure
        shunt_fraction_range=(0.0, 0.0),  # No shunt - lungs work fine
        anion_gap_elevated=False,
        description="Neuromuscular respiratory failure (GBS, MG, ALS)",
        teaching_points=[
            "Respiratory acidosis with normal A-a gradient (pump failure, not lung failure)",
            "Hypoxemia responds well to supplemental oxygen",
            "Rising pCO2 in GBS/MG crisis is indication for intubation",
            "May be chronic in ALS with compensatory elevated HCO3",
        ]
    ),
    
    # ═══════════════════════════════════════════════════════════════
    # METABOLIC ACIDOSIS - HIGH ANION GAP
    # ═══════════════════════════════════════════════════════════════
    
    ClinicalCondition.DKA: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.00, 7.20, 7.30),
        pco2_effect=(-20, -8),  # Kussmaul breathing compensation
        hco3_effect=(-18, -10),  # Severely low
        po2_effect=(90, 110),  # Usually normal (hyperventilating) (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient - lungs are fine
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(20, 35),
        sodium_effect=(-8, 0),  # Pseudohyponatremia from glucose
        potassium_effect=(-0.5, 2.0),  # Often elevated despite total body depletion
        glucose_effect=(250, 800),  # Diagnostic
        lactate_effect=(2.0, 5.0),  # May be mildly elevated
        affects_respiratory_drive=True,
        respiratory_drive_multiplier=1.8,  # Kussmaul breathing
        description="Diabetic ketoacidosis",
        teaching_points=[
            "High anion gap metabolic acidosis from ketone bodies",
            "Kussmaul breathing (deep, rapid) is respiratory compensation",
            "Potassium is often HIGH despite total body depletion - will drop with insulin",
            "Calculate corrected sodium: add 1.6 mEq/L per 100 mg/dL glucose above 100",
            "Delta-delta ratio helps identify concurrent disorders",
        ]
    ),
    
    ClinicalCondition.HHS: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,  # Milder than DKA
        ph_range=(7.25, 7.35, 7.42),
        pco2_effect=(-8, 0),
        hco3_effect=(-8, -2),
        po2_effect=(85, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,  # Mildly elevated
        typical_anion_gap=(12, 20),
        sodium_effect=(0, 15),  # Often high due to dehydration
        glucose_effect=(600, 1200),  # Very high
        lactate_effect=(1.5, 4.0),
        description="Hyperosmolar hyperglycemic state",
        teaching_points=[
            "Less acidosis than DKA - insufficient insulin but enough to prevent ketosis",
            "Extreme hyperglycemia and dehydration",
            "Serum sodium needs correction for glucose",
            "High mortality especially in elderly",
        ]
    ),
    
    ClinicalCondition.LACTIC_ACIDOSIS_SEPSIS: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.10, 7.25, 7.35),
        pco2_effect=(-15, -5),  # Compensation
        hco3_effect=(-14, -6),
        po2_effect=(60, 90),  # Room air baseline (reference only)
        aa_gradient_elevated=True,  # Often from lung involvement
        aa_gradient_range=(20.0, 45.0),  # Elevated - often sepsis-induced lung injury
        shunt_fraction_range=(0.05, 0.20),  # Some shunt from ARDS/pneumonia in sepsis
        anion_gap_elevated=True,
        typical_anion_gap=(18, 30),
        lactate_effect=(4.0, 15.0),  # Key marker
        potassium_effect=(0, 1.0),
        description="Lactic acidosis from sepsis",
        teaching_points=[
            "Lactate is key marker for tissue hypoperfusion in sepsis",
            "Type A lactic acidosis (hypoxic) from poor oxygen delivery",
            "Lactate clearance is prognostic marker",
            "May have concurrent respiratory alkalosis from sepsis-induced hyperventilation",
        ]
    ),
    
    ClinicalCondition.LACTIC_ACIDOSIS_SHOCK: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.00, 7.15, 7.25),
        pco2_effect=(-18, -8),
        hco3_effect=(-16, -8),
        po2_effect=(50, 80),  # Room air baseline (reference only)
        aa_gradient_elevated=True,
        aa_gradient_range=(25.0, 50.0),  # Elevated from pulmonary edema in shock
        shunt_fraction_range=(0.10, 0.25),  # Cardiogenic shock causes pulmonary edema/shunt
        anion_gap_elevated=True,
        typical_anion_gap=(22, 35),
        lactate_effect=(6.0, 20.0),  # Very high
        potassium_effect=(0.5, 2.0),  # Released from cells
        description="Lactic acidosis from cardiogenic/hypovolemic shock",
        teaching_points=[
            "Severe tissue hypoxia leads to anaerobic metabolism",
            "Very high lactate (>10) associated with poor prognosis",
            "Treatment is restoring perfusion, not buffering",
            "Potassium often elevated from cellular release",
        ]
    ),
    
    ClinicalCondition.LACTIC_ACIDOSIS_SEIZURE: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.15, 7.25, 7.35),
        pco2_effect=(-10, 0),  # May be elevated if post-ictal
        hco3_effect=(-10, -4),
        po2_effect=(70, 95),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(8.0, 15.0),  # Normal A-a gradient - lungs are fine
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(16, 24),
        lactate_effect=(3.0, 10.0),  # Muscle activity
        potassium_effect=(0.3, 1.5),
        description="Post-seizure lactic acidosis",
        teaching_points=[
            "Massive muscle activity generates lactate",
            "Usually resolves within 60-90 minutes",
            "May have concurrent respiratory acidosis if post-ictal",
            "Lactate normalizes quickly without specific treatment",
        ]
    ),
    
    ClinicalCondition.RENAL_FAILURE_ACUTE: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.20, 7.30, 7.38),
        pco2_effect=(-10, -3),
        hco3_effect=(-10, -4),
        po2_effect=(75, 95),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(8.0, 15.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.05),  # May have mild pulmonary edema
        anion_gap_elevated=True,  # Retention of acids
        typical_anion_gap=(14, 22),
        potassium_effect=(0.5, 2.5),  # Often elevated
        lactate_effect=(1.0, 3.0),
        description="Acute kidney injury with metabolic acidosis",
        teaching_points=[
            "Failure to excrete daily acid load",
            "High anion gap from retained sulfates, phosphates, urate",
            "Hyperkalemia is common and dangerous",
            "May need emergent dialysis for severe acidosis/hyperkalemia",
        ]
    ),
    
    ClinicalCondition.RENAL_FAILURE_CHRONIC: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.28, 7.35, 7.40),
        pco2_effect=(-8, 0),
        hco3_effect=(-8, -2),
        po2_effect=(80, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(8.0, 15.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,  # Mild elevation
        typical_anion_gap=(12, 18),
        potassium_effect=(0, 1.5),
        description="Chronic kidney disease with chronic metabolic acidosis",
        teaching_points=[
            "Compensated chronic metabolic acidosis",
            "Lower HCO3 becomes 'new normal' for patient",
            "Contributes to bone disease and muscle wasting",
            "Oral bicarbonate supplementation often used",
        ]
    ),
    
    ClinicalCondition.TOXIC_INGESTION_METHANOL: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(6.90, 7.10, 7.25),
        pco2_effect=(-20, -10),
        hco3_effect=(-20, -12),
        po2_effect=(90, 105),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient - lungs fine
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(25, 40),  # Very high
        lactate_effect=(1.0, 3.0),  # Not primarily lactic
        description="Methanol poisoning",
        teaching_points=[
            "Formic acid causes severe high AG acidosis + blindness",
            "ELEVATED OSMOLAR GAP early, then AG rises as metabolized",
            "Treatment: fomepizole, dialysis, folate",
            "Visual symptoms are pathognomonic",
        ]
    ),
    
    ClinicalCondition.TOXIC_INGESTION_ETHYLENE_GLYCOL: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(6.90, 7.10, 7.25),
        pco2_effect=(-20, -10),
        hco3_effect=(-20, -12),
        po2_effect=(90, 105),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient - lungs fine
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(25, 40),
        lactate_effect=(1.0, 3.0),
        description="Ethylene glycol poisoning",
        teaching_points=[
            "Glycolic and oxalic acid cause AG acidosis + renal failure",
            "ELEVATED OSMOLAR GAP early, then AG rises",
            "Calcium oxalate crystals in urine",
            "Treatment: fomepizole, dialysis",
        ]
    ),
    
    ClinicalCondition.TOXIC_INGESTION_SALICYLATE: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,  # Actually mixed!
        ph_range=(7.30, 7.45, 7.55),  # Often alkalemic early
        pco2_effect=(-15, -5),  # Direct stimulation of respiratory center
        hco3_effect=(-12, -4),
        po2_effect=(85, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(18, 28),
        glucose_effect=(60, 100),  # May be low
        lactate_effect=(2.0, 6.0),
        affects_respiratory_drive=True,
        respiratory_drive_multiplier=1.6,
        description="Salicylate toxicity",
        teaching_points=[
            "CLASSIC MIXED DISORDER: respiratory alkalosis + metabolic acidosis",
            "Direct CNS stimulation causes respiratory alkalosis",
            "Uncouples oxidative phosphorylation causing metabolic acidosis",
            "Adults often present alkalemic, children more acidemic",
            "Alkalinize urine to enhance excretion (ion trapping)",
        ]
    ),
    
    ClinicalCondition.STARVATION_KETOSIS: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.30, 7.36, 7.40),
        pco2_effect=(-5, 0),
        hco3_effect=(-6, -2),
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,  # Mild
        typical_anion_gap=(12, 18),
        glucose_effect=(50, 80),  # Low-normal
        lactate_effect=(0.5, 1.5),
        description="Starvation ketosis",
        teaching_points=[
            "Mild ketoacidosis from prolonged fasting",
            "Much milder than DKA",
            "Glucose is low (opposite of DKA)",
            "Resolves with feeding",
        ]
    ),
    
    ClinicalCondition.ALCOHOLIC_KETOACIDOSIS: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.20, 7.32, 7.42),
        pco2_effect=(-12, -3),
        hco3_effect=(-12, -4),
        po2_effect=(85, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=True,
        typical_anion_gap=(18, 28),
        glucose_effect=(40, 150),  # Variable, often low
        lactate_effect=(2.0, 5.0),
        description="Alcoholic ketoacidosis",
        teaching_points=[
            "Occurs after binge drinking followed by starvation/vomiting",
            "Glucose often low or normal (not like DKA)",
            "May have concurrent metabolic alkalosis from vomiting",
            "Treats with glucose and volume - resolves quickly",
            "Nitroprusside test may be negative (beta-hydroxybutyrate predominates)",
        ]
    ),
    
    # ═══════════════════════════════════════════════════════════════
    # METABOLIC ACIDOSIS - NORMAL ANION GAP (HYPERCHLOREMIC)
    # ═══════════════════════════════════════════════════════════════
    
    ClinicalCondition.DIARRHEA: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.25, 7.32, 7.38),
        pco2_effect=(-10, -3),
        hco3_effect=(-10, -4),
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,  # NORMAL AG
        typical_anion_gap=(8, 12),
        potassium_effect=(-1.5, -0.3),  # Low - GI losses
        chloride_effect=(4, 12),  # HIGH chloride
        description="Diarrhea with bicarbonate loss",
        teaching_points=[
            "GI loss of bicarbonate causes normal AG (hyperchloremic) acidosis",
            "Chloride rises to maintain electroneutrality as HCO3 falls",
            "Hypokalemia common from GI losses",
            "Urine AG helps distinguish from RTA",
        ]
    ),
    
    ClinicalCondition.RTA_TYPE1: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.25, 7.32, 7.38),
        pco2_effect=(-8, -2),
        hco3_effect=(-14, -6),  # Can be quite low
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        potassium_effect=(-1.5, -0.3),  # LOW
        description="Distal (Type 1) renal tubular acidosis",
        teaching_points=[
            "Failure to secrete H+ in distal tubule",
            "Urine pH inappropriately HIGH (>5.5) despite systemic acidosis",
            "Hypokalemia common",
            "Associated with nephrolithiasis and nephrocalcinosis",
        ]
    ),
    
    ClinicalCondition.RTA_TYPE2: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.30, 7.35, 7.40),
        pco2_effect=(-5, 0),
        hco3_effect=(-8, -3),  # Usually milder
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        potassium_effect=(-1.0, 0),  # Low
        description="Proximal (Type 2) renal tubular acidosis",
        teaching_points=[
            "Failure to reabsorb bicarbonate in proximal tubule",
            "Sets new lower threshold for HCO3 reabsorption",
            "Once at new steady state, urine pH can be low",
            "May be part of Fanconi syndrome",
        ]
    ),
    
    ClinicalCondition.RTA_TYPE4: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.30, 7.35, 7.40),
        pco2_effect=(-5, 0),
        hco3_effect=(-6, -2),  # Usually mild
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        potassium_effect=(0.5, 2.0),  # HIGH - key feature
        description="Type 4 RTA (hypoaldosteronism)",
        teaching_points=[
            "Aldosterone deficiency or resistance",
            "HYPERKALEMIA is the hallmark (opposite of Type 1 and 2)",
            "Common in diabetics (hyporeninemic hypoaldosteronism)",
            "Mild acidosis compared to other RTAs",
        ]
    ),
    
    ClinicalCondition.SALINE_INFUSION: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ACIDOSIS,
        ph_range=(7.32, 7.36, 7.40),
        pco2_effect=(-3, 0),
        hco3_effect=(-4, -1),
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        chloride_effect=(4, 10),  # HIGH from NS
        description="Dilutional acidosis from normal saline",
        teaching_points=[
            "Large volume NS (Cl- 154 mEq/L) causes hyperchloremic acidosis",
            "Chloride excess relative to sodium",
            "Usually mild and clinically insignificant",
            "Balanced crystalloids (LR, Plasmalyte) avoid this",
        ]
    ),
    
    # ═══════════════════════════════════════════════════════════════
    # METABOLIC ALKALOSIS
    # ═══════════════════════════════════════════════════════════════
    
    ClinicalCondition.VOMITING: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.45, 7.52, 7.60),
        pco2_effect=(2, 10),  # Compensation (hypoventilation)
        hco3_effect=(4, 14),
        po2_effect=(75, 90),  # May be low from hypoventilation (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        potassium_effect=(-1.5, -0.5),  # Low
        chloride_effect=(-15, -5),  # Low - key!
        description="Metabolic alkalosis from vomiting",
        teaching_points=[
            "Loss of HCl from stomach causes alkalosis",
            "HYPOCHLOREMIA and HYPOKALEMIA are hallmarks",
            "Volume depletion maintains alkalosis (avid Na/HCO3 reabsorption)",
            "Saline-responsive - give NS to correct",
            "Chloride-responsive alkalosis (urine Cl < 20)",
        ]
    ),
    
    ClinicalCondition.NG_SUCTION: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.45, 7.52, 7.58),
        pco2_effect=(3, 10),
        hco3_effect=(4, 12),
        po2_effect=(75, 90),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        potassium_effect=(-1.2, -0.3),
        chloride_effect=(-12, -4),
        description="Metabolic alkalosis from NG suction",
        teaching_points=[
            "Same mechanism as vomiting - gastric HCl loss",
            "Common in post-surgical patients",
            "Replace losses with appropriate fluids",
        ]
    ),
    
    ClinicalCondition.DIURETIC_USE: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.44, 7.48, 7.55),
        pco2_effect=(2, 8),
        hco3_effect=(3, 10),
        po2_effect=(80, 95),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        potassium_effect=(-1.0, -0.3),  # Low
        chloride_effect=(-8, -2),  # Low
        description="Diuretic-induced metabolic alkalosis",
        teaching_points=[
            "Loop and thiazide diuretics cause Cl/K losses",
            "Volume contraction maintains the alkalosis",
            "Saline-responsive (urine Cl < 20)",
            "Hypokalemia perpetuates H+ secretion",
        ]
    ),
    
    ClinicalCondition.HYPOKALEMIA: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.44, 7.48, 7.52),
        pco2_effect=(2, 6),
        hco3_effect=(2, 8),
        po2_effect=(85, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        potassium_effect=(-1.5, -0.8),  # Very low
        description="Metabolic alkalosis from severe hypokalemia",
        teaching_points=[
            "K+ depletion causes intracellular H+ shift",
            "Also increases renal H+ secretion",
            "Must correct K+ to correct the alkalosis",
        ]
    ),
    
    ClinicalCondition.HYPERALDOSTERONISM: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.44, 7.50, 7.55),
        pco2_effect=(2, 8),
        hco3_effect=(4, 12),
        po2_effect=(85, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        sodium_effect=(2, 8),  # Mildly high
        potassium_effect=(-1.2, -0.5),
        description="Primary hyperaldosteronism (Conn's syndrome)",
        teaching_points=[
            "Saline-RESISTANT alkalosis (urine Cl > 20)",
            "Autonomous aldosterone secretion",
            "Hypertension + hypokalemia + alkalosis is classic triad",
            "Look for adrenal adenoma or hyperplasia",
        ]
    ),
    
    ClinicalCondition.MILK_ALKALI_SYNDROME: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.48, 7.55, 7.62),
        pco2_effect=(4, 12),
        hco3_effect=(6, 16),
        po2_effect=(80, 95),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        description="Milk-alkali syndrome from calcium/antacid ingestion",
        teaching_points=[
            "Triad: hypercalcemia, alkalosis, renal insufficiency",
            "From excessive calcium carbonate (antacid) intake",
            "More common than previously thought",
        ]
    ),
    
    ClinicalCondition.POST_HYPERCAPNIA: ConditionEffect(
        primary_disorder=Disorder.METABOLIC_ALKALOSIS,
        ph_range=(7.45, 7.50, 7.55),
        pco2_effect=(-5, 5),  # Now normal
        hco3_effect=(4, 12),  # Still elevated
        po2_effect=(80, 95),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        description="Post-hypercapnic metabolic alkalosis",
        teaching_points=[
            "After correcting chronic respiratory acidosis",
            "Elevated HCO3 (from compensation) persists while pCO2 normalizes",
            "Common when COPD patients are over-ventilated",
            "Takes days for kidneys to excrete excess bicarbonate",
        ]
    ),
    
    # ═══════════════════════════════════════════════════════════════
    # NORMAL / PHYSIOLOGICAL VARIANTS
    # ═══════════════════════════════════════════════════════════════
    
    ClinicalCondition.HEALTHY: ConditionEffect(
        primary_disorder=Disorder.NORMAL,
        ph_range=(7.38, 7.40, 7.42),
        pco2_effect=(-2, 2),
        hco3_effect=(-1, 1),
        po2_effect=(90, 100),  # Room air baseline (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        typical_anion_gap=(8, 12),
        lactate_effect=(0.5, 1.5),
        description="Healthy individual with normal blood gas",
        teaching_points=[
            "Normal ABG values for reference",
            "Small day-to-day variation is normal",
        ]
    ),
    
    ClinicalCondition.PREGNANCY: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,  # Chronic
        ph_range=(7.40, 7.44, 7.46),
        pco2_effect=(-10, -6),  # Low - chronic hyperventilation
        hco3_effect=(-4, -2),  # Compensatory decrease
        po2_effect=(100, 110),  # Slightly high from hyperventilation (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        description="Normal pregnancy (chronic respiratory alkalosis)",
        teaching_points=[
            "Progesterone stimulates respiratory center",
            "Chronic compensated respiratory alkalosis is normal",
            "Lower pCO2 baseline (28-32) and HCO3 (18-22)",
            "Important when interpreting ABGs in pregnant patients",
        ]
    ),
    
    ClinicalCondition.HIGH_ALTITUDE: ConditionEffect(
        primary_disorder=Disorder.RESPIRATORY_ALKALOSIS,
        ph_range=(7.42, 7.46, 7.50),
        pco2_effect=(-12, -5),
        hco3_effect=(-4, -1),  # Acute: minimal, Chronic: more
        po2_effect=(55, 75),  # Low due to lower atmospheric pressure (reference only)
        aa_gradient_elevated=False,
        aa_gradient_range=(5.0, 12.0),  # Normal A-a gradient - lungs are fine
        shunt_fraction_range=(0.0, 0.0),  # No shunt
        anion_gap_elevated=False,
        description="High altitude acclimatization",
        teaching_points=[
            "Hypoxic drive causes hyperventilation",
            "Respiratory alkalosis develops",
            "Over days, renal compensation occurs",
            "Expected pO2 decreases with altitude",
        ]
    ),
}


def get_condition_effect(condition: ClinicalCondition) -> ConditionEffect:
    """
    Get the physiological effect definition for a clinical condition.
    
    Args:
        condition: The clinical condition
    
    Returns:
        ConditionEffect defining the physiological changes
    
    Raises:
        ValueError: If condition not found
    """
    if condition not in CONDITION_EFFECTS:
        raise ValueError(f"Unknown condition: {condition}")
    return CONDITION_EFFECTS[condition]

