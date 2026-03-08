
-- Auto-generate onboarding checklist items when a treatment course is created
CREATE OR REPLACE FUNCTION public.auto_generate_onboarding_checklist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  tmpl RECORD;
BEGIN
  -- Find all active form templates that are universal or match this treatment type
  FOR tmpl IN
    SELECT id FROM form_templates
    WHERE is_active = true
      AND (
        required_for_treatment_types IS NULL
        OR required_for_treatment_types = '{}'
        OR NEW.treatment_type_id = ANY(required_for_treatment_types)
      )
  LOOP
    -- Only insert if not already exists for this patient+template
    INSERT INTO onboarding_checklists (patient_id, form_template_id)
    SELECT NEW.patient_id, tmpl.id
    WHERE NOT EXISTS (
      SELECT 1 FROM onboarding_checklists
      WHERE patient_id = NEW.patient_id AND form_template_id = tmpl.id
    );
  END LOOP;

  -- Update treatment course status to 'onboarding' if it's in 'draft'
  IF NEW.status = 'draft' THEN
    NEW.status := 'onboarding';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_onboarding_checklist
  BEFORE INSERT ON treatment_courses
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_onboarding_checklist();
