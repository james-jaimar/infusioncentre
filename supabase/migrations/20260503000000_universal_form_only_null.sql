-- Honor the Universal toggle on form templates.
-- Only NULL required_for_treatment_types means "universal" (apply to every type).
-- Empty array now means "not required for any type" instead of being treated as universal.

CREATE OR REPLACE FUNCTION public.auto_generate_onboarding_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tmpl RECORD;
BEGIN
  FOR tmpl IN
    SELECT id FROM form_templates
    WHERE is_active = true
      AND (
        required_for_treatment_types IS NULL
        OR NEW.treatment_type_id = ANY(required_for_treatment_types)
      )
  LOOP
    INSERT INTO onboarding_checklists (patient_id, form_template_id)
    SELECT NEW.patient_id, tmpl.id
    WHERE NOT EXISTS (
      SELECT 1 FROM onboarding_checklists
      WHERE patient_id = NEW.patient_id AND form_template_id = tmpl.id
    );
  END LOOP;

  IF NEW.status = 'draft' THEN
    NEW.status := 'onboarding';
  END IF;

  RETURN NEW;
END;
$function$;
