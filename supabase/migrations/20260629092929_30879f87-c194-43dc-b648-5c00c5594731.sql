
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS confirmation_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS patient_confirmed_at timestamptz;

UPDATE public.appointments SET confirmation_token = gen_random_uuid() WHERE confirmation_token IS NULL;

INSERT INTO public.clinic_settings (tenant_id, category, key, label, value, description)
SELECT '00000000-0000-0000-0000-000000000001'::uuid, 'sms', 'sms_confirm_base_url',
       'SMS confirmation link base URL',
       to_jsonb('https://infusioncentre.jaimar.dev'::text),
       'Public base URL used for {{confirm_link}} in SMS messages'
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_settings WHERE key = 'sms_confirm_base_url');
