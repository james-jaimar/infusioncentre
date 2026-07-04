
-- =========================================================
-- treatments: add tenant scoping to remaining policies
-- =========================================================
DROP POLICY IF EXISTS "Nurses can insert treatments" ON public.treatments;
DROP POLICY IF EXISTS "Nurses can update treatments" ON public.treatments;
DROP POLICY IF EXISTS "Nurses can view treatments" ON public.treatments;
DROP POLICY IF EXISTS "Doctors can view referred patient treatments" ON public.treatments;
DROP POLICY IF EXISTS "Patients can view own treatments" ON public.treatments;

CREATE POLICY "Nurses can insert treatments" ON public.treatments
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update treatments" ON public.treatments
  FOR UPDATE USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view treatments" ON public.treatments
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can view referred patient treatments" ON public.treatments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM referrals r JOIN doctors d ON d.id = r.doctor_id
            WHERE r.patient_id = treatments.patient_id
              AND d.user_id = auth.uid()
              AND d.tenant_id = treatments.tenant_id)
  );
CREATE POLICY "Patients can view own treatments" ON public.treatments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients p
            WHERE p.id = treatments.patient_id
              AND p.user_id = auth.uid()
              AND p.tenant_id = treatments.tenant_id)
  );

-- =========================================================
-- treatment_vitals
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage vitals" ON public.treatment_vitals;
DROP POLICY IF EXISTS "Nurses can insert vitals" ON public.treatment_vitals;
DROP POLICY IF EXISTS "Nurses can update vitals" ON public.treatment_vitals;
DROP POLICY IF EXISTS "Nurses can view vitals" ON public.treatment_vitals;

CREATE POLICY "Admins can manage vitals" ON public.treatment_vitals
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert vitals" ON public.treatment_vitals
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update vitals" ON public.treatment_vitals
  FOR UPDATE USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view vitals" ON public.treatment_vitals
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_medications
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage medications" ON public.treatment_medications;
DROP POLICY IF EXISTS "Nurses can insert medications" ON public.treatment_medications;
DROP POLICY IF EXISTS "Nurses can update medications" ON public.treatment_medications;
DROP POLICY IF EXISTS "Nurses can view medications" ON public.treatment_medications;

CREATE POLICY "Admins can manage medications" ON public.treatment_medications
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert medications" ON public.treatment_medications
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update medications" ON public.treatment_medications
  FOR UPDATE USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view medications" ON public.treatment_medications
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_reactions
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage reactions" ON public.treatment_reactions;
DROP POLICY IF EXISTS "Nurses can insert reactions" ON public.treatment_reactions;
DROP POLICY IF EXISTS "Nurses can update reactions" ON public.treatment_reactions;
DROP POLICY IF EXISTS "Nurses can view reactions" ON public.treatment_reactions;

CREATE POLICY "Admins can manage reactions" ON public.treatment_reactions
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert reactions" ON public.treatment_reactions
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update reactions" ON public.treatment_reactions
  FOR UPDATE USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view reactions" ON public.treatment_reactions
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_iv_access
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage iv access" ON public.treatment_iv_access;
DROP POLICY IF EXISTS "Nurses can insert iv access" ON public.treatment_iv_access;
DROP POLICY IF EXISTS "Nurses can update iv access" ON public.treatment_iv_access;
DROP POLICY IF EXISTS "Nurses can view iv access" ON public.treatment_iv_access;

CREATE POLICY "Admins can manage iv access" ON public.treatment_iv_access
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert iv access" ON public.treatment_iv_access
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update iv access" ON public.treatment_iv_access
  FOR UPDATE USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view iv access" ON public.treatment_iv_access
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_site_checks
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage site checks" ON public.treatment_site_checks;
DROP POLICY IF EXISTS "Nurses can insert site checks" ON public.treatment_site_checks;
DROP POLICY IF EXISTS "Nurses can view site checks" ON public.treatment_site_checks;

CREATE POLICY "Admins can manage site checks" ON public.treatment_site_checks
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert site checks" ON public.treatment_site_checks
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view site checks" ON public.treatment_site_checks
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_billable_items
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage treatment billable items" ON public.treatment_billable_items;
DROP POLICY IF EXISTS "Nurses can insert treatment billable items" ON public.treatment_billable_items;
DROP POLICY IF EXISTS "Nurses can view treatment billable items" ON public.treatment_billable_items;

