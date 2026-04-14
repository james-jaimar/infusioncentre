

## Plan: Admin Doctor Detail Page

Currently, doctors in admin are a flat table with inline dialogs. There's no click-through detail page like patients have (`/admin/patients/:id`). We'll create `/admin/doctors/:id` — a tabbed detail view mirroring PatientDetail's pattern.

### What it includes

**Tabs:**
1. **Overview** — Doctor info (name, practice, HPCSA, specialisation, contact, address), edit-in-place, active/inactive toggle
2. **Referrals** — Table of all referrals from this doctor, with status badges, click to open triage dialog
3. **Patients** — List of patients linked via referrals from this doctor (distinct patients from `referrals.patient_id`), clickable to navigate to `/admin/patients/:id`
4. **Reports** — Doctor reports filtered to this doctor (from `doctor_reports` table)
5. **Messages** — Chat thread with this doctor (reuse `ChatThread`/`ChatInput` components, `conversation_type: 'admin_doctor'`)
6. **Account** — Re-invite, reset password, delete doctor (move existing dialog logic here)

### Changes

**New files:**
- `src/pages/admin/DoctorDetail.tsx` — tabbed detail page with all 6 tabs
- `src/components/admin/DoctorChatThread.tsx` — like `PatientChatThread` but for `admin_doctor` conversation type

**Modified files:**
- `src/App.tsx` — add route `admin/doctors/:id` → `DoctorDetail`
- `src/pages/admin/AdminDoctors.tsx` — make doctor name/row clickable (navigate to `/admin/doctors/:id`), keep create dialog on this page

### Data queries
- Doctor info: `doctors` table + `profiles` for name
- Referrals: `referrals` table filtered by `doctor_id`
- Linked patients: distinct `patient_id` from referrals, join to `patients` table
- Reports: `doctor_reports` filtered by `doctor_id`
- Messages: existing `useMessages` hook with `doctorId` + `conversationType: 'admin_doctor'`

No database changes needed — all tables and RLS policies already exist.

