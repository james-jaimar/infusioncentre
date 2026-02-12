
-- Email templates table for predefined templates
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  variables text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email templates"
  ON public.email_templates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed predefined templates
INSERT INTO public.email_templates (slug, name, description, subject, html_body, text_body, variables) VALUES
('patient_invite', 'Patient Invitation', 'Sent when a patient is invited to register on the portal', 'You''re invited — The Johannesburg Infusion Centre', '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background-color:#3E5B84;padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">The Johannesburg Infusion Centre</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#1a1a1a;margin:0 0 16px;">Welcome, {{patient_name}}!</h2><p style="color:#4a4a4a;font-size:16px;line-height:1.5;">You''ve been invited to register on the patient portal for The Johannesburg Infusion Centre. Click the button below to create your account and complete your onboarding forms.</p><table cellpadding="0" cellspacing="0" style="margin:30px 0;"><tr><td style="background-color:#3E5B84;border-radius:6px;padding:14px 32px;"><a href="{{invite_link}}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Register Now</a></td></tr></table><p style="color:#4a4a4a;font-size:14px;line-height:1.5;">This invitation expires on <strong>{{expiry_date}}</strong>.</p><p style="color:#999;font-size:12px;margin-top:20px;">If the button doesn''t work, copy and paste this link into your browser:<br/><a href="{{invite_link}}" style="color:#3E5B84;">{{invite_link}}</a></p></td></tr><tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Johannesburg Infusion Centre<br/>This is an automated message, please do not reply.</p></td></tr></table></td></tr></table></body></html>', 'Hi {{patient_name}}, you''ve been invited to register at The Johannesburg Infusion Centre. Visit: {{invite_link}}', ARRAY['patient_name', 'invite_link', 'expiry_date']),

('password_reset', 'Password Reset', 'Sent when a user requests a password reset', 'Password Reset — The Johannesburg Infusion Centre', '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;"><tr><td style="background-color:#3E5B84;padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">The Johannesburg Infusion Centre</h1></td></tr><tr><td style="padding:40px 30px;"><h2 style="color:#1a1a1a;margin:0 0 16px;">Password Reset</h2><p style="color:#4a4a4a;font-size:16px;line-height:1.5;">We received a request to reset your password. Click the button below to set a new password.</p><table cellpadding="0" cellspacing="0" style="margin:30px 0;"><tr><td style="background-color:#3E5B84;border-radius:6px;padding:14px 32px;"><a href="{{reset_link}}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">Reset Password</a></td></tr></table><p style="color:#4a4a4a;font-size:14px;line-height:1.5;">This link expires in <strong>1 hour</strong>. If you did not request this, you can safely ignore this email.</p><p style="color:#999;font-size:12px;margin-top:20px;">If the button doesn''t work, copy and paste this link into your browser:<br/><a href="{{reset_link}}" style="color:#3E5B84;">{{reset_link}}</a></p></td></tr><tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">The Johannesburg Infusion Centre<br/>This is an automated message, please do not reply.</p></td></tr></table></td></tr></table></body></html>', 'You requested a password reset for The Johannesburg Infusion Centre. Visit: {{reset_link}}', ARRAY['reset_link']);
