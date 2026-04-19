DO $$
DECLARE
  v_tenant_id uuid := '00000000-0000-0000-0000-000000000001';
  v_type_id uuid;
  v_existing_count int;
BEGIN
  SELECT id INTO v_type_id
  FROM public.appointment_types
  WHERE tenant_id = v_tenant_id AND name = 'Wound Care'
  LIMIT 1;

  IF v_type_id IS NULL THEN
    INSERT INTO public.appointment_types (
      tenant_id, name, service_category, default_duration_minutes,
      color, display_order, is_active, requires_consent
    ) VALUES (
      v_tenant_id, 'Wound Care', 'care_pathway'::service_category, 45,
      '#B85C5C', 110, true, false
    )
    RETURNING id INTO v_type_id;
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM public.treatment_course_templates
  WHERE tenant_id = v_tenant_id AND appointment_type_id = v_type_id;

  IF v_existing_count = 0 THEN
    INSERT INTO public.treatment_course_templates (
      tenant_id, appointment_type_id, name, description,
      default_sessions, default_frequency, default_session_duration_mins,
      display_order, is_active
    ) VALUES
      (v_tenant_id, v_type_id, 'Initial Wound Assessment',
       'First visit: wound measurement, photo, baseline TIME assessment, dressing plan.',
       1, 'as_needed'::course_frequency, 60, 0, true),
      (v_tenant_id, v_type_id, 'Dressing Change',
       'Routine dressing change, cleansing, and reassessment.',
       1, 'as_needed'::course_frequency, 30, 1, true),
      (v_tenant_id, v_type_id, 'Wound Review',
       'Periodic progress review, photo, and plan adjustment.',
       1, 'as_needed'::course_frequency, 45, 2, true),
      (v_tenant_id, v_type_id, 'Compression Therapy',
       'Application or replacement of compression bandaging (venous ulcers).',
       1, 'as_needed'::course_frequency, 45, 3, true),
      (v_tenant_id, v_type_id, 'Discharge / Healed Review',
       'Final review when wound healed; education on prevention.',
       1, 'as_needed'::course_frequency, 30, 4, true);
  END IF;
END $$;