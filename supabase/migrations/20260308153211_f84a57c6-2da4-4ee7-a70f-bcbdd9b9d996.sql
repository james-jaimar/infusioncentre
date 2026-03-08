
-- ============================================================
-- Phase 9: SaaS Hardening — Migration 2: Tenant-Scoped RLS
-- ============================================================

-- Helper: Drop + recreate pattern for all critical tables
-- We'll update policies to include tenant_id scoping

-- ===================== PATIENTS =====================
DROP POLICY IF EXISTS "Admins can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses can update patients" ON public.patients;
DROP POLICY IF EXISTS "Patients can view own record" ON public.patients;
DROP POLICY IF EXISTS "Doctors can view referred patients" ON public.patients;

CREATE POLICY "Admins can view all patients" ON public.patients FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update patients" ON public.patients FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can delete patients" ON public.patients FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view all patients" ON public.patients FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert patients" ON public.patients FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update patients" ON public.patients FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own record" ON public.patients FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can view referred patients" ON public.patients FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM referrals r JOIN doctors d ON d.id = r.doctor_id
    WHERE r.patient_id = patients.id AND d.user_id = auth.uid()
  ));

-- ===================== APPOINTMENTS =====================
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Nurses can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Nurses can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Nurses can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;

CREATE POLICY "Admins can view all appointments" ON public.appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can delete appointments" ON public.appointments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view all appointments" ON public.appointments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = appointments.patient_id AND patients.user_id = auth.uid()
  ));

-- ===================== TREATMENTS =====================
DROP POLICY IF EXISTS "Admins can manage treatments" ON public.treatments;
DROP POLICY IF EXISTS "Nurses can manage treatments" ON public.treatments;

CREATE POLICY "Admins can manage treatments" ON public.treatments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can manage treatments" ON public.treatments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== TREATMENT COURSES =====================
DROP POLICY IF EXISTS "Admins can manage treatment courses" ON public.treatment_courses;
DROP POLICY IF EXISTS "Nurses can view treatment courses" ON public.treatment_courses;
DROP POLICY IF EXISTS "Nurses can update treatment courses" ON public.treatment_courses;
DROP POLICY IF EXISTS "Doctors can view own patient courses" ON public.treatment_courses;
DROP POLICY IF EXISTS "Patients can view own courses" ON public.treatment_courses;

CREATE POLICY "Admins can manage treatment courses" ON public.treatment_courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view treatment courses" ON public.treatment_courses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update treatment courses" ON public.treatment_courses FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can view own patient courses" ON public.treatment_courses FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM doctors d WHERE d.id = treatment_courses.doctor_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "Patients can view own courses" ON public.treatment_courses FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients p WHERE p.id = treatment_courses.patient_id AND p.user_id = auth.uid()
  ));

-- ===================== REFERRALS =====================
DROP POLICY IF EXISTS "Admins can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Nurses can view referrals" ON public.referrals;
DROP POLICY IF EXISTS "Nurses can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Doctors can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Doctors can view own referrals" ON public.referrals;

CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view referrals" ON public.referrals FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update referrals" ON public.referrals FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can insert referrals" ON public.referrals FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM doctors d WHERE d.id = referrals.doctor_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "Doctors can view own referrals" ON public.referrals FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM doctors d WHERE d.id = referrals.doctor_id AND d.user_id = auth.uid()
  ));

-- ===================== INVOICES =====================
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
DROP POLICY IF EXISTS "Nurses can view invoices" ON public.invoices;

CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view invoices" ON public.invoices FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== DOCTORS =====================
DROP POLICY IF EXISTS "Admins can manage doctors" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can view own record" ON public.doctors;
DROP POLICY IF EXISTS "Doctors can update own record" ON public.doctors;

CREATE POLICY "Admins can manage doctors" ON public.doctors FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can view own record" ON public.doctors FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can update own record" ON public.doctors FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== CONFIG TABLES (clinic_settings, feature_flags, etc.) =====================
DROP POLICY IF EXISTS "Admins can manage clinic settings" ON public.clinic_settings;
DROP POLICY IF EXISTS "Authenticated can read clinic settings" ON public.clinic_settings;

