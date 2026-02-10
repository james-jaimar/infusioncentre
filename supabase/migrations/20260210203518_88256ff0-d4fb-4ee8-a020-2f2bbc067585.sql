
-- ============================================================
-- Phase 6: Enhanced Clinical Monitoring
-- ============================================================

-- 1. New enum for IV access type
CREATE TYPE public.iv_access_type AS ENUM ('peripheral', 'midline', 'picc', 'port', 'central');

-- 2. New enum for reaction outcome
CREATE TYPE public.reaction_outcome AS ENUM ('resolved', 'ongoing', 'escalated', 'emergency_transfer');

-- 3. Add columns to treatment_vitals
ALTER TABLE public.treatment_vitals
  ADD COLUMN respiratory_rate integer,
  ADD COLUMN pain_score integer;

-- 4. Add columns to treatment_medications
ALTER TABLE public.treatment_medications
  ADD COLUMN diluent text,
  ADD COLUMN infusion_rate text,
  ADD COLUMN infusion_method text,
  ADD COLUMN started_at timestamptz,
  ADD COLUMN stopped_at timestamptz,
  ADD COLUMN volume_infused_ml numeric,
  ADD COLUMN site_assessment_pre text,
  ADD COLUMN site_assessment_post text;

-- 5. New table: treatment_iv_access
CREATE TABLE public.treatment_iv_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  access_type public.iv_access_type NOT NULL DEFAULT 'peripheral',
  gauge text,
  site_location text,
  insertion_attempts integer DEFAULT 1,
  inserted_at timestamptz NOT NULL DEFAULT now(),
  inserted_by uuid,
  dressing_type text,
  flush_solution text,
  removed_at timestamptz,
  removal_site_condition text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_iv_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage iv access" ON public.treatment_iv_access FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can insert iv access" ON public.treatment_iv_access FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can update iv access" ON public.treatment_iv_access FOR UPDATE
  USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can view iv access" ON public.treatment_iv_access FOR SELECT
  USING (has_role(auth.uid(), 'nurse'::app_role));

-- 6. New table: treatment_site_checks
CREATE TABLE public.treatment_site_checks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  iv_access_id uuid NOT NULL REFERENCES public.treatment_iv_access(id) ON DELETE CASCADE,
  checked_at timestamptz NOT NULL DEFAULT now(),
  checked_by uuid,
  site_appearance text[] DEFAULT '{}',
  phlebitis_grade integer,
  infiltration_grade integer,
  action_taken text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_site_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site checks" ON public.treatment_site_checks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can insert site checks" ON public.treatment_site_checks FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can view site checks" ON public.treatment_site_checks FOR SELECT
  USING (has_role(auth.uid(), 'nurse'::app_role));

-- 7. New table: treatment_reactions
CREATE TABLE public.treatment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  onset_at timestamptz NOT NULL DEFAULT now(),
  onset_minutes_from_start integer,
  severity_grade integer NOT NULL,
  symptoms text[] DEFAULT '{}',
  other_symptoms text,
  intervention text[] DEFAULT '{}',
  intervention_details text,
  infusion_resumed boolean,
  resumed_at_rate text,
  outcome public.reaction_outcome NOT NULL DEFAULT 'resolved',
  resolved_at timestamptz,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treatment_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reactions" ON public.treatment_reactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can insert reactions" ON public.treatment_reactions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can update reactions" ON public.treatment_reactions FOR UPDATE
  USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can view reactions" ON public.treatment_reactions FOR SELECT
  USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Doctors can view referred patient reactions" ON public.treatment_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM treatments t
    JOIN referrals r ON r.patient_id = t.patient_id
    JOIN doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_reactions.treatment_id AND d.user_id = auth.uid()
  ));