CREATE POLICY "Admins can manage treatment billable items" ON public.treatment_billable_items
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert treatment billable items" ON public.treatment_billable_items
  FOR INSERT WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view treatment billable items" ON public.treatment_billable_items
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_summaries
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage treatment summaries" ON public.treatment_summaries;
DROP POLICY IF EXISTS "Nurses can manage treatment summaries" ON public.treatment_summaries;

CREATE POLICY "Admins can manage treatment summaries" ON public.treatment_summaries
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can manage treatment summaries" ON public.treatment_summaries
  FOR ALL USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_protocols: drop redundant non-tenant-scoped policy
-- =========================================================
DROP POLICY IF EXISTS "Nurses can view treatment protocols" ON public.treatment_protocols;
CREATE POLICY "Nurses can view treatment protocols" ON public.treatment_protocols
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_protocol_steps: scope through parent protocol tenant
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage protocol steps" ON public.treatment_protocol_steps;
DROP POLICY IF EXISTS "Nurses can view protocol steps" ON public.treatment_protocol_steps;

CREATE POLICY "Admins can manage protocol steps" ON public.treatment_protocol_steps
  FOR ALL USING (
    has_role(auth.uid(),'admin') AND EXISTS (
      SELECT 1 FROM public.treatment_protocols tp
      WHERE tp.id = treatment_protocol_steps.protocol_id
        AND tp.tenant_id = get_user_tenant_id(auth.uid())
    )
  ) WITH CHECK (
    has_role(auth.uid(),'admin') AND EXISTS (
      SELECT 1 FROM public.treatment_protocols tp
      WHERE tp.id = treatment_protocol_steps.protocol_id
        AND tp.tenant_id = get_user_tenant_id(auth.uid())
    )
  );
CREATE POLICY "Nurses can view protocol steps" ON public.treatment_protocol_steps
  FOR SELECT USING (
    has_role(auth.uid(),'nurse') AND EXISTS (
      SELECT 1 FROM public.treatment_protocols tp
      WHERE tp.id = treatment_protocol_steps.protocol_id
        AND tp.tenant_id = get_user_tenant_id(auth.uid())
    )
  );

-- =========================================================
-- vitals_thresholds
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage vitals thresholds" ON public.vitals_thresholds;
DROP POLICY IF EXISTS "Nurses can view vitals thresholds" ON public.vitals_thresholds;

CREATE POLICY "Admins can manage vitals thresholds" ON public.vitals_thresholds
  FOR ALL USING (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(),'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view vitals thresholds" ON public.vitals_thresholds
  FOR SELECT USING (has_role(auth.uid(),'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- treatment_chairs: drop redundant non-tenant-scoped policies
-- =========================================================
DROP POLICY IF EXISTS "Admins can view all chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Admins can insert chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Admins can update chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Admins can delete chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Authenticated users can view active chairs" ON public.treatment_chairs;

CREATE POLICY "Authenticated users can view active chairs" ON public.treatment_chairs
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

-- =========================================================
-- training_courses: drop redundant non-tenant policy
-- =========================================================
DROP POLICY IF EXISTS "Admins can manage courses" ON public.training_courses;

-- =========================================================
-- Storage: tighten referral attachment upload policy
-- =========================================================
DROP POLICY IF EXISTS "Doctors can upload referral attachments" ON storage.objects;
CREATE POLICY "Doctors can upload referral attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'referral-attachments'
    AND has_role(auth.uid(), 'doctor'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.referrals r
      JOIN public.doctors d ON d.id = r.doctor_id
      WHERE d.user_id = auth.uid()
        AND (
          -- new attachment landing in a doctor-owned path (referral id prefix)
          position(r.id::text in name) > 0
        )
    )
  );

-- =========================================================
-- Revoke EXECUTE on internal SECURITY DEFINER functions from
-- anon/authenticated so they cannot be called via PostgREST.
-- Trigger + platform-admin-only functions are safe to lock down;
-- helpers used inside RLS policies (has_role, get_user_tenant_id,
-- has_tenant_role, is_super_admin, doctor_has_patient_referral,
-- get_user_role, validate_invite_token) remain callable.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.generate_form_template_slug()          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_invoice_number()              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_onboarding_from_course()        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()             FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_generate_onboarding_checklist()   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_status_change()                    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.platform_get_audit_log(integer)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_metrics()                 FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_all_users()               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.platform_get_tenant_stats()            FROM PUBLIC, anon;
