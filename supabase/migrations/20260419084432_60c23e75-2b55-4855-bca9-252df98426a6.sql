
-- Frequency enum for course templates
DO $$ BEGIN
  CREATE TYPE public.course_frequency AS ENUM ('single', 'weekly', 'twice_weekly', 'biweekly', 'monthly');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Main templates table
CREATE TABLE IF NOT EXISTS public.treatment_course_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  appointment_type_id uuid NOT NULL REFERENCES public.appointment_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  default_sessions integer NOT NULL DEFAULT 1,
  default_frequency public.course_frequency NOT NULL DEFAULT 'single',
  default_session_duration_mins integer,
  medication_name text,
  medication_notes text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_templates_type ON public.treatment_course_templates(appointment_type_id);
CREATE INDEX IF NOT EXISTS idx_course_templates_tenant ON public.treatment_course_templates(tenant_id);

ALTER TABLE public.treatment_course_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage course templates"
  ON public.treatment_course_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Authenticated can view active course templates"
  ON public.treatment_course_templates FOR SELECT TO authenticated
  USING (is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER trg_course_templates_updated_at
  BEFORE UPDATE ON public.treatment_course_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Join table for variant-specific required forms
CREATE TABLE IF NOT EXISTS public.treatment_course_template_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.treatment_course_templates(id) ON DELETE CASCADE,
  form_template_id uuid NOT NULL REFERENCES public.form_templates(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, form_template_id)
);

CREATE INDEX IF NOT EXISTS idx_template_forms_template ON public.treatment_course_template_forms(template_id);

ALTER TABLE public.treatment_course_template_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template forms"
  ON public.treatment_course_template_forms FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Authenticated can view template forms"
  ON public.treatment_course_template_forms FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add course_template_id to referrals & treatment_courses
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS course_template_id uuid REFERENCES public.treatment_course_templates(id) ON DELETE SET NULL;

ALTER TABLE public.treatment_courses
  ADD COLUMN IF NOT EXISTS course_template_id uuid REFERENCES public.treatment_course_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_course_template ON public.referrals(course_template_id);
CREATE INDEX IF NOT EXISTS idx_courses_course_template ON public.treatment_courses(course_template_id);

-- Update onboarding checklist trigger to also include template-specific forms
CREATE OR REPLACE FUNCTION public.create_onboarding_from_course()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ft_record record;
BEGIN
  -- Type-wide required forms
  FOR ft_record IN
    SELECT id FROM public.form_templates
    WHERE is_active = true
      AND tenant_id = NEW.tenant_id
      AND NEW.treatment_type_id = ANY (required_for_treatment_types)
  LOOP
    INSERT INTO public.onboarding_checklists (patient_id, form_template_id, tenant_id, status)
    VALUES (NEW.patient_id, ft_record.id, NEW.tenant_id, 'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Variant-specific extra forms from the chosen template
  IF NEW.course_template_id IS NOT NULL THEN
    FOR ft_record IN
      SELECT tcf.form_template_id AS id
      FROM public.treatment_course_template_forms tcf
      JOIN public.form_templates ft ON ft.id = tcf.form_template_id
      WHERE tcf.template_id = NEW.course_template_id
        AND ft.is_active = true
    LOOP
      INSERT INTO public.onboarding_checklists (patient_id, form_template_id, tenant_id, status)
      VALUES (NEW.patient_id, ft_record.id, NEW.tenant_id, 'pending')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger if it already exists (function was replaced above; trigger keeps pointing at it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_create_onboarding_from_course'
  ) THEN
    CREATE TRIGGER trg_create_onboarding_from_course
      AFTER INSERT ON public.treatment_courses
      FOR EACH ROW EXECUTE FUNCTION public.create_onboarding_from_course();
  END IF;
END $$;

-- Seed common templates (best-effort: only inserts if matching appointment_type exists)
INSERT INTO public.treatment_course_templates
  (tenant_id, appointment_type_id, name, description, default_sessions, default_frequency, medication_name, medication_notes, display_order)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, at.id, v.name, v.description, v.sessions, v.freq::course_frequency, v.med, v.notes, v.ord
FROM public.appointment_types at
CROSS JOIN (VALUES
  ('Ferinject 1000mg', 'Single 1000mg infusion of ferric carboxymaltose', 1, 'single', 'Ferinject', 'Ferric carboxymaltose 1000mg in 250ml NaCl over 15-30 min', 10),
  ('Venofer 200mg x 5', 'Iron sucrose 200mg, five sessions', 5, 'weekly', 'Venofer', 'Iron sucrose 200mg in 100ml NaCl over 30 min, weekly', 20),
  ('Monofer 1000mg', 'Single high-dose ferric derisomaltose', 1, 'single', 'Monofer', 'Ferric derisomaltose 1000mg over 20 min - requires motivation form', 30),
  ('CosmoFer 1500mg', 'Total dose iron infusion', 1, 'single', 'CosmoFer', 'Iron dextran total dose infusion over 4-6 hours', 40)
) AS v(name, description, sessions, freq, med, notes, ord)
WHERE lower(at.name) LIKE '%iron%'
  AND NOT EXISTS (SELECT 1 FROM public.treatment_course_templates t WHERE t.appointment_type_id = at.id AND t.name = v.name);

INSERT INTO public.treatment_course_templates
  (tenant_id, appointment_type_id, name, description, default_sessions, default_frequency, medication_name, medication_notes, display_order)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, at.id, v.name, v.description, v.sessions, v.freq::course_frequency, v.med, v.notes, v.ord
FROM public.appointment_types at
CROSS JOIN (VALUES
  ('Ketamine Induction (6 sessions)', 'Standard 6-session induction over 2-3 weeks', 6, 'twice_weekly', 'Ketamine', 'Ketamine 0.5mg/kg IV over 40 min, twice weekly', 10),
  ('Ketamine Maintenance', 'Monthly maintenance dose', 1, 'monthly', 'Ketamine', 'Maintenance dose, monthly', 20)
) AS v(name, description, sessions, freq, med, notes, ord)
WHERE lower(at.name) LIKE '%ketamine%'
  AND NOT EXISTS (SELECT 1 FROM public.treatment_course_templates t WHERE t.appointment_type_id = at.id AND t.name = v.name);

INSERT INTO public.treatment_course_templates
  (tenant_id, appointment_type_id, name, description, default_sessions, default_frequency, medication_name, medication_notes, display_order)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, at.id, 'Zoledronic Acid (single dose)', 'Annual zoledronic acid infusion for osteoporosis', 1, 'single'::course_frequency, 'Zoledronic Acid', 'Zoledronic acid 5mg in 100ml NaCl over 15-30 min', 10
FROM public.appointment_types at
WHERE (lower(at.name) LIKE '%zoledronic%' OR lower(at.name) LIKE '%osteoporosis%')
  AND NOT EXISTS (SELECT 1 FROM public.treatment_course_templates t WHERE t.appointment_type_id = at.id);
