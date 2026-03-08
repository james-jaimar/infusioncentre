

## Plan: Enhanced Doctor Administration & Referral Portal

### What Exists Today

The codebase already has:
- **Admin Staff page** (`AdminStaff.tsx`) that can create doctors via the `create-staff` Edge Function (creates auth user, profile, role, and `doctors` table entry)
- **Doctor portal** (`/doctor`) with: Dashboard, Referrals list, New Referral form, Reports, Patient View, and Treatment Course progress
- **Referrals table** with full triage workflow on the admin side
- **`doctors` table** with practice_name, practice_number, specialisation, email, phone, address fields

### What's Missing

Based on your request and industry best practices for medical referral management systems, here's what needs to be built:

---

### 1. Dedicated Doctor Admin Section (`/admin/doctors`)

A new admin page specifically for managing doctors (separate from the generic Staff page), with:

- **Doctor directory table** showing all doctors with practice details, specialisation, referral counts, and active/inactive status
- **Rich create/edit dialog** with all doctor-specific fields: practice name, HPCSA practice number, specialisation, full address (line 1, line 2, city, postal code), phone, email
- **Send invite button** -- reuses the existing SMTP Edge Function pattern to send a branded welcome email with login credentials or a magic link
- **Doctor detail view** showing their referral history, linked patients, and activity metrics

### 2. Doctor Invite System

A new Edge Function (`send-doctor-invite`) that:
- Generates a welcome email with temporary credentials or a password-reset link
- Uses the existing SMTP infrastructure (same pattern as `send-patient-invite`)
- Tracks invite status in `communication_log`

### 3. Enhanced Doctor Portal

Improvements to the existing `/doctor` portal based on medical referral management best practices:

**a) Richer Referral Form**
- Add medical aid details (scheme name, member number, main member)
- Add ICD-10 diagnosis code lookup
- File attachment support (letters, scripts, lab results)
- Treatment type selection from the clinic's configured `appointment_types`
- Referring doctor's notes structured into: clinical history, current medications, reason for referral
- Save as draft capability

**b) Referral Tracking Dashboard**
- Real-time status updates with timeline view (submitted → under review → accepted → scheduled → in treatment → completed)
- Push notification-style alerts when status changes
- Estimated wait times per referral

**c) Patient Portfolio**
- "My Patients" section showing all patients the doctor has referred
- Per-patient: treatment progress, session history, upcoming appointments
- Read-only access to clinical summaries and discharge notes

**d) Doctor Profile Management**
- Self-service profile editing (practice details, contact info)
- Notification preferences (email frequency, report delivery)

### 4. Database Changes

- Add `doctor_invites` table (or reuse communication_log pattern) to track invite status
- Add `referral_attachments` table for file uploads linked to referrals
- Add columns to `referrals`: `medical_aid_scheme`, `medical_aid_number`, `icd10_codes`, `clinical_history`, `current_medications`, `draft` status, `treatment_type_id`
- Add `notification_preferences` JSONB column to `doctors` table

### 5. Admin Sidebar Update

Add a "Doctors" nav item under the admin sidebar linking to `/admin/doctors`.

---

### Technical Approach

- **Doctor Admin page**: New `AdminDoctors.tsx` component with table + CRUD dialogs, querying the `doctors` table joined with `profiles` and `user_roles`
- **Invite flow**: New Edge Function following the `send-patient-invite` pattern, with branded HTML email template
- **Referral enhancements**: Extend the existing `DoctorNewReferral.tsx` with additional form sections and file upload via Supabase Storage
- **File attachments**: Create a `referral-attachments` storage bucket with RLS policies scoped to the referring doctor and admins
- **Draft referrals**: Add `draft` to the existing referral status enum

### Files to Create/Edit

| Action | File |
|--------|------|
| Create | `src/pages/admin/AdminDoctors.tsx` |
| Create | `supabase/functions/send-doctor-invite/index.ts` |
| Create | Migration for schema changes |
| Edit | `src/pages/doctor/DoctorNewReferral.tsx` (richer form) |
| Edit | `src/pages/doctor/DoctorDashboard.tsx` (enhanced tracking) |
| Edit | `src/components/layout/DoctorLayout.tsx` (add My Patients nav) |
| Edit | `src/components/layout/AdminLayout.tsx` (add Doctors nav item) |
| Edit | `src/App.tsx` (add /admin/doctors route) |
| Edit | `supabase/config.toml` (register new Edge Function) |

