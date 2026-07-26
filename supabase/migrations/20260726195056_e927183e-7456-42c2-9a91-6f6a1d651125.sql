
-- 1) Tighten storage policies for patient-documents to enforce tenant scoping
DROP POLICY IF EXISTS "Admins can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Nurses can view patient documents" ON storage.objects;
DROP POLICY IF EXISTS "Nurses can upload patient documents" ON storage.objects;

CREATE POLICY "Admins can view patient documents in tenant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Admins can upload patient documents in tenant"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Admins can delete patient documents in tenant"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Nurses can view patient documents in tenant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'nurse'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

CREATE POLICY "Nurses can upload patient documents in tenant"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'nurse'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id::text = (storage.foldername(name))[1]
      AND p.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 2) Tighten storage policy for referral-attachments to enforce tenant scoping
DROP POLICY IF EXISTS "Admins and nurses can read referral attachments" ON storage.objects;

CREATE POLICY "Admins and nurses can read referral attachments in tenant"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'referral-attachments'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role))
  AND EXISTS (
    SELECT 1
    FROM public.referral_attachments ra
    JOIN public.referrals r ON r.id = ra.referral_id
    WHERE ra.file_path = storage.objects.name
      AND r.tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- 3) Lock down SECURITY DEFINER function execution
-- Trigger-only functions: revoke execute from all client roles
REVOKE EXECUTE ON FUNCTION public.create_onboarding_from_course() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_onboarding_on_appointment_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_onboarding_on_appointment_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_form_template_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_generate_onboarding_checklist() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_status_change() FROM PUBLIC, anon, authenticated;

-- Helper functions used by RLS: keep executable by authenticated only, revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_tenant_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.doctor_has_patient_referral(uuid) FROM PUBLIC, anon;

-- Platform super-admin RPCs: revoke anon (checks super-admin internally)
REVOKE EXECUTE ON FUNCTION public.platform_get_audit_log(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_metrics() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_all_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_tenant_stats() FROM PUBLIC, anon;

-- Invoice number generator: authenticated only
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number() FROM PUBLIC, anon;

-- validate_invite_token stays callable by anon (public invite landing page)