CREATE POLICY "Admins can manage clinic settings" ON public.clinic_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can read clinic settings" ON public.clinic_settings FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Authenticated can read feature flags" ON public.feature_flags;

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can read feature flags" ON public.feature_flags FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== BILLABLE ITEMS =====================
DROP POLICY IF EXISTS "Admins can manage billable items" ON public.billable_items;
DROP POLICY IF EXISTS "Nurses can view billable items" ON public.billable_items;

CREATE POLICY "Admins can manage billable items" ON public.billable_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view billable items" ON public.billable_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== BILLING CLAIMS =====================
DROP POLICY IF EXISTS "Admins can manage billing claims" ON public.billing_claims;

CREATE POLICY "Admins can manage billing claims" ON public.billing_claims FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== FORM TEMPLATES =====================
DROP POLICY IF EXISTS "Admins can manage form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Nurses can view form templates" ON public.form_templates;
DROP POLICY IF EXISTS "Patients can view active form templates" ON public.form_templates;

CREATE POLICY "Admins can manage form templates" ON public.form_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view form templates" ON public.form_templates FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view active form templates" ON public.form_templates FOR SELECT TO authenticated
  USING (is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== FORM SUBMISSIONS =====================
DROP POLICY IF EXISTS "Admins can manage form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Nurses can view form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Nurses can insert form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Nurses can update form submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Patients can view own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Patients can insert own submissions" ON public.form_submissions;
DROP POLICY IF EXISTS "Patients can update own draft submissions" ON public.form_submissions;

CREATE POLICY "Admins can manage form submissions" ON public.form_submissions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view form submissions" ON public.form_submissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert form submissions" ON public.form_submissions FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update form submissions" ON public.form_submissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own submissions" ON public.form_submissions FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()
  ));
CREATE POLICY "Patients can insert own submissions" ON public.form_submissions FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()
  ));
CREATE POLICY "Patients can update own draft submissions" ON public.form_submissions FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND status IN ('draft', 'submitted') AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = form_submissions.patient_id AND patients.user_id = auth.uid()
  ));

-- ===================== PROFILES =====================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Nurses can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===================== APPOINTMENT TYPES =====================
DROP POLICY IF EXISTS "Admins can view all types" ON public.appointment_types;
DROP POLICY IF EXISTS "Admins can insert types" ON public.appointment_types;
DROP POLICY IF EXISTS "Admins can update types" ON public.appointment_types;
DROP POLICY IF EXISTS "Admins can delete types" ON public.appointment_types;
DROP POLICY IF EXISTS "Authenticated users can view active types" ON public.appointment_types;

CREATE POLICY "Admins can view all types" ON public.appointment_types FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert types" ON public.appointment_types FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update types" ON public.appointment_types FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can delete types" ON public.appointment_types FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated users can view active types" ON public.appointment_types FOR SELECT TO authenticated
  USING (is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== TREATMENT CHAIRS =====================
DROP POLICY IF EXISTS "Admins can manage treatment chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Nurses can view treatment chairs" ON public.treatment_chairs;
DROP POLICY IF EXISTS "Authenticated can view active chairs" ON public.treatment_chairs;

CREATE POLICY "Admins can manage treatment chairs" ON public.treatment_chairs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view treatment chairs" ON public.treatment_chairs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== EMAIL TEMPLATES =====================
DROP POLICY IF EXISTS "Admins can manage email templates" ON public.email_templates;

CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- ===================== AUDIT LOG =====================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_log;
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_log;

CREATE POLICY "Admins can view audit logs" ON public.audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Users can insert their own audit logs" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ===================== REMAINING TABLES — tenant scoping =====================

-- Clinical alerts
DROP POLICY IF EXISTS "Admins can manage clinical alerts" ON public.clinical_alerts;
DROP POLICY IF EXISTS "Nurses can manage clinical alerts" ON public.clinical_alerts;

CREATE POLICY "Admins can manage clinical alerts" ON public.clinical_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can manage clinical alerts" ON public.clinical_alerts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Doctor reports
DROP POLICY IF EXISTS "Admins can manage doctor reports" ON public.doctor_reports;
DROP POLICY IF EXISTS "Nurses can view doctor reports" ON public.doctor_reports;
DROP POLICY IF EXISTS "Doctors can view own reports" ON public.doctor_reports;
DROP POLICY IF EXISTS "Doctors can acknowledge own reports" ON public.doctor_reports;

CREATE POLICY "Admins can manage doctor reports" ON public.doctor_reports FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view doctor reports" ON public.doctor_reports FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Doctors can view own reports" ON public.doctor_reports FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM doctors d WHERE d.id = doctor_reports.doctor_id AND d.user_id = auth.uid()
  ));
