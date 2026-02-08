-- Create enums for patient status and gender
CREATE TYPE public.patient_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE public.patient_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE public.document_type AS ENUM ('prescription', 'referral', 'consent', 'id_copy', 'medical_aid_card', 'other');

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  id_number TEXT,
  date_of_birth DATE,
  gender patient_gender,
  phone TEXT,
  email TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postal_code TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  medical_aid_name TEXT,
  medical_aid_number TEXT,
  medical_aid_plan TEXT,
  medical_aid_main_member TEXT,
  referring_doctor_name TEXT,
  referring_doctor_practice TEXT,
  referring_doctor_phone TEXT,
  status patient_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create patient_medical_history table
CREATE TABLE public.patient_medical_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  allergies TEXT[],
  chronic_conditions TEXT[],
  current_medications JSONB DEFAULT '[]'::jsonb,
  previous_surgeries TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at on patients
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on patient_medical_history
CREATE TRIGGER update_patient_medical_history_updated_at
  BEFORE UPDATE ON public.patient_medical_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for patients table
-- Admins and nurses can view all patients
CREATE POLICY "Admins can view all patients"
  ON public.patients FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view all patients"
  ON public.patients FOR SELECT
  USING (has_role(auth.uid(), 'nurse'));

-- Patients can view their own record (if linked via user_id)
CREATE POLICY "Patients can view own record"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

-- Admins and nurses can insert patients
CREATE POLICY "Admins can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can insert patients"
  ON public.patients FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'));

-- Admins and nurses can update patients
CREATE POLICY "Admins can update patients"
  ON public.patients FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can update patients"
  ON public.patients FOR UPDATE
  USING (has_role(auth.uid(), 'nurse'));

-- Only admins can delete patients
CREATE POLICY "Admins can delete patients"
  ON public.patients FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for patient_medical_history
CREATE POLICY "Admins can view all medical history"
  ON public.patient_medical_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view all medical history"
  ON public.patient_medical_history FOR SELECT
  USING (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Patients can view own medical history"
  ON public.patient_medical_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = patient_medical_history.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert medical history"
  ON public.patient_medical_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can insert medical history"
  ON public.patient_medical_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admins can update medical history"
  ON public.patient_medical_history FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can update medical history"
  ON public.patient_medical_history FOR UPDATE
  USING (has_role(auth.uid(), 'nurse'));

-- RLS Policies for patient_documents
CREATE POLICY "Admins can view all documents"
  ON public.patient_documents FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view all documents"
  ON public.patient_documents FOR SELECT
  USING (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Patients can view own documents"
  ON public.patient_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = patient_documents.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can insert documents"
  ON public.patient_documents FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'));

CREATE POLICY "Admins can delete documents"
  ON public.patient_documents FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false);

-- Storage policies for patient-documents bucket
CREATE POLICY "Admins can upload patient documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-documents' 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nurses can upload patient documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-documents' 
    AND has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Admins can view patient documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'patient-documents' 
    AND has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Nurses can view patient documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'patient-documents' 
    AND has_role(auth.uid(), 'nurse')
  );

CREATE POLICY "Admins can delete patient documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'patient-documents' 
    AND has_role(auth.uid(), 'admin')
  );