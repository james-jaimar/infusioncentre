-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM (
  'scheduled',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

-- Create reminder type enum
CREATE TYPE public.reminder_type AS ENUM ('email', 'whatsapp', 'sms');

-- Create reminder status enum
CREATE TYPE public.reminder_status AS ENUM ('pending', 'sent', 'failed');

-- Create treatment_chairs table
CREATE TABLE public.treatment_chairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment_types table
CREATE TABLE public.appointment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  color TEXT NOT NULL DEFAULT '#3E5B84',
  requires_consent BOOLEAN NOT NULL DEFAULT false,
  preparation_instructions TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_type_id UUID NOT NULL REFERENCES public.appointment_types(id),
  chair_id UUID REFERENCES public.treatment_chairs(id),
  assigned_nurse_id UUID,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  cancellation_reason TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointment_reminders table
CREATE TABLE public.appointment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  reminder_type public.reminder_type NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status public.reminder_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.treatment_chairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for treatment_chairs (viewable by all authenticated, editable by admins)
CREATE POLICY "Authenticated users can view active chairs"
  ON public.treatment_chairs FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can view all chairs"
  ON public.treatment_chairs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert chairs"
  ON public.treatment_chairs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update chairs"
  ON public.treatment_chairs FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete chairs"
  ON public.treatment_chairs FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for appointment_types (viewable by all authenticated, editable by admins)
CREATE POLICY "Authenticated users can view active types"
  ON public.appointment_types FOR SELECT
  USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can view all types"
  ON public.appointment_types FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert types"
  ON public.appointment_types FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update types"
  ON public.appointment_types FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete types"
  ON public.appointment_types FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for appointments
CREATE POLICY "Admins can view all appointments"
  ON public.appointments FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view all appointments"
  ON public.appointments FOR SELECT
  USING (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = appointments.patient_id
    AND patients.user_id = auth.uid()
  ));

CREATE POLICY "Admins can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can insert appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admins can update appointments"
  ON public.appointments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can update appointments"
  ON public.appointments FOR UPDATE
  USING (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for appointment_reminders
CREATE POLICY "Admins can manage reminders"
  ON public.appointment_reminders FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view reminders"
  ON public.appointment_reminders FOR SELECT
  USING (has_role(auth.uid(), 'nurse'));

-- Create indexes for performance
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_scheduled_start ON public.appointments(scheduled_start);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_appointments_chair_id ON public.appointments(chair_id);
CREATE INDEX idx_appointment_reminders_appointment_id ON public.appointment_reminders(appointment_id);
CREATE INDEX idx_appointment_reminders_scheduled_for ON public.appointment_reminders(scheduled_for);

-- Add updated_at triggers
CREATE TRIGGER update_treatment_chairs_updated_at
  BEFORE UPDATE ON public.treatment_chairs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointment_types_updated_at
  BEFORE UPDATE ON public.appointment_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default treatment chairs
INSERT INTO public.treatment_chairs (name, display_order) VALUES
  ('Chair 1', 1),
  ('Chair 2', 2),
  ('Chair 3', 3),
  ('Chair 4', 4);

-- Insert default appointment types
INSERT INTO public.appointment_types (name, default_duration_minutes, color, requires_consent, display_order) VALUES
  ('Iron Infusion', 120, '#3E5B84', true, 1),
  ('Ketamine Therapy', 240, '#6B7280', true, 2),
  ('IV Vitamin Therapy', 60, '#059669', false, 3),
  ('Biologics Infusion', 180, '#7C3AED', true, 4),
  ('Blood Transfusion', 240, '#DC2626', true, 5);