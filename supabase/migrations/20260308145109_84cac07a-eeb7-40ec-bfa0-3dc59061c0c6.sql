
-- Clinic settings (singleton pattern - one row per key)
CREATE TABLE public.clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  label text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clinic settings" ON public.clinic_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read clinic settings" ON public.clinic_settings FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Feature flags
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  is_enabled boolean NOT NULL DEFAULT false,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage feature flags" ON public.feature_flags FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read feature flags" ON public.feature_flags FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Triggers
CREATE TRIGGER update_clinic_settings_updated_at BEFORE UPDATE ON public.clinic_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed clinic settings
INSERT INTO public.clinic_settings (key, label, category, description, value) VALUES
  ('business_name', 'Business Name', 'general', 'The name of your clinic', '"Gail Infusion Centre"'),
  ('business_phone', 'Phone Number', 'general', 'Primary contact number', '""'),
  ('business_email', 'Email Address', 'general', 'Primary contact email', '""'),
  ('business_address', 'Address', 'general', 'Physical address', '{"line1":"","line2":"","city":"","postal_code":""}'),
  ('business_hours', 'Business Hours', 'general', 'Operating hours', '{"monday":"08:00-17:00","tuesday":"08:00-17:00","wednesday":"08:00-17:00","thursday":"08:00-17:00","friday":"08:00-17:00","saturday":"closed","sunday":"closed"}'),
  ('session_timeout_minutes', 'Session Timeout', 'security', 'Minutes of inactivity before auto-logout', '30'),
  ('default_appointment_duration', 'Default Appointment Duration', 'scheduling', 'Default duration in minutes for new appointments', '60'),
  ('vat_rate', 'VAT Rate', 'billing', 'VAT percentage applied to invoices', '15'),
  ('invoice_payment_terms_days', 'Payment Terms', 'billing', 'Days until invoice is due', '30'),
  ('invoice_footer_text', 'Invoice Footer', 'billing', 'Text displayed at the bottom of invoices', '"Thank you for choosing Gail Infusion Centre."');

-- Seed feature flags
INSERT INTO public.feature_flags (key, label, description, category, is_enabled, display_order) VALUES
  ('ketamine_monitoring', 'Ketamine Monitoring', 'Enable specialised ketamine monitoring panels for nurses', 'clinical', true, 1),
  ('whatsapp_notifications', 'WhatsApp Notifications', 'Send appointment reminders and updates via WhatsApp', 'communications', false, 2),
  ('patient_portal', 'Patient Portal', 'Allow patients to log in and complete onboarding forms', 'patient', true, 3),
  ('doctor_portal', 'Doctor Portal', 'Allow referring doctors to submit referrals and view progress', 'doctor', true, 4),
  ('auto_billing', 'Auto-Generate Invoices', 'Automatically generate invoices when treatment courses complete', 'billing', false, 5),
  ('sms_reminders', 'SMS Reminders', 'Send SMS appointment reminders to patients', 'communications', false, 6),
  ('clinical_alerts', 'Clinical Alerts', 'Enable automated clinical alerts for abnormal vitals', 'clinical', true, 7),
  ('stock_tracking', 'Stock Tracking', 'Track inventory levels for billable consumables', 'billing', true, 8);
