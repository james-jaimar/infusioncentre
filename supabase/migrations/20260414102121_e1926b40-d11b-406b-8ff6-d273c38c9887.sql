
INSERT INTO public.feature_flags (key, label, description, category, is_enabled, display_order)
VALUES
  ('notify_admin_doctor_referral',   'Doctor Referral Received',     'Email admin when a new doctor referral is submitted',                    'notifications', true, 1),
  ('notify_admin_form_completion',   'Patient Form Completed',       'Email admin when a patient completes a form',                            'notifications', true, 2),
  ('notify_admin_patient_update',    'Patient Change Request',       'Email admin when a patient requests a change (cancellation, reschedule)', 'notifications', true, 3),
  ('notify_doctor_patient_progress', 'Patient Progress Update',      'Email referring doctor when patient status or notes are updated',         'notifications', true, 4),
  ('notify_doctor_new_message',      'New Message for Doctor',       'Email doctor when they receive a new in-app message',                    'notifications', true, 5),
  ('notify_patient_portal_invite',   'Portal Invite / Login',        'Email patient when they are invited to the portal',                      'notifications', true, 6),
  ('notify_patient_treatment_plan',  'Treatment Plan Update',        'Email patient when a treatment plan is assigned or updated',              'notifications', true, 7),
  ('notify_patient_schedule_update', 'Schedule Update',              'Email patient when an appointment is scheduled, changed, or cancelled',  'notifications', true, 8),
  ('notify_patient_info_request',    'Information Request',          'Email patient when the clinic requests more info or forms',               'notifications', true, 9),
  ('notify_patient_new_message',     'New Message for Patient',      'Email patient when they receive a new in-app message',                   'notifications', true, 10);
