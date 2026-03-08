
-- Phase 1: Treatment Courses — the episode-of-care entity

-- 1. Create treatment_course_status enum
CREATE TYPE public.treatment_course_status AS ENUM (
  'draft',
  'onboarding',
  'ready',
  'active',
  'paused',
  'completing',
  'completed',
  'cancelled'
);

-- 2. Create treatment_courses table
CREATE TABLE public.treatment_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE SET NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  treatment_type_id uuid NOT NULL REFERENCES public.appointment_types(id),
  status treatment_course_status NOT NULL DEFAULT 'draft',
  total_sessions_planned integer NOT NULL DEFAULT 1,
  sessions_completed integer NOT NULL DEFAULT 0,
  started_at timestamp with time zone,
  expected_end_date date,
  completed_at timestamp with time zone,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Add treatment_course_id FK to appointments
ALTER TABLE public.appointments
  ADD COLUMN treatment_course_id uuid REFERENCES public.treatment_courses(id) ON DELETE SET NULL;

-- 4. Add updated_at trigger
CREATE TRIGGER update_treatment_courses_updated_at
  BEFORE UPDATE ON public.treatment_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Enable RLS
ALTER TABLE public.treatment_courses ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies
CREATE POLICY "Admins can manage treatment courses"
  ON public.treatment_courses FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view treatment courses"
  ON public.treatment_courses FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Nurses can update treatment courses"
  ON public.treatment_courses FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Doctors can view own patient courses"
  ON public.treatment_courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors d
      WHERE d.id = treatment_courses.doctor_id
      AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view own courses"
  ON public.treatment_courses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = treatment_courses.patient_id
      AND p.user_id = auth.uid()
    )
  );

-- 7. Indexes for common queries
CREATE INDEX idx_treatment_courses_patient_id ON public.treatment_courses(patient_id);
CREATE INDEX idx_treatment_courses_referral_id ON public.treatment_courses(referral_id);
CREATE INDEX idx_treatment_courses_status ON public.treatment_courses(status);
CREATE INDEX idx_appointments_treatment_course_id ON public.appointments(treatment_course_id);
