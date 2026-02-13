
-- Create treatments for appointments that are in_progress or checked_in
-- Johan (Chair 2, in_progress Ketamine) - treatment in_progress
INSERT INTO treatments (id, appointment_id, patient_id, nurse_id, treatment_type_id, status, started_at)
VALUES ('c3000001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000002', '7d9e8136-c061-4613-953e-7b3d84aaa021', 'bf594551-d4f0-4a13-93ff-1de125380511', 'in_progress', now() - interval '55 minutes');

-- Fatima (Chair 3, in_progress Biologics) - treatment in_progress
INSERT INTO treatments (id, appointment_id, patient_id, nurse_id, treatment_type_id, status, started_at)
VALUES ('c3000001-0000-0000-0000-000000000002', 'b2000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003', '7d9e8136-c061-4613-953e-7b3d84aaa021', '4c099ed2-6cca-4a06-a49d-2fdd1025fa6a', 'in_progress', now() - interval '40 minutes');

-- Thandi (Chair 1, checked_in Iron) - treatment pre_assessment
INSERT INTO treatments (id, appointment_id, patient_id, nurse_id, treatment_type_id, status, started_at)
VALUES ('c3000001-0000-0000-0000-000000000003', 'b2000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001', '7d9e8136-c061-4613-953e-7b3d84aaa021', '37b819cf-c3ee-4083-86b7-4c3e78049796', 'pre_assessment', now() - interval '10 minutes');

-- Sipho (unassigned, checked_in IV Vitamin) - treatment pre_assessment
INSERT INTO treatments (id, appointment_id, patient_id, nurse_id, treatment_type_id, status, started_at)
VALUES ('c3000001-0000-0000-0000-000000000004', 'b2000001-0000-0000-0000-000000000004', 'a1000001-0000-0000-0000-000000000004', '7d9e8136-c061-4613-953e-7b3d84aaa021', '7248fe1f-837c-48fd-9286-d418b431fd50', 'pre_assessment', now() - interval '5 minutes');

-- Add vitals for Johan (last vitals 20 min ago - overdue)
INSERT INTO treatment_vitals (treatment_id, phase, recorded_at, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, o2_saturation, temperature)
VALUES ('c3000001-0000-0000-0000-000000000001', 'during', now() - interval '20 minutes', 78, 125, 82, 98, 36.6);

-- Add vitals for Fatima (last vitals 8 min ago - approaching)
INSERT INTO treatment_vitals (treatment_id, phase, recorded_at, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, o2_saturation, temperature)
VALUES ('c3000001-0000-0000-0000-000000000002', 'during', now() - interval '8 minutes', 72, 118, 76, 99, 36.4);

-- Add pre-vitals for Thandi (just taken)
INSERT INTO treatment_vitals (treatment_id, phase, recorded_at, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, o2_saturation, temperature)
VALUES ('c3000001-0000-0000-0000-000000000003', 'pre', now() - interval '8 minutes', 82, 130, 85, 97, 36.8);
