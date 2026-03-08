-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 5: Clinical Treatment Engine - Protocols & Discharge Criteria
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Treatment Protocol Types
CREATE TYPE public.protocol_step_type AS ENUM (
  'consent_check',
  'assessment_form',
  'vitals_capture',
  'iv_access',
  'medication_prep',
  'infusion_start',
  'monitoring_interval',
  'site_check',
  'post_assessment',
  'discharge_criteria'
);

-- 2. Treatment Protocols table
CREATE TABLE public.treatment_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_type_id UUID NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Monitoring intervals (minutes)
  vitals_interval_initial_mins INTEGER NOT NULL DEFAULT 15,
  vitals_interval_standard_mins INTEGER NOT NULL DEFAULT 30,
  vitals_initial_period_mins INTEGER NOT NULL DEFAULT 60,  -- First hour at initial interval, then standard
  
  -- Observation period before discharge (minutes)
  post_infusion_observation_mins INTEGER NOT NULL DEFAULT 30,
  
  -- Minimum required vitals readings
  min_vitals_during INTEGER NOT NULL DEFAULT 2,
  min_vitals_post INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(treatment_type_id, version)
);

-- 3. Protocol Steps table (ordered sequence of steps)
CREATE TABLE public.treatment_protocol_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES public.treatment_protocols(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type protocol_step_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  
  -- For assessment_form steps, link to form template
  form_template_id UUID REFERENCES public.form_templates(id),
  
  -- Duration/timing hints (optional)
  estimated_duration_mins INTEGER,
  
  -- Extra config as JSONB (e.g., specific vitals thresholds)
  config JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Discharge Criteria table (configurable rules per protocol)
CREATE TABLE public.discharge_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES public.treatment_protocols(id) ON DELETE CASCADE,
  
  -- Criterion type and rule
  criterion_key TEXT NOT NULL,  -- e.g., 'vitals_stable', 'observation_complete', 'no_active_reaction'
  display_label TEXT NOT NULL,
  description TEXT,
  
  -- Rule config (JSONB for flexibility)
  -- e.g., { "bp_systolic_max": 160, "bp_diastolic_max": 100, "hr_range": [50, 100] }
  rule_config JSONB DEFAULT '{}'::jsonb,
  
  is_required BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Abnormal vitals thresholds table (for clinical alerts)
CREATE TABLE public.vitals_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID REFERENCES public.treatment_protocols(id) ON DELETE CASCADE,  -- NULL = global default
  
  -- Thresholds
  bp_systolic_low INTEGER DEFAULT 90,
  bp_systolic_high INTEGER DEFAULT 160,
  bp_diastolic_low INTEGER DEFAULT 60,
  bp_diastolic_high INTEGER DEFAULT 100,
  hr_low INTEGER DEFAULT 50,
  hr_high INTEGER DEFAULT 120,
  o2_sat_low INTEGER DEFAULT 92,
  temp_low NUMERIC(4,1) DEFAULT 35.5,
  temp_high NUMERIC(4,1) DEFAULT 38.0,
  resp_rate_low INTEGER DEFAULT 10,
  resp_rate_high INTEGER DEFAULT 25,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Clinical Alerts table (generated alerts)
CREATE TYPE public.clinical_alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE public.clinical_alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'dismissed');

CREATE TABLE public.clinical_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL,  -- 'vitals_overdue', 'abnormal_reading', 'reaction_escalation', etc.
  severity clinical_alert_severity NOT NULL DEFAULT 'warning',
  status clinical_alert_status NOT NULL DEFAULT 'active',
  
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Treatment Summary table (auto-generated on discharge)
CREATE TABLE public.treatment_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL UNIQUE REFERENCES public.treatments(id) ON DELETE CASCADE,
  
  -- Structured summary data
  summary_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Generated markdown/text summary
  narrative_summary TEXT,
  
  -- Generation metadata
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by UUID REFERENCES auth.users(id),
  
  -- Optional manual edits
  edited_at TIMESTAMPTZ,
  edited_by UUID REFERENCES auth.users(id)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_treatment_protocols_type ON public.treatment_protocols(treatment_type_id);
CREATE INDEX idx_protocol_steps_protocol ON public.treatment_protocol_steps(protocol_id);
CREATE INDEX idx_discharge_criteria_protocol ON public.discharge_criteria(protocol_id);
CREATE INDEX idx_clinical_alerts_treatment ON public.clinical_alerts(treatment_id);
CREATE INDEX idx_clinical_alerts_status ON public.clinical_alerts(status) WHERE status = 'active';
CREATE INDEX idx_treatment_summaries_treatment ON public.treatment_summaries(treatment_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.treatment_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_protocol_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vitals_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_summaries ENABLE ROW LEVEL SECURITY;

-- Treatment Protocols
CREATE POLICY "Admins can manage treatment protocols" ON public.treatment_protocols
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view treatment protocols" ON public.treatment_protocols
  FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- Protocol Steps
CREATE POLICY "Admins can manage protocol steps" ON public.treatment_protocol_steps
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view protocol steps" ON public.treatment_protocol_steps
  FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- Discharge Criteria
CREATE POLICY "Admins can manage discharge criteria" ON public.discharge_criteria
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view discharge criteria" ON public.discharge_criteria
  FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- Vitals Thresholds
CREATE POLICY "Admins can manage vitals thresholds" ON public.vitals_thresholds
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view vitals thresholds" ON public.vitals_thresholds
  FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- Clinical Alerts
CREATE POLICY "Admins can manage clinical alerts" ON public.clinical_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can manage clinical alerts" ON public.clinical_alerts
  FOR ALL USING (public.has_role(auth.uid(), 'nurse'));

-- Treatment Summaries
CREATE POLICY "Admins can manage treatment summaries" ON public.treatment_summaries
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can manage treatment summaries" ON public.treatment_summaries
  FOR ALL USING (public.has_role(auth.uid(), 'nurse'));
CREATE POLICY "Doctors can view patient summaries" ON public.treatment_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM treatments t
      JOIN referrals r ON r.patient_id = t.patient_id
      JOIN doctors d ON d.id = r.doctor_id
      WHERE t.id = treatment_summaries.treatment_id AND d.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TRIGGER update_treatment_protocols_updated_at
  BEFORE UPDATE ON public.treatment_protocols
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vitals_thresholds_updated_at
  BEFORE UPDATE ON public.vitals_thresholds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();