CREATE POLICY "Doctors can acknowledge own reports" ON public.doctor_reports FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM doctors d WHERE d.id = doctor_reports.doctor_id AND d.user_id = auth.uid()
  ));

-- Doctor report templates
DROP POLICY IF EXISTS "Admins can manage report templates" ON public.doctor_report_templates;
DROP POLICY IF EXISTS "Authenticated can read active report templates" ON public.doctor_report_templates;

CREATE POLICY "Admins can manage report templates" ON public.doctor_report_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can read active report templates" ON public.doctor_report_templates FOR SELECT TO authenticated
  USING (is_active = true AND tenant_id = get_user_tenant_id(auth.uid()));

-- Communication log
DROP POLICY IF EXISTS "Admins can view communication logs" ON public.communication_log;
DROP POLICY IF EXISTS "Admins can insert communication logs" ON public.communication_log;
DROP POLICY IF EXISTS "Admins can update communication logs" ON public.communication_log;

CREATE POLICY "Admins can view communication logs" ON public.communication_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert communication logs" ON public.communication_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update communication logs" ON public.communication_log FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Onboarding checklists
DROP POLICY IF EXISTS "Admins can manage onboarding checklists" ON public.onboarding_checklists;
DROP POLICY IF EXISTS "Nurses can view onboarding checklists" ON public.onboarding_checklists;
DROP POLICY IF EXISTS "Nurses can update onboarding checklists" ON public.onboarding_checklists;
DROP POLICY IF EXISTS "Patients can view own checklists" ON public.onboarding_checklists;
DROP POLICY IF EXISTS "Patients can update own checklists" ON public.onboarding_checklists;

CREATE POLICY "Admins can manage onboarding checklists" ON public.onboarding_checklists FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view onboarding checklists" ON public.onboarding_checklists FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update onboarding checklists" ON public.onboarding_checklists FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own checklists" ON public.onboarding_checklists FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = onboarding_checklists.patient_id AND patients.user_id = auth.uid()
  ));
CREATE POLICY "Patients can update own checklists" ON public.onboarding_checklists FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = onboarding_checklists.patient_id AND patients.user_id = auth.uid()
  ));

-- Patient documents
DROP POLICY IF EXISTS "Admins can view all documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Nurses can view all documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Nurses can insert documents" ON public.patient_documents;
DROP POLICY IF EXISTS "Patients can view own documents" ON public.patient_documents;

CREATE POLICY "Admins can view all documents" ON public.patient_documents FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert documents" ON public.patient_documents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can delete documents" ON public.patient_documents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view all documents" ON public.patient_documents FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert documents" ON public.patient_documents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own documents" ON public.patient_documents FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_documents.patient_id AND patients.user_id = auth.uid()
  ));

-- Patient medical history
DROP POLICY IF EXISTS "Admins can view all medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Admins can insert medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Admins can update medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Nurses can view all medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Nurses can insert medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Nurses can update medical history" ON public.patient_medical_history;
DROP POLICY IF EXISTS "Patients can view own medical history" ON public.patient_medical_history;

CREATE POLICY "Admins can view all medical history" ON public.patient_medical_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can insert medical history" ON public.patient_medical_history FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update medical history" ON public.patient_medical_history FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view all medical history" ON public.patient_medical_history FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert medical history" ON public.patient_medical_history FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update medical history" ON public.patient_medical_history FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own medical history" ON public.patient_medical_history FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_medical_history.patient_id AND patients.user_id = auth.uid()
  ));

-- Patient invites
DROP POLICY IF EXISTS "Admins can manage invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Nurses can manage invites" ON public.patient_invites;
DROP POLICY IF EXISTS "Patients can view own invites" ON public.patient_invites;

CREATE POLICY "Admins can manage invites" ON public.patient_invites FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can manage invites" ON public.patient_invites FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Patients can view own invites" ON public.patient_invites FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_invites.patient_id AND patients.user_id = auth.uid()
  ));

-- Contact submissions (public insert stays, admin scoped)
DROP POLICY IF EXISTS "Admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON public.contact_submissions;

