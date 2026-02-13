
-- This is a data-only update to add prefill_key to existing form template schemas
-- Using a migration because the read-query tool is read-only

-- We create a function to do the update then drop it
CREATE OR REPLACE FUNCTION public.tmp_add_prefill_keys() RETURNS void AS $$
BEGIN
  UPDATE form_templates
  SET form_schema = (
    SELECT jsonb_agg(
      CASE 
        WHEN elem->>'field_name' IN ('patient_name', 'patient_name_surname', 'patient_name_confirm') 
          THEN elem || '{"prefill_key": "patient_full_name"}'::jsonb
        WHEN elem->>'field_name' IN ('patient_id_no', 'patient_signature_id_number', 'id_number') 
          THEN elem || '{"prefill_key": "patient_id_number"}'::jsonb
        WHEN elem->>'field_name' = 'patient_email' 
          THEN elem || '{"prefill_key": "patient_email"}'::jsonb
        WHEN elem->>'field_name' = 'patient_mobile_no' 
          THEN elem || '{"prefill_key": "patient_phone"}'::jsonb
        WHEN elem->>'field_name' = 'patient_street_address' 
          THEN elem || '{"prefill_key": "patient_address"}'::jsonb
        WHEN elem->>'field_name' IN ('patient_next_of_kin_name', 'emergency_contact') 
          THEN elem || '{"prefill_key": "emergency_contact_name"}'::jsonb
        WHEN elem->>'field_name' = 'patient_next_of_kin_contact_no' 
          THEN elem || '{"prefill_key": "emergency_contact_phone"}'::jsonb
        WHEN elem->>'field_name' = 'medical_aid_name' 
          THEN elem || '{"prefill_key": "medical_aid_name"}'::jsonb
        WHEN elem->>'field_name' = 'medical_aid_no' 
          THEN elem || '{"prefill_key": "medical_aid_number"}'::jsonb
        WHEN elem->>'field_name' = 'medical_aid_main_member' 
          THEN elem || '{"prefill_key": "medical_aid_main_member"}'::jsonb
        WHEN elem->>'field_name' IN ('allergies', 'clinical_allergies') 
          THEN elem || '{"prefill_key": "allergies"}'::jsonb
        WHEN elem->>'field_name' IN ('referring_doctor', 'referring_psychiatrist', 'prescribing_doctor') 
          THEN elem || '{"prefill_key": "referring_doctor_name"}'::jsonb
        WHEN elem->>'field_name' = 'date_of_birth' 
          THEN elem || '{"prefill_key": "patient_date_of_birth"}'::jsonb
        ELSE elem
      END
    )
    FROM jsonb_array_elements(form_templates.form_schema) elem
  )
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

SELECT public.tmp_add_prefill_keys();

DROP FUNCTION public.tmp_add_prefill_keys();
