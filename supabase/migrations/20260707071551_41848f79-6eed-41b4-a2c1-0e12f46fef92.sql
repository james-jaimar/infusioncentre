
ALTER TABLE public.appointment_change_requests
  ADD COLUMN IF NOT EXISTS new_appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sms_sent_at timestamptz;
