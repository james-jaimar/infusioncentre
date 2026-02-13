
# Fix: Patient Form Save and Admin Patient Delete

## Issues Found

### 1. Patient Form Save Fails
When a patient submits a form, two database operations happen:
- **Insert** into `form_submissions` -- this works (patient has an INSERT policy)
- **Update** on `onboarding_checklists` to mark the item as completed -- **this fails** because there is no UPDATE policy for patients on the `onboarding_checklists` table

Patients can only **view** their checklists, not update them. The form submission itself might succeed, but the checklist status update is rejected by Row-Level Security, causing the whole operation to appear as a failure.

### 2. Admin Patient Delete Fails
The database error log confirms:
> `update or delete on table "patients" violates foreign key constraint "form_submissions_patient_id_fkey" on table "form_submissions"`

Several tables reference `patients` but lack `ON DELETE CASCADE`:
- `form_submissions` -- **NO CASCADE** (blocks delete)
- `onboarding_checklists` -- **NO CASCADE** (blocks delete)
- `treatments` -- **NO CASCADE** (blocks delete)
- `referrals` -- **NO CASCADE** (blocks delete)

Other tables like `patient_documents`, `patient_medical_history`, `appointments`, and `patient_invites` already have `ON DELETE CASCADE` and are fine.

---

## Fix Plan

### Step 1: Database Migration
Add the missing RLS policy and fix the foreign key constraints:

**RLS fix:**
- Add an UPDATE policy on `onboarding_checklists` allowing patients to update their own checklist items (status, form_submission_id, completed_at) when the item belongs to them

**Foreign key fixes** -- alter all four constraints to add `ON DELETE CASCADE`:
- `form_submissions_patient_id_fkey`
- `onboarding_checklists_patient_id_fkey`
- `treatments_patient_id_fkey`
- `referrals_patient_id_fkey`

This ensures that when an admin deletes a patient, all related records are automatically cleaned up.

### Step 2: No Code Changes Required
The existing frontend code in `PatientDashboard.tsx` and `PatientDetail.tsx` already handles these operations correctly. Once the database constraints and policies are fixed, both features will work as expected.

---

## Technical Details

```text
Migration SQL (single migration):

1. DROP + RE-ADD foreign keys with ON DELETE CASCADE
   for form_submissions, onboarding_checklists, treatments, referrals

2. CREATE POLICY "Patients can update own checklists"
   ON onboarding_checklists FOR UPDATE
   USING (EXISTS (
     SELECT 1 FROM patients
     WHERE patients.id = onboarding_checklists.patient_id
       AND patients.user_id = auth.uid()
   ))
```

Both fixes are database-only changes -- no application code needs to be modified.
