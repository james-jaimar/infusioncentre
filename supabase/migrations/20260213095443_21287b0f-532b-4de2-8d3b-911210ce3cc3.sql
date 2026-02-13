
-- 1. Fix foreign keys to add ON DELETE CASCADE

ALTER TABLE form_submissions
  DROP CONSTRAINT form_submissions_patient_id_fkey,
  ADD CONSTRAINT form_submissions_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE onboarding_checklists
  DROP CONSTRAINT onboarding_checklists_patient_id_fkey,
  ADD CONSTRAINT onboarding_checklists_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE treatments
  DROP CONSTRAINT treatments_patient_id_fkey,
  ADD CONSTRAINT treatments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

ALTER TABLE referrals
  DROP CONSTRAINT referrals_patient_id_fkey,
  ADD CONSTRAINT referrals_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;

-- 2. Add missing RLS policy for patients to update their own checklists

CREATE POLICY "Patients can update own checklists"
  ON onboarding_checklists
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = onboarding_checklists.patient_id
        AND patients.user_id = auth.uid()
    )
  );
