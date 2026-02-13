
-- Create 6 demo patients
INSERT INTO patients (id, first_name, last_name, email, phone, id_number, date_of_birth, gender, medical_aid_name, medical_aid_number, status)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'Thandi', 'Nkosi', 'thandi.nkosi@demo.co.za', '0821234567', '9001015800081', '1990-01-01', 'female', 'Discovery Health', 'DH-100201', 'active'),
  ('a1000001-0000-0000-0000-000000000002', 'Johan', 'van der Merwe', 'johan.vdm@demo.co.za', '0839876543', '8506125800082', '1985-06-12', 'male', 'Momentum', 'MOM-443322', 'active'),
  ('a1000001-0000-0000-0000-000000000003', 'Fatima', 'Patel', 'fatima.patel@demo.co.za', '0715554321', '9203220800083', '1992-03-22', 'female', 'Bonitas', 'BON-889900', 'active'),
  ('a1000001-0000-0000-0000-000000000004', 'Sipho', 'Dlamini', 'sipho.dlamini@demo.co.za', '0609871234', '7811305800084', '1978-11-30', 'male', 'Medihelp', 'MH-556677', 'active'),
  ('a1000001-0000-0000-0000-000000000005', 'Lerato', 'Mokoena', 'lerato.mokoena@demo.co.za', '0844567890', '0004150800085', '2000-04-15', 'female', 'Discovery Health', 'DH-334455', 'active'),
  ('a1000001-0000-0000-0000-000000000006', 'David', 'September', 'david.september@demo.co.za', '0731112233', '6509085800086', '1965-09-08', 'male', 'GEMS', 'GEMS-112233', 'active');

-- Create 6 appointments for today across different statuses and chairs
-- Thandi: Chair 1, checked_in (Iron Infusion)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '37b819cf-c3ee-4083-86b7-4c3e78049796', 'c57773d7-8ae2-4ed3-9e7e-d39027085527', now() - interval '30 minutes', now() + interval '90 minutes', 'checked_in');

-- Johan: Chair 2, in_progress (Ketamine Therapy)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', 'bf594551-d4f0-4a13-93ff-1de125380511', 'b9772218-ea96-4e18-8cae-9c93c3547942', now() - interval '60 minutes', now() + interval '60 minutes', 'in_progress');

-- Fatima: Chair 3, in_progress (Biologics Infusion)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', '4c099ed2-6cca-4a06-a49d-2fdd1025fa6a', 'd25b84d7-18b5-4375-88cf-b4c6c678e4fe', now() - interval '45 minutes', now() + interval '75 minutes', 'in_progress');

-- Sipho: No chair (unassigned), checked_in (IV Vitamin Therapy)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000004', '7248fe1f-837c-48fd-9286-d418b431fd50', NULL, now() + interval '15 minutes', now() + interval '75 minutes', 'checked_in');

-- Lerato: Scheduled for later today (Iron Infusion)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000005', 'a1000001-0000-0000-0000-000000000005', '37b819cf-c3ee-4083-86b7-4c3e78049796', NULL, now() + interval '2 hours', now() + interval '4 hours', 'scheduled');

-- David: Completed earlier today (Blood Transfusion)
INSERT INTO appointments (id, patient_id, appointment_type_id, chair_id, scheduled_start, scheduled_end, status)
VALUES ('b2000001-0000-0000-0000-000000000006', 'a1000001-0000-0000-0000-000000000006', '389477e1-a6f2-48ae-abf4-fd4e5805374f', '24414231-dbc2-47af-8fae-05a94d5ddbfc', now() - interval '5 hours', now() - interval '2 hours', 'completed');
