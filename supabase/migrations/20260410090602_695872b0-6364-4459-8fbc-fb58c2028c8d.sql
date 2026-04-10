-- Fix Ketamine_Questionnaire - General 2025 (dee0ac53-6288-46c1-ade1-09e403a41466)
-- Make parent_guardian_name, parent_guardian_relationship, patient_name_surname_signature_area not required
UPDATE form_templates
SET form_schema = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'field_name' IN ('parent_guardian_name', 'parent_guardian_relationship', 'patient_name_surname_signature_area')
      THEN jsonb_set(elem, '{required}', 'false'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(form_schema) elem
)
WHERE id = 'dee0ac53-6288-46c1-ade1-09e403a41466';

-- Fix POPI Consent (182f4cf4-a131-4749-837e-0813b7374d00)
-- patient_guardian_id_number should not be unconditionally required
UPDATE form_templates
SET form_schema = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'field_name' = 'patient_guardian_id_number'
      THEN jsonb_set(elem, '{required}', 'false'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(form_schema) elem
)
WHERE id = '182f4cf4-a131-4749-837e-0813b7374d00';