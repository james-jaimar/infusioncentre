
-- Add 'doctor' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'doctor';

-- Create doctors table
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  practice_name text,
  practice_number text,
  phone text,
  email text,
  specialisation text,
  address_line_1 text,
  address_line_2 text,
  city text,
  postal_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Doctors can view their own record
CREATE POLICY "Doctors can view own record"
  ON public.doctors FOR SELECT
  USING (auth.uid() = user_id);

-- Doctors can update their own record
CREATE POLICY "Doctors can update own record"
  ON public.doctors FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can manage doctors"
  ON public.doctors FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create referral urgency enum
CREATE TYPE public.referral_urgency AS ENUM ('routine', 'urgent');

-- Create referral status enum
CREATE TYPE public.referral_status AS ENUM ('pending', 'accepted', 'scheduled', 'completed', 'cancelled');

-- Create referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  patient_id uuid REFERENCES public.patients(id),
  patient_first_name text NOT NULL,
  patient_last_name text NOT NULL,
  patient_email text,
  patient_phone text,
  diagnosis text,
  treatment_requested text,
  prescription_notes text,
  urgency referral_urgency NOT NULL DEFAULT 'routine',
  referral_document_path text,
  status referral_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Doctors can view their own referrals
CREATE POLICY "Doctors can view own referrals"
  ON public.referrals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = referrals.doctor_id
      AND doctors.user_id = auth.uid()
  ));

-- Doctors can insert referrals
CREATE POLICY "Doctors can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.doctors
    WHERE doctors.id = referrals.doctor_id
      AND doctors.user_id = auth.uid()
  ));

-- Doctors can update their own pending referrals
CREATE POLICY "Doctors can update own pending referrals"
  ON public.referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = referrals.doctor_id
        AND doctors.user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Admins full access
CREATE POLICY "Admins can manage referrals"
  ON public.referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Nurses can view referrals
CREATE POLICY "Nurses can view referrals"
  ON public.referrals FOR SELECT
  USING (public.has_role(auth.uid(), 'nurse'::app_role));

-- Timestamps triggers
CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Allow doctors to view their referred patients' treatment data
CREATE POLICY "Doctors can view referred patients"
  ON public.patients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.referrals r
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE r.patient_id = patients.id
      AND d.user_id = auth.uid()
  ));

-- Allow doctors to view treatments for their referred patients
CREATE POLICY "Doctors can view referred patient treatments"
  ON public.treatments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.referrals r
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE r.patient_id = treatments.patient_id
      AND d.user_id = auth.uid()
  ));

-- Allow doctors to view vitals for referred patients' treatments
CREATE POLICY "Doctors can view referred patient vitals"
  ON public.treatment_vitals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_vitals.treatment_id
      AND d.user_id = auth.uid()
  ));

-- Allow doctors to view medications for referred patients' treatments
CREATE POLICY "Doctors can view referred patient medications"
  ON public.treatment_medications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_medications.treatment_id
      AND d.user_id = auth.uid()
  ));
