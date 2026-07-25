-- Dedupe existing rows first: keep the most-completed (or oldest) entry per (patient, template).
DELETE FROM public.onboarding_checklists oc
USING (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY patient_id, form_template_id
             ORDER BY
               CASE WHEN status = 'completed' THEN 0
                    WHEN form_submission_id IS NOT NULL THEN 1
                    ELSE 2 END,
               created_at ASC
           ) AS rn
    FROM public.onboarding_checklists
  ) ranked
  WHERE rn > 1
) dupes
WHERE oc.id = dupes.id;

CREATE UNIQUE INDEX IF NOT EXISTS onboarding_checklists_patient_template_uniq
  ON public.onboarding_checklists (patient_id, form_template_id);

CREATE OR REPLACE FUNCTION public.sync_onboarding_on_appointment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.onboarding_checklists (patient_id, form_template_id, tenant_id, status)
  SELECT
    NEW.patient_id,
    ft.id,
    NEW.tenant_id,
    'pending'
  FROM public.form_templates ft
  WHERE ft.is_active = true
    AND ft.required_for_treatment_types IS NOT NULL
    AND NEW.appointment_type_id = ANY(ft.required_for_treatment_types)
  ON CONFLICT (patient_id, form_template_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_onboarding_on_appointment_insert ON public.appointments;
CREATE TRIGGER trg_sync_onboarding_on_appointment_insert
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_onboarding_on_appointment_insert();

CREATE OR REPLACE FUNCTION public.sync_onboarding_on_appointment_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.onboarding_checklists oc
  USING public.form_templates ft
  WHERE oc.patient_id = OLD.patient_id
    AND oc.form_template_id = ft.id
    AND oc.status = 'pending'
    AND oc.form_submission_id IS NULL
    AND ft.required_for_treatment_types IS NOT NULL
    AND OLD.appointment_type_id = ANY(ft.required_for_treatment_types)
    AND NOT EXISTS (
      SELECT 1
      FROM public.appointments a
      WHERE a.patient_id = OLD.patient_id
        AND a.id <> OLD.id
        AND a.appointment_type_id = ANY(ft.required_for_treatment_types)
    );

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_onboarding_on_appointment_delete ON public.appointments;
CREATE TRIGGER trg_sync_onboarding_on_appointment_delete
AFTER DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.sync_onboarding_on_appointment_delete();