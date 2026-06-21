ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'arrived' BEFORE 'checked_in';

ALTER TABLE public.clinic_settings
  ADD COLUMN IF NOT EXISTS tomorrow_reminder_template text
  DEFAULT 'Hi {{first_name}}, friendly reminder of your {{treatment_type}} appointment tomorrow at {{time}} at The Johannesburg Infusion Centre. Please reply to confirm. Thank you!';