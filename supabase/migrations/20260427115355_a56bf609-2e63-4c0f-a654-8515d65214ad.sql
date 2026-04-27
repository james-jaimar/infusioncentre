INSERT INTO public.feature_flags (key, label, description, category, is_enabled, display_order)
SELECT 'nurse_can_assist_forms',
       'Nurses can assist patients with forms',
       'Allow nurses to fill out onboarding forms with the patient or hand the tablet over in kiosk mode to unblock treatments when forms are missing.',
       'clinical',
       true,
       10
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_flags WHERE key = 'nurse_can_assist_forms'
);