CREATE POLICY "Admins can view contact submissions" ON public.contact_submissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Admins can delete contact submissions" ON public.contact_submissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Remaining config/supporting tables
DROP POLICY IF EXISTS "Admins can manage reminders" ON public.appointment_reminders;
DROP POLICY IF EXISTS "Nurses can view reminders" ON public.appointment_reminders;

CREATE POLICY "Admins can manage reminders" ON public.appointment_reminders FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view reminders" ON public.appointment_reminders FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Payer rate mappings
DROP POLICY IF EXISTS "Admins can manage payer rates" ON public.payer_rate_mappings;

CREATE POLICY "Admins can manage payer rates" ON public.payer_rate_mappings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Invoice line items
DROP POLICY IF EXISTS "Admins can manage invoice lines" ON public.invoice_line_items;
DROP POLICY IF EXISTS "Nurses can view invoice lines" ON public.invoice_line_items;

CREATE POLICY "Admins can manage invoice lines" ON public.invoice_line_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view invoice lines" ON public.invoice_line_items FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Ketamine monitoring
DROP POLICY IF EXISTS "Admins can manage ketamine monitoring" ON public.ketamine_monitoring;
DROP POLICY IF EXISTS "Nurses can view ketamine monitoring" ON public.ketamine_monitoring;
DROP POLICY IF EXISTS "Nurses can insert ketamine monitoring" ON public.ketamine_monitoring;
DROP POLICY IF EXISTS "Nurses can update ketamine monitoring" ON public.ketamine_monitoring;

CREATE POLICY "Admins can manage ketamine monitoring" ON public.ketamine_monitoring FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view ketamine monitoring" ON public.ketamine_monitoring FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can insert ketamine monitoring" ON public.ketamine_monitoring FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can update ketamine monitoring" ON public.ketamine_monitoring FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Discharge criteria
DROP POLICY IF EXISTS "Admins can manage discharge criteria" ON public.discharge_criteria;
DROP POLICY IF EXISTS "Nurses can view discharge criteria" ON public.discharge_criteria;

CREATE POLICY "Admins can manage discharge criteria" ON public.discharge_criteria FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Nurses can view discharge criteria" ON public.discharge_criteria FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Status dictionaries
DROP POLICY IF EXISTS "Admins can manage status dictionaries" ON public.status_dictionaries;
DROP POLICY IF EXISTS "Authenticated can read status dictionaries" ON public.status_dictionaries;

CREATE POLICY "Admins can manage status dictionaries" ON public.status_dictionaries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can read status dictionaries" ON public.status_dictionaries FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Status transitions
DROP POLICY IF EXISTS "Admins can manage status transitions" ON public.status_transitions;
DROP POLICY IF EXISTS "Authenticated can read status transitions" ON public.status_transitions;

CREATE POLICY "Admins can manage status transitions" ON public.status_transitions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can read status transitions" ON public.status_transitions FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Treatment protocols
DROP POLICY IF EXISTS "Admins can manage treatment protocols" ON public.treatment_protocols;
DROP POLICY IF EXISTS "Authenticated can view active protocols" ON public.treatment_protocols;

CREATE POLICY "Admins can manage treatment protocols" ON public.treatment_protocols FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Authenticated can view active protocols" ON public.treatment_protocols FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Course bookings
DROP POLICY IF EXISTS "Admins can manage bookings" ON public.course_bookings;

CREATE POLICY "Admins can manage bookings" ON public.course_bookings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));

-- Training courses (public read stays implicit via anon, admin manages)
DROP POLICY IF EXISTS "Admins can manage training courses" ON public.training_courses;
DROP POLICY IF EXISTS "Anyone can view active courses" ON public.training_courses;

CREATE POLICY "Admins can manage training courses" ON public.training_courses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "Anyone can view active courses" ON public.training_courses FOR SELECT USING (true);

-- Update handle_new_user to include tenant_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
BEGIN
  -- Default to the first tenant; in multi-tenant, this would come from invite/signup context
  _tenant_id := COALESCE(
    (NEW.raw_user_meta_data ->> 'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );

  INSERT INTO public.profiles (user_id, first_name, last_name, tenant_id)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'last_name', _tenant_id);
  
  INSERT INTO public.user_roles (user_id, role, tenant_id)
  VALUES (NEW.id, 'patient', _tenant_id);
  
  RETURN NEW;
END;
$$;
