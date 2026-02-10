

# Complete Clinical Workflow System - Phased Plan

## Overview

This plan transforms the current application from a basic appointment/treatment tracker into a full end-to-end clinical management system covering: doctor referrals, patient onboarding with dynamic forms, treatment "job cards," nurse workflow, billing foundations, and post-treatment reporting.

Given the scope, this is split into manageable phases that build on each other.

---

## Phase 1: Doctor Role and Referral System

### What it does
Doctors get their own login and portal where they can submit referrals and view treatment summaries for their patients.

### Database changes
- Add `'doctor'` to the `app_role` enum
- Create `doctors` table: id, user_id, practice_name, practice_number (HPCSA), phone, email, specialisation, address fields, is_active, created_at
- Create `referrals` table: id, doctor_id, patient_id (nullable - patient may not exist yet), patient_first_name, patient_last_name, patient_email, patient_phone, diagnosis, treatment_requested, prescription_notes, urgency (routine/urgent), referral_document_path, status (pending/accepted/scheduled/completed), created_at, reviewed_by, reviewed_at
- RLS: Doctors see only their own referrals and their referred patients' treatment summaries; admins see all

### Frontend changes
- New `DoctorLayout` component (similar to NurseLayout)
- Doctor dashboard: list of their referrals with status tracking
- "New Referral" form: patient details, diagnosis, treatment requested, file upload for prescription/referral letter
- Read-only treatment summary view for their patients (vitals, medications given, discharge notes)
- Update `ProtectedRoute` and `Login.tsx` to handle the `doctor` role
- Add doctor routes in `App.tsx`

### Admin side
- Admin can manage doctors in `AdminStaff.tsx` (or a new "Doctors" section)
- Admin can review/accept referrals and convert them into patient records + appointments
- Update `create-staff` edge function to support the `doctor` role

---

## Phase 2: Dynamic Onboarding Form System

### What it does
A configurable form template system so the admin can define which forms each patient must complete during onboarding. Forms can be filled by the patient (on tablet or at home via their portal) or by admin staff.

### Database changes
- Create `form_templates` table: id, name, description, category (consent/medical/administrative), form_schema (JSONB - defines fields, types, validation rules), is_active, display_order, required_for_treatment_types (uuid array, nullable - if null, required for all), version, created_at
- Create `form_submissions` table: id, form_template_id, patient_id, submitted_by (user_id), data (JSONB - the actual answers), status (draft/submitted/reviewed/approved), reviewed_by, reviewed_at, signature_data (text, base64 of signature if needed), created_at
- Create `onboarding_checklists` table: id, patient_id, form_template_id, status (pending/completed), completed_at, due_date

### How it works
- Admin creates form templates via a form builder (fields: text, number, date, select, checkbox, textarea, signature, file upload)
- When a patient is created, the system auto-generates their onboarding checklist based on treatment type
- Patient can fill forms in their portal (at home) or on a tablet in-practice
- Admin/nurse can also fill forms on behalf of the patient
- Onboarding progress is visible as a checklist with completion percentage

### Frontend changes
- New admin page: "Form Templates" - CRUD for form templates with a visual field builder
- Update `PatientDetail.tsx`: add "Onboarding" tab showing checklist progress
- Patient portal: "My Forms" section where they fill in outstanding forms
- Form renderer component that reads JSONB schema and renders appropriate inputs
- Signature capture component (canvas-based)

---

## Phase 3: Patient Invite / Magic Link System

### What it does
When admin creates a patient, they can send a login link to the patient's email so they can access their portal and fill in onboarding forms from home.

### How it works
- Admin clicks "Send Portal Invite" on a patient record
- Edge function creates an auth user (if not already linked), assigns patient role, and sends a magic link or password-reset email
- Patient clicks link, sets password (or is auto-logged in), and lands on their portal with outstanding forms
- Links the `patients.user_id` to the new auth user

### Changes
- New edge function: `invite-patient` (creates auth user, links to patient record, sends invite email)
- Button on `PatientDetail.tsx`: "Send Portal Invite"
- Update patient portal to show onboarding forms prominently if incomplete

---

## Phase 4: Treatment Job Card System

### What it does
A "treatment ticket" (job card) that bundles everything needed for a specific treatment visit: treatment type, required forms/consents, medications to administer (from prescription), nurse assignment, bay/chair assignment, time slot, and status tracking.

