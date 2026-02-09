export type TreatmentStatus = 'pending' | 'pre_assessment' | 'in_progress' | 'post_assessment' | 'completed' | 'cancelled';
export type VitalsPhase = 'pre' | 'during' | 'post';
export type MedicationRoute = 'iv' | 'oral' | 'im' | 'sc';
export type AssessmentType = 'pre_treatment' | 'during_treatment' | 'post_treatment' | 'ketamine_monitoring';

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
