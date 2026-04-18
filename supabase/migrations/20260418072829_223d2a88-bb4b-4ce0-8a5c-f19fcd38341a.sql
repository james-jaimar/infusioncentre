
-- Helper function: check whether the current doctor has a referral linked to a given patient
CREATE OR REPLACE FUNCTION public.doctor_has_patient_referral(_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referrals r
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE r.patient_id = _patient_id
      AND d.user_id = auth.uid()
  );
$$;

-- RLS: doctors can SELECT documents for their referred patients
CREATE POLICY "Doctors can view referred patient documents"
ON public.patient_documents
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND public.doctor_has_patient_referral(patient_id)
);

-- RLS: doctors can INSERT documents for their referred patients
CREATE POLICY "Doctors can upload referred patient documents"
ON public.patient_documents
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id(auth.uid())
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND public.doctor_has_patient_referral(patient_id)
);

-- Storage policies on the patient-documents bucket for doctors
-- File path convention from upload code: `${patientId}/${timestamp}-${random}.${ext}`
CREATE POLICY "Doctors can view referred patient files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND public.doctor_has_patient_referral(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Doctors can upload referred patient files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'doctor'::app_role)
  AND public.doctor_has_patient_referral(((storage.foldername(name))[1])::uuid)
);
