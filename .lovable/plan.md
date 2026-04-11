

## Plan: Admin Form Editing + Amendment Tracking + Patient Notes

### Three features requested

1. **Allow Gail to edit submitted forms** with visual amendment indicators
2. **Track which fields were amended by admin** with red highlighting
3. **Add a patient notes area** for Gail to keep running notes

---

### 1. Editable Submitted Forms with Amendment Tracking

**Database migration** -- add an `admin_amendments` JSONB column to `form_submissions`:
```sql
ALTER TABLE form_submissions 
  ADD COLUMN admin_amendments jsonb DEFAULT '{}'::jsonb;
```
This stores `{ field_name: { value: "new value", amended_by: "uuid", amended_at: "timestamp", original_value: "old value" } }`.

**FullScreenFormDialog changes:**
- Add an "Edit" button in the header bar (visible only for admin, read-only mode)
- Clicking "Edit" switches the dialog to editable mode with a "Save Amendments" button
- When saving, compare current values to original submission data -- any changed fields get recorded in `admin_amendments`
- After save, call `useUpdateFormSubmission` to update both `data` and `admin_amendments`

**FormRenderer changes:**
- Accept an optional `amendments` prop (the `admin_amendments` object)
- Any field whose `field_name` appears in `amendments` gets a red left-border accent and a small "Amended by admin" indicator below it
- In read-only mode, show both the current value and a tooltip/note showing the original value

**PatientDetail completed-forms table:**
- Add a small red dot or "Amended" badge on rows where `admin_amendments` has entries

### 2. Patient Notes Area

**Database migration** -- create a `patient_notes` table:
```sql
CREATE TABLE patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage patient notes" ON patient_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Nurses can view patient notes" ON patient_notes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));
```

**New hook:** `usePatientNotes` -- CRUD for patient_notes table.

**PatientDetail -- new "Notes" tab** (or section in Profile tab):
- Chronological list of notes with timestamp and author
- "Add Note" textarea + button at the top
- Each note shows content, date, and who wrote it
- Notes are editable/deletable by the author

---

### Files touched

- **Migration**: new migration for `admin_amendments` column + `patient_notes` table
- **`src/hooks/useFormSubmissions.ts`**: add `admin_amendments` to types
- **New: `src/hooks/usePatientNotes.ts`**: CRUD hook
- **`src/components/forms/FormRenderer.tsx`**: accept `amendments` prop, render red indicators
- **`src/components/forms/FullScreenFormDialog.tsx`**: add Edit/Save Amendments mode
- **`src/pages/admin/PatientDetail.tsx`**: add Notes tab, add "Amended" badges on completed forms table, wire up edit flow

