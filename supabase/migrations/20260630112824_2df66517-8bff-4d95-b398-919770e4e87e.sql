
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND ur.tenant_id = p.tenant_id
  )
$function$;

REVOKE EXECUTE ON FUNCTION public.auto_generate_onboarding_checklist() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_onboarding_from_course() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_status_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.doctor_has_patient_referral(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_tenant_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_get_all_users() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_get_audit_log(integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_get_metrics() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.platform_get_tenant_stats() FROM anon, authenticated, PUBLIC;

DROP POLICY IF EXISTS "Anon can insert form submissions" ON public.form_submissions;

ALTER TABLE public.form_templates
  ADD COLUMN IF NOT EXISTS public_access boolean NOT NULL DEFAULT false;

UPDATE public.form_templates
SET public_access = true
WHERE slug IN (
  'iron-infusion-pre-questionnaire',
  'iv-infusion-monitoring',
  'ketamine-infusion-consent',
  'ketamine-pre-infusion-questionnaire',
  'ketamine-questionnaire',
  'monofer-motivation',
  'patient-information---iron-infusions',
  'patient-information-agreement-for-care',
  'patient-name-and-history',
  'popi-consent',
  'revellexremsima-infusion-monitoring'
);

DROP POLICY IF EXISTS "Anon can view active templates by slug" ON public.form_templates;
CREATE POLICY "Anon can view public active templates"
  ON public.form_templates
  FOR SELECT
  TO anon
  USING (is_active = true AND public_access = true);

DROP POLICY IF EXISTS "Authenticated can read referral attachments" ON storage.objects;

CREATE POLICY "Admins and nurses can read referral attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'referral-attachments'
    AND (
      public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'nurse'::app_role)
    )
  );

CREATE POLICY "Doctors can read own referral attachments"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'referral-attachments'
    AND public.has_role(auth.uid(), 'doctor'::app_role)
    AND EXISTS (
      SELECT 1
      FROM public.referral_attachments ra
      JOIN public.referrals r ON r.id = ra.referral_id
      JOIN public.doctors d ON d.id = r.doctor_id
      WHERE ra.file_path = storage.objects.name
        AND d.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view form pdf pages" ON storage.objects;
CREATE POLICY "Authenticated can read form pdf pages metadata"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'form-pdf-pages');

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can view roles in their tenant"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can insert roles in their tenant"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role)
              AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can update roles in their tenant"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         AND tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role)
              AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can delete roles in their tenant"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         AND tenant_id = public.get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Doctors can view referred patient vitals" ON public.treatment_vitals;
CREATE POLICY "Doctors can view referred patient vitals"
  ON public.treatment_vitals FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_vitals.treatment_id
      AND d.user_id = auth.uid()
      AND d.tenant_id = t.tenant_id
      AND t.tenant_id = treatment_vitals.tenant_id
  ));

DROP POLICY IF EXISTS "Doctors can view referred patient medications" ON public.treatment_medications;
CREATE POLICY "Doctors can view referred patient medications"
  ON public.treatment_medications FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_medications.treatment_id
      AND d.user_id = auth.uid()
      AND d.tenant_id = t.tenant_id
      AND t.tenant_id = treatment_medications.tenant_id
  ));

DROP POLICY IF EXISTS "Doctors can view referred patient reactions" ON public.treatment_reactions;
CREATE POLICY "Doctors can view referred patient reactions"
  ON public.treatment_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_reactions.treatment_id
      AND d.user_id = auth.uid()
      AND d.tenant_id = t.tenant_id
      AND t.tenant_id = treatment_reactions.tenant_id
  ));

DROP POLICY IF EXISTS "Doctors can view patient summaries" ON public.treatment_summaries;
CREATE POLICY "Doctors can view patient summaries"
  ON public.treatment_summaries FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_summaries.treatment_id
      AND d.user_id = auth.uid()
      AND d.tenant_id = t.tenant_id
      AND t.tenant_id = treatment_summaries.tenant_id
  ));

DROP POLICY IF EXISTS "Doctors can view referred patient billable items" ON public.treatment_billable_items;
CREATE POLICY "Doctors can view referred patient billable items"
  ON public.treatment_billable_items FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.treatments t
    JOIN public.referrals r ON r.patient_id = t.patient_id
    JOIN public.doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_billable_items.treatment_id
      AND d.user_id = auth.uid()
      AND d.tenant_id = t.tenant_id
      AND t.tenant_id = treatment_billable_items.tenant_id
  ));

CREATE POLICY "Nurses can insert patient notes"
  ON public.patient_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'nurse'::app_role)
              AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Nurses can update own patient notes"
  ON public.patient_notes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'nurse'::app_role)
         AND tenant_id = public.get_user_tenant_id(auth.uid())
         AND created_by = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'nurse'::app_role)
              AND tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can view reset tokens in tenant"
  ON public.password_reset_tokens FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         AND EXISTS (
           SELECT 1 FROM public.profiles p
           WHERE p.user_id = password_reset_tokens.user_id
             AND p.tenant_id = public.get_user_tenant_id(auth.uid())
         ));

CREATE POLICY "Admins can delete reset tokens in tenant"
  ON public.password_reset_tokens FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role)
         AND EXISTS (
           SELECT 1 FROM public.profiles p
           WHERE p.user_id = password_reset_tokens.user_id
             AND p.tenant_id = public.get_user_tenant_id(auth.uid())
         ));