### Database changes
- Create `treatment_tickets` table: id, appointment_id, patient_id, referral_id (nullable), treatment_type_id, prescribed_medications (JSONB array), required_form_ids (uuid array referencing form_templates), nurse_id (nullable until assigned), chair_id (nullable until assigned), scheduled_date, scheduled_time, estimated_duration_minutes, status (created/forms_pending/ready/in_progress/completed/cancelled), priority (normal/urgent), notes, created_by, created_at, updated_at
- Create `treatment_ticket_forms` table: id, ticket_id, form_template_id, form_submission_id (nullable - linked when completed), required (boolean), status (pending/completed/waived)

### How it works
- When an appointment is created (or a referral is accepted), a treatment ticket is auto-generated
- The ticket lists all required forms for that treatment type
- Admin can add/remove required forms, assign nurse/chair, set time
- Ticket status progresses: created -> forms_pending -> ready (all forms done) -> in_progress -> completed
- Nurse sees their assigned tickets on their dashboard with clear readiness indicators

### Frontend changes
- New "Job Cards" view for admin: kanban-style or list view of all tickets by status
- Ticket detail page showing: patient info, required forms (with completion status), prescribed meds, nurse/chair assignment, timeline
- Nurse dashboard updated to show assigned tickets with readiness status (green = all forms done, amber = forms pending)
- Link ticket to existing treatment workflow (check-in, active treatment, discharge)

---

## Phase 5: Billing Data Model (Foundation Only)

### What it does
Creates the database tables for invoicing and billing so data is captured from day one, even though the payment UI comes later.

### Database changes
- Create `invoices` table: id, patient_id, treatment_ticket_id, appointment_id, invoice_number (auto-generated), status (draft/sent/paid/overdue/cancelled), subtotal, tax_amount, total, medical_aid_claim_amount, patient_liability, due_date, paid_at, notes, created_by, created_at
- Create `invoice_line_items` table: id, invoice_id, description, quantity, unit_price, total, icd10_code (nullable), tariff_code (nullable), notes
- Create `payment_records` table: id, invoice_id, amount, payment_method (cash/card/eft/medical_aid), reference_number, paid_at, recorded_by, notes

### No UI yet - just tables with RLS policies (admin full access, patients can view own invoices)

---

## Phase 6: Post-Treatment Reporting

### What it does
After treatment completion, automatically generates reports for the referring doctor and the patient.

### Changes
- Doctor portal: treatment summary appears automatically after discharge (vitals, meds administered, nurse notes, discharge notes)
- Patient portal: treatment history with downloadable summary
- Admin: "Generate Report" button on completed treatments that creates a formatted summary
- Future: PDF generation edge function (can be added later)

---

## Implementation Priority

Given the dependencies between phases, the recommended build order is:

1. **Phase 1** - Doctor role (needed for referral flow)
2. **Phase 2** - Form system (needed for onboarding and job cards)
3. **Phase 3** - Patient invite (uses form system)
4. **Phase 4** - Job cards (uses forms + referrals)
5. **Phase 5** - Billing tables (independent, quick)
6. **Phase 6** - Post-treatment reporting (uses all above)

Each phase is self-contained and delivers working functionality. We would tackle them one at a time.

---

## What you're NOT missing (things already built)

- Patient CRUD with multi-step intake wizard
- Appointment scheduling with calendar and chair lanes
- Nurse clinical workflow (check-in, treatment, vitals, meds, ketamine monitoring, discharge)
- Patient portal (basic - will be enhanced)
- Staff management with edge function
- Document upload/storage
- Session timeout and auth

## What you MIGHT be missing

- **Inventory/stock management**: tracking medication stock levels, expiry dates, reorder alerts
- **Reporting/analytics**: treatment volumes, nurse utilisation, revenue reports
- **Audit trail**: already have `audit_log` table but it's not actively populated from all actions
- **Notifications**: SMS/email reminders for appointments (you started the communication_log work)
- **Waiting room display**: a screen showing queue status for patients in the waiting area

---

## Technical Notes

- The `app_role` enum needs extending to include `'doctor'`
- The `handle_new_user()` trigger currently auto-assigns `'patient'` role to all new signups - this is fine since doctors/nurses are created via the admin edge function
- All new tables will use RESTRICTIVE RLS policies with the existing `has_role()` function
- The form schema in `form_templates.form_schema` uses a JSON structure like: `[{field_name, field_type, label, required, options, validation}]`
- The treatment ticket system sits ABOVE the existing `treatments` table - a ticket references an appointment and gets linked to a treatment when the nurse starts it
- No changes to existing nurse workflow needed initially - the job card wraps around it

