
-- Enums for treatment workflow
CREATE TYPE public.treatment_status AS ENUM ('pending', 'pre_assessment', 'in_progress', 'post_assessment', 'completed', 'cancelled');
CREATE TYPE public.vitals_phase AS ENUM ('pre', 'during', 'post');
CREATE TYPE public.medication_route AS ENUM ('iv', 'oral', 'im', 'sc');
CREATE TYPE public.assessment_type AS ENUM ('pre_treatment', 'during_treatment', 'post_treatment', 'ketamine_monitoring');

-- Treatments table
CREATE TABLE public.treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  nurse_id UUID NOT NULL,
  treatment_type_id UUID NOT NULL REFERENCES public.appointment_types(id),
  status treatment_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage treatments" ON public.treatments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view treatments" ON public.treatments FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert treatments" ON public.treatments FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update treatments" ON public.treatments FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Patients can view own treatments" ON public.treatments FOR SELECT USING (
  EXISTS (SELECT 1 FROM patients WHERE patients.id = treatments.patient_id AND patients.user_id = auth.uid())
);

-- Treatment vitals
CREATE TABLE public.treatment_vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  phase vitals_phase NOT NULL,
  blood_pressure_systolic INT,
  blood_pressure_diastolic INT,
  heart_rate INT,
  o2_saturation INT,
  temperature DECIMAL(4,1),
  weight_kg DECIMAL(5,1),
  notes TEXT,
  recorded_by UUID
);

ALTER TABLE public.treatment_vitals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage vitals" ON public.treatment_vitals FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view vitals" ON public.treatment_vitals FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert vitals" ON public.treatment_vitals FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update vitals" ON public.treatment_vitals FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));

-- Treatment medications
CREATE TABLE public.treatment_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  route medication_route NOT NULL DEFAULT 'iv',
  administered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  administered_by UUID,
  lot_number TEXT,
  notes TEXT
);

ALTER TABLE public.treatment_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage medications" ON public.treatment_medications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view medications" ON public.treatment_medications FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert medications" ON public.treatment_medications FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update medications" ON public.treatment_medications FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));

-- Treatment assessments (flexible JSONB for checklists)
CREATE TABLE public.treatment_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  assessment_type assessment_type NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID
);

ALTER TABLE public.treatment_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assessments" ON public.treatment_assessments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view assessments" ON public.treatment_assessments FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert assessments" ON public.treatment_assessments FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update assessments" ON public.treatment_assessments FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));

-- Ketamine monitoring
CREATE TABLE public.ketamine_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id UUID NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  minutes_from_start INT NOT NULL,
  alertness_score INT NOT NULL CHECK (alertness_score BETWEEN 1 AND 5),
  mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  pain_score INT NOT NULL CHECK (pain_score BETWEEN 0 AND 10),
  dissociation_level INT NOT NULL CHECK (dissociation_level BETWEEN 0 AND 4),
  anxiety_score INT CHECK (anxiety_score BETWEEN 0 AND 10),
  nausea_present BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID
);

ALTER TABLE public.ketamine_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ketamine monitoring" ON public.ketamine_monitoring FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Nurses can view ketamine monitoring" ON public.ketamine_monitoring FOR SELECT USING (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can insert ketamine monitoring" ON public.ketamine_monitoring FOR INSERT WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));
CREATE POLICY "Nurses can update ketamine monitoring" ON public.ketamine_monitoring FOR UPDATE USING (has_role(auth.uid(), 'nurse'::app_role));

-- Add updated_at triggers
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
