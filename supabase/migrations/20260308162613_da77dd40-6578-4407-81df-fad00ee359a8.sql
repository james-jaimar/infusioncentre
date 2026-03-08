
-- Add new columns to referrals table
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS medical_aid_scheme text,
  ADD COLUMN IF NOT EXISTS medical_aid_number text,
  ADD COLUMN IF NOT EXISTS medical_aid_main_member text,
  ADD COLUMN IF NOT EXISTS icd10_codes text[],
  ADD COLUMN IF NOT EXISTS clinical_history text,
  ADD COLUMN IF NOT EXISTS current_medications text,
  ADD COLUMN IF NOT EXISTS reason_for_referral text,
  ADD COLUMN IF NOT EXISTS treatment_type_id uuid REFERENCES public.appointment_types(id);

-- Add notification_preferences to doctors table
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"email_frequency": "immediate", "report_delivery": true}'::jsonb;

-- Create referral_attachments table
CREATE TABLE IF NOT EXISTS public.referral_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid NOT NULL REFERENCES public.referrals(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id)
);

ALTER TABLE public.referral_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage referral attachments" ON public.referral_attachments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Doctors can insert own referral attachments" ON public.referral_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM referrals r
      JOIN doctors d ON d.id = r.doctor_id
      WHERE r.id = referral_attachments.referral_id AND d.user_id = auth.uid()
    )
  );

CREATE POLICY "Doctors can view own referral attachments" ON public.referral_attachments
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM referrals r
      JOIN doctors d ON d.id = r.doctor_id
      WHERE r.id = referral_attachments.referral_id AND d.user_id = auth.uid()
    )
  );

-- RLS: Allow doctors to insert referrals
CREATE POLICY "Doctors can insert own referrals" ON public.referrals
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_user_tenant_id(auth.uid())
    AND EXISTS (
      SELECT 1 FROM doctors d WHERE d.id = referrals.doctor_id AND d.user_id = auth.uid()
    )
  );

-- RLS: Allow doctors to update own draft referrals
CREATE POLICY "Doctors can update own draft referrals" ON public.referrals
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_user_tenant_id(auth.uid())
    AND status = 'draft'
    AND EXISTS (
      SELECT 1 FROM doctors d WHERE d.id = referrals.doctor_id AND d.user_id = auth.uid()
    )
  );

-- Create referral-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('referral-attachments', 'referral-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Doctors can upload referral attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'referral-attachments');

CREATE POLICY "Authenticated can read referral attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'referral-attachments');
