-- One-time cleanup: reconcile onboarding_checklists with current form_templates rules.
-- Rules:
--   required_for_treatment_types IS NULL  => universal (applies to every patient)
--   = '{}' (empty array)                  => not auto-applied to anyone
--   non-empty array                       => applies only if patient has a matching treatment course

-- 1) Delete pending items that are no longer applicable
DELETE FROM public.onboarding_checklists oc
USING public.form_templates ft
WHERE oc.form_template_id = ft.id
  AND oc.status = 'pending'
  AND ft.required_for_treatment_types IS NOT NULL
  AND (
    cardinality(ft.required_for_treatment_types) = 0
    OR NOT EXISTS (
      SELECT 1
      FROM public.treatment_courses tc
      WHERE tc.patient_id = oc.patient_id
        AND tc.treatment_type_id = ANY(ft.required_for_treatment_types)
    )
  );

-- Also delete pending items for inactive templates
DELETE FROM public.onboarding_checklists oc
USING public.form_templates ft
WHERE oc.form_template_id = ft.id
  AND oc.status = 'pending'
  AND ft.is_active = false;

-- 2) Insert missing items for applicable templates, for every existing patient that has any checklist or treatment course
WITH patients_in_scope AS (
  SELECT DISTINCT patient_id, tenant_id FROM (
    SELECT patient_id, tenant_id FROM public.onboarding_checklists
    UNION
    SELECT patient_id, tenant_id FROM public.treatment_courses
  ) s
),
patient_types AS (
  SELECT tc.patient_id, array_agg(DISTINCT tc.treatment_type_id) AS type_ids
  FROM public.treatment_courses tc
  GROUP BY tc.patient_id
)
INSERT INTO public.onboarding_checklists (patient_id, form_template_id, tenant_id, status)
SELECT p.patient_id, ft.id, p.tenant_id, 'pending'
FROM patients_in_scope p
LEFT JOIN patient_types pt ON pt.patient_id = p.patient_id
JOIN public.form_templates ft
  ON ft.is_active = true
 AND ft.tenant_id = p.tenant_id
 AND (
   ft.required_for_treatment_types IS NULL
   OR (
     cardinality(ft.required_for_treatment_types) > 0
     AND pt.type_ids IS NOT NULL
     AND ft.required_for_treatment_types && pt.type_ids
   )
 )
WHERE NOT EXISTS (
  SELECT 1 FROM public.onboarding_checklists oc2
  WHERE oc2.patient_id = p.patient_id AND oc2.form_template_id = ft.id
);
