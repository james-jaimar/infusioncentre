// Treatment Protocol Types for Phase 5: Clinical Treatment Engine

export type ProtocolStepType =
  | 'consent_check'
  | 'assessment_form'
  | 'vitals_capture'
  | 'iv_access'
  | 'medication_prep'
  | 'infusion_start'
  | 'monitoring_interval'
  | 'site_check'
  | 'post_assessment'
  | 'discharge_criteria';

export type ClinicalAlertSeverity = 'info' | 'warning' | 'critical';
export type ClinicalAlertStatus = 'active' | 'acknowledged' | 'resolved' | 'dismissed';

export interface TreatmentProtocol {
  id: string;
  treatment_type_id: string;
  name: string;
  description: string | null;
  version: number;
  is_active: boolean;
  vitals_interval_initial_mins: number;
  vitals_interval_standard_mins: number;
  vitals_initial_period_mins: number;
  post_infusion_observation_mins: number;
  min_vitals_during: number;
  min_vitals_post: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TreatmentProtocolStep {
  id: string;
  protocol_id: string;
  step_order: number;
  step_type: ProtocolStepType;
  name: string;
  description: string | null;
  is_required: boolean;
  form_template_id: string | null;
  estimated_duration_mins: number | null;
  config: Record<string, unknown>;
  created_at: string;
}

export interface DischargeCriterion {
  id: string;
  protocol_id: string;
  criterion_key: string;
  display_label: string;
  description: string | null;
  rule_config: {
    bp_systolic_max?: number;
    bp_diastolic_max?: number;
    hr_min?: number;
    hr_max?: number;
    o2_min?: number;
    observation_mins?: number;
    max_dissociation_score?: number;
  };
  is_required: boolean;
  display_order: number;
  created_at: string;
}

export interface VitalsThresholds {
  id: string;
  protocol_id: string | null;
  bp_systolic_low: number;
  bp_systolic_high: number;
  bp_diastolic_low: number;
  bp_diastolic_high: number;
  hr_low: number;
  hr_high: number;
  o2_sat_low: number;
  temp_low: number;
  temp_high: number;
  resp_rate_low: number;
  resp_rate_high: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClinicalAlert {
  id: string;
  treatment_id: string;
  alert_type: string;
  severity: ClinicalAlertSeverity;
  status: ClinicalAlertStatus;
  message: string;
  details: Record<string, unknown>;
  triggered_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

export interface TreatmentSummary {
  id: string;
  treatment_id: string;
  summary_data: {
    duration_mins?: number;
    vitals_count?: number;
    medications_count?: number;
    reactions_count?: number;
    iv_access_type?: string;
    final_vitals?: Record<string, number | null>;
    discharge_criteria_met?: string[];
  };
  narrative_summary: string | null;
  generated_at: string;
  generated_by: string | null;
  edited_at: string | null;
  edited_by: string | null;
}

// Discharge readiness evaluation result
export interface DischargeReadiness {
  isReady: boolean;
  criteria: Array<{
    criterion: DischargeCriterion;
    met: boolean;
    reason?: string;
  }>;
  blockers: string[];
}

// Vitals alert evaluation
export interface VitalsAlert {
  field: string;
  value: number;
  threshold: { low?: number; high?: number };
  severity: ClinicalAlertSeverity;
  message: string;
}
