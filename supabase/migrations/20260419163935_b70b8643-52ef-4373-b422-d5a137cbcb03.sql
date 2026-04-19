DO $$
DECLARE
  v_tenant uuid := '00000000-0000-0000-0000-000000000001';
  v_type_id uuid;
BEGIN
  SELECT id INTO v_type_id FROM public.appointment_types
   WHERE tenant_id = v_tenant AND lower(name) = 'stoma therapy' LIMIT 1;

  IF v_type_id IS NULL THEN
    INSERT INTO public.appointment_types (tenant_id, name, default_duration_minutes, color, requires_consent, service_category, display_order, is_active)
    VALUES (v_tenant, 'Stoma Therapy', 45, '#7C9885', false, 'care_pathway', 100, true)
    RETURNING id INTO v_type_id;
  ELSE
    UPDATE public.appointment_types SET service_category = 'care_pathway' WHERE id = v_type_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.treatment_course_templates WHERE appointment_type_id = v_type_id) THEN
    INSERT INTO public.treatment_course_templates
      (tenant_id, appointment_type_id, name, description, default_sessions, default_frequency, default_session_duration_mins, is_active, display_order)
    VALUES
      (v_tenant, v_type_id, 'Initial Post-Op Education', 'In-clinic teaching after discharge: appliance fit, skin care, supply orientation.', 1, 'as_needed', 60, true, 0),
      (v_tenant, v_type_id, '2-Week Follow-up',           'First post-discharge review at ~2 weeks. Check fit, skin, output, troubleshoot leaks.', 1, 'as_needed', 30, true, 1),
      (v_tenant, v_type_id, '6-Week Follow-up',           'Second post-discharge review at ~4-6 weeks. Confirm stoma maturation and supply plan.', 1, 'as_needed', 30, true, 2),
      (v_tenant, v_type_id, 'Annual Review',              'Long-term annual stoma nurse review.',                                                  1, 'as_needed', 30, true, 3);
  END IF;
END $$;