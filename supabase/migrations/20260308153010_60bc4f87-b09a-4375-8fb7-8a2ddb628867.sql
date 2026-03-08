
-- ============================================================
-- Phase 9: SaaS Hardening — Migration 1: Tenant Infrastructure
-- ============================================================

-- 1. Create subscription_plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'professional', 'enterprise');

-- 2. Create tenants table
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#3E5B84',
  secondary_color text DEFAULT '#6B8EB2',
  accent_color text DEFAULT '#E8A87C',
  domain text UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'professional',
  max_chairs integer NOT NULL DEFAULT 10,
  max_users integer NOT NULL DEFAULT 50,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}',
  billing_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. Seed default tenant for existing data
INSERT INTO public.tenants (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Gail Infusion Centre', 'gail-infusion', 'enterprise');

-- 4. Add tenant_id to profiles (links user → tenant)
ALTER TABLE public.profiles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.profiles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.profiles ALTER COLUMN tenant_id SET NOT NULL;

-- 5. Create get_user_tenant_id security definer function
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 6. Add tenant_id to all business tables (with default for existing data)

ALTER TABLE public.patients ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.patients SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.patients ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.doctors ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.doctors SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.doctors ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.appointments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.appointments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.appointments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.appointment_types ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.appointment_types SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.appointment_types ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.appointment_reminders ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.appointment_reminders SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.appointment_reminders ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_courses ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_courses SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_courses ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_chairs ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_chairs SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_chairs ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_protocols ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_protocols SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_protocols ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_protocol_steps ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_protocol_steps SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_protocol_steps ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_vitals ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_vitals SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_vitals ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_iv_access ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_iv_access SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_iv_access ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_medications ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_medications SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_medications ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_reactions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_reactions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_reactions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_summaries ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_summaries SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_summaries ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_billable_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_billable_items SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_billable_items ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_assessments ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_assessments SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_assessments ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.treatment_site_checks ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.treatment_site_checks SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.treatment_site_checks ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.referrals ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.referrals SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.referrals ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.billable_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.billable_items SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.billable_items ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.invoices ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.invoices SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.invoices ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.invoice_line_items ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.invoice_line_items SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.invoice_line_items ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.billing_claims ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.billing_claims SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.billing_claims ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.payer_rate_mappings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.payer_rate_mappings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.payer_rate_mappings ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.form_templates ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.form_templates SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.form_templates ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.form_submissions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.form_submissions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.form_submissions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.onboarding_checklists ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.onboarding_checklists SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.onboarding_checklists ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.clinical_alerts ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.clinical_alerts SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.clinical_alerts ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.vitals_thresholds ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.vitals_thresholds SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.vitals_thresholds ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.ketamine_monitoring ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.ketamine_monitoring SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.ketamine_monitoring ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.discharge_criteria ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.discharge_criteria SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.discharge_criteria ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.doctor_reports ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.doctor_reports SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.doctor_reports ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.doctor_report_templates ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.doctor_report_templates SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.doctor_report_templates ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.email_templates ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.email_templates SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.email_templates ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.communication_log ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.communication_log SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.communication_log ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.contact_submissions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.contact_submissions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.contact_submissions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.course_bookings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.course_bookings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.course_bookings ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.training_courses ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.training_courses SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.training_courses ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.clinic_settings ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.clinic_settings SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.clinic_settings ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.feature_flags ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.feature_flags SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.feature_flags ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.status_dictionaries ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.status_dictionaries SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.status_dictionaries ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.status_transitions ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.status_transitions SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.status_transitions ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.patient_documents ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.patient_documents SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.patient_documents ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.patient_medical_history ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.patient_medical_history SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.patient_medical_history ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.patient_invites ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.patient_invites SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.patient_invites ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.audit_log ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.audit_log SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.audit_log ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.user_roles ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.user_roles SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.user_roles ALTER COLUMN tenant_id SET NOT NULL;

ALTER TABLE public.password_reset_tokens ADD COLUMN tenant_id uuid REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';
UPDATE public.password_reset_tokens SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
ALTER TABLE public.password_reset_tokens ALTER COLUMN tenant_id SET NOT NULL;

-- 7. Create indexes for tenant_id on high-traffic tables
CREATE INDEX idx_patients_tenant ON public.patients(tenant_id);
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_treatments_tenant ON public.treatments(tenant_id);
CREATE INDEX idx_treatment_courses_tenant ON public.treatment_courses(tenant_id);
CREATE INDEX idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX idx_referrals_tenant ON public.referrals(tenant_id);
CREATE INDEX idx_profiles_tenant ON public.profiles(tenant_id);
CREATE INDEX idx_user_roles_tenant ON public.user_roles(tenant_id);
CREATE INDEX idx_form_submissions_tenant ON public.form_submissions(tenant_id);
CREATE INDEX idx_audit_log_tenant ON public.audit_log(tenant_id);

-- 8. Create subscription_usage tracking table
CREATE TABLE public.subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  current_value integer NOT NULL DEFAULT 0,
  limit_value integer,
  period_start date NOT NULL DEFAULT date_trunc('month', now())::date,
  period_end date NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month' - interval '1 day')::date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, metric_key, period_start)
);

ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

-- 9. Tenants RLS: super-admin sees all, tenant members see own
CREATE POLICY "Tenant members can view own tenant"
  ON public.tenants FOR SELECT
  TO authenticated
  USING (id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Super admins can manage tenants"
  ON public.tenants FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND get_user_tenant_id(auth.uid()) = '00000000-0000-0000-0000-000000000001');

-- 10. Subscription usage RLS
CREATE POLICY "Admins can view own tenant usage"
  ON public.subscription_usage FOR SELECT
  TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage usage"
  ON public.subscription_usage FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin') AND get_user_tenant_id(auth.uid()) = '00000000-0000-0000-0000-000000000001');

-- 11. Update updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. Update has_role to be tenant-aware
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 13. Create tenant-scoped role check
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1)
  )
$$;
