
# Johannesburg Infusion Centre - Implementation Progress

## ✅ Completed Phases

### Phase 1: Public Website - COMPLETE
- Homepage, Services, Training pages, Contact, Doctors page
- Contact form with database storage

### Phase 2: Authentication - COMPLETE
- Login/Register/Password reset pages
- Role-based routing (admin → /admin, nurse → /nurse, patient → /patient)
- Session timeout (30 min) with warning modal
- Protected routes with role verification

### Phase 3: Patient Management - COMPLETE
- Database: `patients`, `patient_medical_history`, `patient_documents` tables with RLS
- Storage: `patient-documents` bucket with RLS
- UI: Patient directory with search/filter/pagination
- UI: Multi-step patient intake form (Personal → Emergency → Medical Aid → Medical History)
- UI: Patient detail view with tabs (Profile, Medical History, Documents)
- UI: Document upload/download/delete functionality

---
|-----------|--------|-------|
| Public Website | Complete | Homepage, Services, Training pages, Contact, Doctors page |
| Contact Form | Complete | Saves to `contact_submissions` table with RLS |
| Design System | Complete | Exo/Poppins fonts, slate blue (#3E5B84), square corners |
| Authentication Foundation | Complete | Login, Register, ForgotPassword, ResetPassword pages exist |
| Database Schema | Partial | `profiles`, `user_roles`, `contact_submissions`, `audit_log` tables with RLS |
| Auth Context | Complete | AuthContext with signIn, signUp, signOut, role detection |
| Protected Routes | Complete | ProtectedRoute component with role-based access |
| Admin Layout | Complete | Sidebar navigation, mobile responsive |
| Admin Dashboard Shell | Complete | Stats cards (placeholder values), quick actions |
| Nurse Layout & Dashboard | Complete | Sidebar, emergency protocol button, today's overview |
| Patient Layout & Dashboard | Complete | Sidebar, welcome message, quick actions |
| Session Timeout | Complete | 30-minute inactivity timeout with 2-minute warning |
| Role-Based Routing | Complete | Login redirects to /admin, /nurse, or /patient based on role |

**Minor Items to Address:**
- Doctors page has placeholder image (IV drip bag emoji)
- Password reset email edge function still needed (requires Resend API key)

---

## Implementation Phases

### Phase 2: Authentication Refinements (Current Session)

**What Needs Work:**

1. **Password Reset Email Flow**
   - Currently pages exist but need edge function for email sending
   - Will require Resend API integration

2. **Initial Admin Account Setup**
   - Need to create first admin user in Supabase
   - Document the process for Gayle

3. **Session Timeout Configuration**
   - Add auto-logout after inactivity (30 min for clinical compliance)

4. **Post-Login Routing**
   - Currently all users go to `/admin` - need role-based routing:
     - Admin -> `/admin`
     - Nurse -> `/nurse`
     - Patient -> `/patient`

**Database Status:** Already complete with `profiles`, `user_roles`, triggers, and RLS policies.

---

### Phase 3: Patient Management

**New Database Tables:**

```text
patients
---------
id (uuid, PK)
user_id (uuid, FK -> auth.users, nullable for non-registered patients)
first_name (text, required)
last_name (text, required)
id_number (text, SA ID number)
date_of_birth (date)
gender (enum: male, female, other)
phone (text)
email (text)
address_line_1 (text)
address_line_2 (text)
city (text)
postal_code (text)
emergency_contact_name (text)
emergency_contact_phone (text)
emergency_contact_relationship (text)
medical_aid_name (text)
medical_aid_number (text)
medical_aid_plan (text)
medical_aid_main_member (text)
referring_doctor_name (text)
referring_doctor_practice (text)
referring_doctor_phone (text)
status (enum: active, inactive, archived)
notes (text)
created_at, updated_at

patient_medical_history
-----------------------
id (uuid, PK)
patient_id (uuid, FK -> patients)
allergies (text[])
chronic_conditions (text[])
current_medications (jsonb - name, dosage, frequency)
previous_surgeries (text)
notes (text)
updated_at
updated_by (uuid)

patient_documents
-----------------
id (uuid, PK)
patient_id (uuid, FK -> patients)
document_type (enum: prescription, referral, consent, id_copy, medical_aid_card, other)
file_name (text)
file_path (text)
uploaded_by (uuid)
uploaded_at
notes (text)
```

**Storage Bucket:**
- `patient-documents` (private, RLS protected)

**UI Components to Build:**

1. **Patient Directory** (`/admin/patients`)
   - Search by name, ID number, phone
   - Filter by status (active/inactive)
   - Sortable columns
   - Pagination

2. **Patient Detail View** (`/admin/patients/:id`)
   - Tabbed layout: Profile | Medical History | Documents | Appointments | Treatments
   - Edit capability for admins

3. **New Patient Intake Form**
   - Multi-step wizard
   - Personal details -> Emergency contact -> Medical aid -> Medical history
   - Document upload section

4. **Document Management**
   - Upload with type selection
   - Preview capability
   - Download/delete with audit trail

---

### Phase 4: Appointment Scheduling

**New Database Tables:**

```text
treatment_chairs
----------------
id (uuid, PK)
name (text, e.g., "Chair 1", "Chair 2")
is_active (boolean, default true)
notes (text)
display_order (int)

appointment_types
-----------------
id (uuid, PK)
name (text, e.g., "Iron Infusion", "Ketamine Therapy")
default_duration_minutes (int, e.g., 120, 240)
color (text, hex code for calendar display)
requires_consent (boolean)
preparation_instructions (text)
is_active (boolean)
display_order (int)

appointments
------------
id (uuid, PK)
patient_id (uuid, FK -> patients)
appointment_type_id (uuid, FK -> appointment_types)
chair_id (uuid, FK -> treatment_chairs, nullable)
assigned_nurse_id (uuid, FK -> profiles)
scheduled_start (timestamptz)
scheduled_end (timestamptz)
status (enum: scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show)
cancellation_reason (text)
notes (text)
created_by (uuid)
created_at, updated_at

appointment_reminders
---------------------
id (uuid, PK)
appointment_id (uuid, FK -> appointments)
reminder_type (enum: email, whatsapp, sms)
scheduled_for (timestamptz)
sent_at (timestamptz)
status (enum: pending, sent, failed)
error_message (text)
```

**UI Components to Build:**

1. **Calendar View** (`/admin/appointments`)
   - Day/Week/Month views
   - Drag-and-drop appointment moving
   - Colour-coded by appointment type
   - Chair lane view for day view

2. **Appointment Creation Wizard**
   - Patient search/selection
   - Type selection with duration auto-fill
   - Date/time picker with availability check
   - Chair assignment
   - Nurse assignment (optional)
   - Conflict detection

3. **Today's Schedule Widget**
   - Quick view on dashboard
   - Status indicators
   - One-click check-in

4. **Treatment Chair Configuration** (`/admin/settings/chairs`)
   - Add/edit/deactivate chairs
   - Reorder display

---

### Phase 5: Clinical Treatment Workflow

**New Database Tables:**

```text
treatments
----------
id (uuid, PK)
appointment_id (uuid, FK -> appointments)
patient_id (uuid, FK -> patients)
nurse_id (uuid, FK -> profiles)
treatment_type_id (uuid, FK -> appointment_types)
status (enum: pending, pre_assessment, in_progress, post_assessment, completed, cancelled)
started_at (timestamptz)
ended_at (timestamptz)
notes (text)
created_at

treatment_vitals
----------------
id (uuid, PK)
treatment_id (uuid, FK -> treatments)
recorded_at (timestamptz)
phase (enum: pre, during, post)
blood_pressure_systolic (int)
blood_pressure_diastolic (int)
heart_rate (int)
o2_saturation (int)
temperature (decimal)
weight_kg (decimal, nullable)
notes (text)
recorded_by (uuid)

treatment_medications
---------------------
id (uuid, PK)
treatment_id (uuid, FK -> treatments)
medication_name (text)
dosage (text)
route (enum: iv, oral, im, sc)
administered_at (timestamptz)
administered_by (uuid)
lot_number (text)
notes (text)

treatment_assessments
---------------------
id (uuid, PK)
treatment_id (uuid, FK -> treatments)
assessment_type (enum: pre_treatment, during_treatment, post_treatment, ketamine_monitoring)
phase (text)
data (jsonb - flexible structure for checklists)
recorded_at (timestamptz)
recorded_by (uuid)

ketamine_monitoring
-------------------
id (uuid, PK)
treatment_id (uuid, FK -> treatments)
minutes_from_start (int)
alertness_score (int, 1-5)
mood_score (int, 1-10)
pain_score (int, 0-10)
dissociation_level (int, 0-4)
anxiety_score (int, 0-10)
nausea_present (boolean)
notes (text)
recorded_at (timestamptz)
recorded_by (uuid)
```

**Nurse Portal UI Components:**

1. **Check-In Screen** (`/nurse/checkin/:appointmentId`)
   - Patient verification (photo, name, DOB)
   - Confirm consent forms completed
   - Pre-treatment checklist
   - Initial vitals capture

2. **Active Treatment Dashboard** (`/nurse/treatment/:treatmentId`)
   - Large treatment timer (elapsed time)
   - Current vitals display
   - Quick vitals entry button (opens modal)
   - Medication administration log
   - Phase indicators

3. **Vitals Entry Modal**
   - Large touch-friendly inputs (44x44px minimum)
   - BP systolic/diastolic, HR, O2, Temp
   - Auto-timestamp
   - Quick notes field

4. **Ketamine Protocol Screen**
   - Monitoring intervals (every 15 min)
   - Alertness scale (1-5)
   - Mood rating (1-10)
   - Pain scale (0-10)
   - Dissociation level
   - Adverse reaction flags

5. **Discharge Workflow** (`/nurse/discharge/:treatmentId`)
   - Post-treatment assessment
   - Final vitals
   - Discharge criteria checklist
   - Patient instructions printed/emailed
   - Follow-up appointment prompt
   - Treatment summary generation

---

### Phase 6: Nurse Dashboard

**UI Components:**

1. **Nurse Home** (`/nurse`)
   - Today's patient queue with status badges
   - Quick action buttons
   - Current treatment timer (if active)
   - Upcoming appointments

2. **Patient Queue**
   - Status: Waiting | In Progress | Completed
   - Click to open treatment screen
   - Time since arrival indicator

3. **Emergency Protocol Button**
   - Always visible
   - Opens anaphylaxis protocol reference
   - One-click emergency contact

---

### Phase 7: Admin Dashboard Enhancements

**Contact Submissions Management:**
- Add columns to `contact_submissions`:
  - `is_read` (boolean)
  - `read_at` (timestamptz)
  - `assigned_to` (uuid, nullable)
  - `status` (enum: new, in_progress, resolved, archived)
  - `response_notes` (text)

**UI Components:**

1. **Contact Submissions** (`/admin/contacts`)
   - Inbox-style list
   - Unread count badge
   - Mark as read/resolved
   - Assign to staff member
   - Reply notes

2. **Staff Management** (`/admin/staff`)
   - List all nurses/admins
   - Add new staff (creates account with role)
   - Edit profile
   - Deactivate account

3. **Reports** (`/admin/reports`)
   - Treatment counts by type (daily/weekly/monthly)
   - Patient flow metrics
   - Nurse workload distribution
   - Export to CSV

4. **Settings** (`/admin/settings`)
   - Treatment types configuration
   - Chair management
   - Business hours
   - Reminder settings

---

### Phase 8: Training Course Bookings

**New Database Tables:**

```text
training_courses
----------------
id (uuid, PK)
name (text)
description (text)
price (decimal)
duration_hours (int)
max_participants (int)
includes (text[])
is_active (boolean)

course_bookings
---------------
id (uuid, PK)
course_id (uuid, FK -> training_courses)
participant_name (text)
email (text)
phone (text)
organisation (text)
preferred_dates (text)
status (enum: pending, confirmed, completed, cancelled)
notes (text)
created_at
updated_at
```

**UI Components:**

1. **Public Booking Form** (on IV Training and Anaphylaxis pages)
   - Course selection
   - Participant details
   - Preferred dates
   - Confirmation email

2. **Admin Booking Management** (`/admin/training`)
   - List all bookings
   - Status management
   - Course scheduling

---

### Phase 9: Payment Processing

**Integration:**
- Stripe for online payments
- Invoice generation for treatment payments
- Training course checkout

---

### Phase 10: Communication Hub

**Integrations:**
- Resend for email (already needed for password reset)
- WhatsApp Business API for appointment reminders

---

## Recommended Implementation Order

```text
Session 1: Phase 2 Completion
-----------------------------
- Password reset email edge function
- Post-login role-based routing
- Session timeout
- Create initial admin account

Session 2-3: Phase 3 - Patient Management
-----------------------------------------
- Database migration for patient tables
- Storage bucket setup
- Patient directory with search
- New patient intake form
- Patient detail view with tabs
- Document upload/management

Session 4-5: Phase 4 - Scheduling
---------------------------------
- Database migration for scheduling tables
- Treatment types and chairs configuration
- Calendar component (day/week views)
- Appointment creation wizard
- Conflict detection

Session 6-8: Phase 5 - Clinical Workflow
----------------------------------------
- Treatment database tables
- Nurse check-in screen
- Active treatment dashboard
- Vitals entry (tablet-optimised)
- Ketamine monitoring protocol
- Discharge workflow
- Treatment summary PDF

Session 9: Phase 6 - Nurse Dashboard
------------------------------------
- Today's patient queue
- Quick actions
- Timer displays
- Emergency protocol access

Session 10-11: Phase 7 - Admin Enhancements
-------------------------------------------
- Contact submission management
- Staff management
- Reports with charts
- Settings pages

Session 12: Phase 8 - Training Bookings
---------------------------------------
- Booking form on public pages
- Admin booking management

Session 13+: Phases 9-10
------------------------
- Stripe integration
- Communication hub
```

---

## Technical Details

### Security Architecture

All tables will use Row-Level Security:
- Patients: Admins/nurses can read all, patients can read own record
- Treatments: Admins/nurses can CRUD, patients can read own
- Documents: Private storage with RLS on metadata table

### Tablet Optimisation (Nurse Screens)

- Minimum touch targets: 44x44 pixels
- Large input fields for vitals (56px height)
- High contrast colours
- Reduced animations for performance
- Landscape-friendly layouts

### Audit Trail

All sensitive operations will log to `audit_log`:
- Patient record changes
- Treatment start/end
- Medication administration
- Document uploads/deletions

---

## Ready to Begin

Would you like me to start with **Phase 2: Authentication Refinements**? This includes:
1. Setting up the password reset email flow with Resend
2. Fixing post-login routing to redirect based on user role
3. Adding session timeout for security
4. Documenting how to create the initial admin account in Supabase
