export type TreatmentStatus = 'pending' | 'pre_assessment' | 'in_progress' | 'post_assessment' | 'completed' | 'cancelled';
export type TreatmentCourseStatus = 'draft' | 'onboarding' | 'ready' | 'active' | 'paused' | 'completing' | 'completed' | 'cancelled';

export interface TreatmentCourse {
  id: string;
  referral_id: string | null;
  patient_id: string;
  doctor_id: string | null;
  treatment_type_id: string;
  status: TreatmentCourseStatus;
  total_sessions_planned: number;
  sessions_completed: number;
  started_at: string | null;
  expected_end_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TreatmentCourseWithRelations extends TreatmentCourse {
  patient: { id: string; first_name: string; last_name: string };
  appointment_type: { id: string; name: string; color: string };
  doctor?: { id: string; practice_name: string | null } | null;
  referral?: { id: string; diagnosis: string | null; urgency: string } | null;
}
export type VitalsPhase = 'pre' | 'during' | 'post';
export type MedicationRoute = 'iv' | 'oral' | 'im' | 'sc';
export type AssessmentType = 'pre_treatment' | 'during_treatment' | 'post_treatment' | 'ketamine_monitoring';
export type IVAccessType = 'peripheral' | 'midline' | 'picc' | 'port' | 'central';
export type ReactionOutcome = 'resolved' | 'ongoing' | 'escalated' | 'emergency_transfer';
export type InfusionMethod = 'continuous' | 'intermittent' | 'bolus' | 'push';

export interface Treatment {
  id: string;
  appointment_id: string;
  patient_id: string;
  nurse_id: string;
  treatment_type_id: string;
  status: TreatmentStatus;
  started_at: string | null;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface TreatmentWithRelations extends Treatment {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    phone: string | null;
    allergies?: string[] | null;
  };
  appointment: {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    status: string;
  };
  appointment_type: {
    id: string;
    name: string;
    color: string;
    default_duration_minutes: number;
  };
  chair?: {
    id: string;
    name: string;
  } | null;
}

export interface TreatmentVitals {
  id: string;
  treatment_id: string;
  recorded_at: string;
  phase: VitalsPhase;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  o2_saturation: number | null;
  temperature: number | null;
  weight_kg: number | null;
  respiratory_rate: number | null;
  pain_score: number | null;
  notes: string | null;
  recorded_by: string | null;
}

export interface TreatmentMedication {
  id: string;
  treatment_id: string;
  medication_name: string;
  dosage: string;
  route: MedicationRoute;
  administered_at: string;
  administered_by: string | null;
  lot_number: string | null;
  notes: string | null;
  diluent: string | null;
  infusion_rate: string | null;
  infusion_method: string | null;
  started_at: string | null;
  stopped_at: string | null;
  volume_infused_ml: number | null;
  site_assessment_pre: string | null;
  site_assessment_post: string | null;
}

export interface TreatmentAssessment {
  id: string;
  treatment_id: string;
  assessment_type: AssessmentType;
  data: Record<string, unknown>;
  recorded_at: string;
  recorded_by: string | null;
}

export interface KetamineMonitoring {
  id: string;
  treatment_id: string;
  minutes_from_start: number;
  alertness_score: number;
  mood_score: number;
  pain_score: number;
  dissociation_level: number;
  anxiety_score: number | null;
  nausea_present: boolean;
  notes: string | null;
  recorded_at: string;
  recorded_by: string | null;
}

export interface TreatmentIVAccess {
  id: string;
  treatment_id: string;
  access_type: IVAccessType;
  gauge: string | null;
  site_location: string | null;
  insertion_attempts: number;
  inserted_at: string;
  inserted_by: string | null;
  dressing_type: string | null;
  flush_solution: string | null;
  removed_at: string | null;
  removal_site_condition: string | null;
  notes: string | null;
  created_at: string;
}

export interface TreatmentSiteCheck {
  id: string;
  treatment_id: string;
  iv_access_id: string;
  checked_at: string;
  checked_by: string | null;
  site_appearance: string[];
  phlebitis_grade: number | null;
  infiltration_grade: number | null;
  action_taken: string | null;
  notes: string | null;
  created_at: string;
}

export interface TreatmentReaction {
  id: string;
  treatment_id: string;
  onset_at: string;
  onset_minutes_from_start: number | null;
  severity_grade: number;
  symptoms: string[];
  other_symptoms: string | null;
  intervention: string[];
  intervention_details: string | null;
  infusion_resumed: boolean | null;
  resumed_at_rate: string | null;
  outcome: ReactionOutcome;
  resolved_at: string | null;
  recorded_by: string | null;
  notes: string | null;
  created_at: string;
}

// Constants for UI pickers
export const REACTION_SYMPTOMS = [
  'flushing', 'rigors', 'urticaria', 'pruritus', 'dyspnoea', 'wheezing',
  'chest_pain', 'hypotension', 'hypertension', 'tachycardia', 'nausea',
  'vomiting', 'fever', 'headache', 'back_pain', 'other',
] as const;

export const REACTION_INTERVENTIONS = [
  'rate_reduced', 'infusion_paused', 'infusion_stopped', 'antihistamine',
  'corticosteroid', 'adrenaline', 'oxygen', 'iv_fluids', 'other',
] as const;

export const SITE_APPEARANCE_OPTIONS = [
  'normal', 'redness', 'swelling', 'pain', 'warmth', 'leaking', 'hardness',
] as const;
