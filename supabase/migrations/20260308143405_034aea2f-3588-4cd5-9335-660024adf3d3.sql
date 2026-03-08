
-- Doctor Report Templates: configurable templates for milestone reports
CREATE TABLE public.doctor_report_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  milestone_trigger text NOT NULL, -- 'course_started', 'session_completed', 'course_completed', 'manual'
  treatment_type_id uuid REFERENCES public.appointment_types(id),
  subject_template text NOT NULL DEFAULT 'Treatment Update: {{patient_name}}',
  body_template text NOT NULL DEFAULT '',
  variables text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Doctor Reports: generated instances sent to doctors
CREATE TYPE public.doctor_report_status AS ENUM ('pending', 'generating', 'review', 'sent', 'acknowledged');

CREATE TABLE public.doctor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.doctor_report_templates(id),
  treatment_course_id uuid NOT NULL REFERENCES public.treatment_courses(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  status public.doctor_report_status NOT NULL DEFAULT 'pending',
  milestone text NOT NULL, -- which milestone triggered this
  subject text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  body_text text,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid,
  edited_at timestamptz,
  edited_by uuid,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for doctor_report_templates
ALTER TABLE public.doctor_report_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage report templates"
  ON public.doctor_report_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read active report templates"
  ON public.doctor_report_templates FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- RLS for doctor_reports
ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage doctor reports"
  ON public.doctor_reports FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Nurses can view doctor reports"
  ON public.doctor_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'nurse'));

CREATE POLICY "Doctors can view own reports"
  ON public.doctor_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_reports.doctor_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Doctors can acknowledge own reports"
  ON public.doctor_reports FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.doctors d
    WHERE d.id = doctor_reports.doctor_id AND d.user_id = auth.uid()
  ));

-- Audit trigger for doctor_reports status changes
CREATE TRIGGER doctor_reports_status_audit
  BEFORE UPDATE ON public.doctor_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.log_status_change('doctor_report');

-- Updated_at triggers
CREATE TRIGGER update_doctor_report_templates_updated_at
  BEFORE UPDATE ON public.doctor_report_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_reports_updated_at
  BEFORE UPDATE ON public.doctor_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default report templates
INSERT INTO public.doctor_report_templates (name, description, milestone_trigger, subject_template, body_template, variables) VALUES
('Course Started Notification', 'Sent to referring doctor when treatment course begins', 'course_started',
 'Treatment Course Started: {{patient_name}}',
 '<h2>Treatment Course Started</h2><p>Dear Dr {{doctor_name}},</p><p>We are writing to inform you that the treatment course for <strong>{{patient_name}}</strong> has commenced.</p><p><strong>Treatment Type:</strong> {{treatment_type}}</p><p><strong>Planned Sessions:</strong> {{total_sessions}}</p><p><strong>Start Date:</strong> {{start_date}}</p><p>We will keep you updated on progress. Please don''t hesitate to contact us with any questions.</p><p>Kind regards,<br/>Gail Infusion Centre</p>',
 ARRAY['patient_name', 'doctor_name', 'treatment_type', 'total_sessions', 'start_date']),

('Session Progress Update', 'Sent after key session milestones', 'session_completed',
 'Session {{session_number}} Completed: {{patient_name}}',
 '<h2>Session Progress Update</h2><p>Dear Dr {{doctor_name}},</p><p>Session <strong>{{session_number}}</strong> of <strong>{{total_sessions}}</strong> has been completed for <strong>{{patient_name}}</strong>.</p><p><strong>Treatment Type:</strong> {{treatment_type}}</p><p><strong>Session Date:</strong> {{session_date}}</p><p><strong>Progress:</strong> {{sessions_completed}}/{{total_sessions}} sessions completed</p>{{#if session_notes}}<p><strong>Clinical Notes:</strong> {{session_notes}}</p>{{/if}}<p>Kind regards,<br/>Gail Infusion Centre</p>',
 ARRAY['patient_name', 'doctor_name', 'treatment_type', 'session_number', 'total_sessions', 'sessions_completed', 'session_date', 'session_notes']),

('Course Completion Summary', 'Final summary report sent when treatment course completes', 'course_completed',
 'Treatment Course Completed: {{patient_name}}',
 '<h2>Treatment Course Completion Report</h2><p>Dear Dr {{doctor_name}},</p><p>The treatment course for <strong>{{patient_name}}</strong> has been completed.</p><p><strong>Treatment Type:</strong> {{treatment_type}}</p><p><strong>Total Sessions:</strong> {{total_sessions}}</p><p><strong>Start Date:</strong> {{start_date}}</p><p><strong>End Date:</strong> {{end_date}}</p><p><strong>Duration:</strong> {{duration_days}} days</p>{{#if summary}}<h3>Treatment Summary</h3>{{{summary}}}{{/if}}<p>Please do not hesitate to contact us if you require any further information.</p><p>Kind regards,<br/>Gail Infusion Centre</p>',
 ARRAY['patient_name', 'doctor_name', 'treatment_type', 'total_sessions', 'start_date', 'end_date', 'duration_days', 'summary']);
