

# Phase 3: Patient Invite System

## Context

Phase 2 (Dynamic Onboarding Forms) is complete -- the form engine, templates, renderer, and onboarding checklist are all live. The next step is letting Gayle's team send patients a link so they can complete their onboarding forms **before arriving** at the clinic, saving significant chair time.

## Business Model Reference

From the uploaded business model, JIC's treatment breakdown is:
- **Ketamine** (~70% of infusions, ~90% of total work is infusion-based)
- **Iron** (Venofer, Ferinject, Cosmofer, Monofer)
- **Biologicals** (Tysabri, Revellex/Remsima, Actemra, Ocrevus)
- **Polygam** (IVN)
- **Zoledronic Acid** (Osteoporosis)
- **Wound Care / Stoma Therapy** (~10% combined)

Current appointment_types cover Iron, Ketamine, IV Vitamin, Biologics, and Blood Transfusion. Missing types (Polygam/IVN, Zoledronic Acid, Wound Care, Stoma Therapy) can be added in a future housekeeping step or via the admin settings.

---

## What This Phase Builds

A system where admin/staff can invite a patient by email or SMS. The patient receives a secure link, creates an account (or logs straight in), and lands on a guided onboarding experience where they complete all their required forms digitally before their first appointment.

### Core Flow

```text
Admin creates patient record
        |
        v
Admin clicks "Send Invite"
        |
        v
System generates a secure invite token
        |
        v
Patient receives email/SMS with magic link
        |
        v
Patient clicks link --> arrives at /invite/:token
        |
        v
If no account: guided signup (password set, profile confirmed)
If has account: auto-login redirect
        |
        v
Patient lands on their dashboard with outstanding forms
        |
        v
Patient completes forms using the full-screen form renderer
        |
        v
Admin sees completion status in the Onboarding tab
```

---

## Database Changes

### New Table: patient_invites

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| patient_id | uuid, FK | Links to patients table |
| token | text, unique | Secure random token for the invite URL |
| email | text | Where the invite is sent |
| phone | text, nullable | Optional SMS target |
| status | enum | pending, accepted, expired, revoked |
| invited_by | uuid, FK | Staff user who sent it |
| expires_at | timestamptz | Default 7 days from creation |
| accepted_at | timestamptz, nullable | When patient used the link |
| created_at | timestamptz | |

### New Enum: invite_status
Values: pending, accepted, expired, revoked

### RLS Policies
- Admins/Nurses: full CRUD on patient_invites
- Patients: can read their own invite (matched via email or patient_id)

---

## Edge Function: send-patient-invite

A new Supabase Edge Function that:
1. Validates the caller is admin/nurse
2. Generates a cryptographically secure token
3. Creates the patient_invites record
4. Sends the invite email using Supabase Auth's built-in email (or a simple HTML email via Resend/SMTP if configured)
5. Optionally auto-generates the onboarding checklist for the patient if not already generated

The invite URL format: `{APP_URL}/invite/{token}`

---

## Frontend Changes

### 1. Invite Button on PatientDetail

Add a "Send Invite" button to the patient detail header area. Clicking it opens a small dialog:
- Pre-filled with patient's email/phone from their record
- Treatment type selector (to auto-generate the correct onboarding checklist)
- "Send Email Invite" and optionally "Copy Link" buttons
- Shows invite history (sent date, status, resend option)

### 2. Invite Landing Page: /invite/:token

New page that handles the invite flow:
- Validates the token (checks expiry, status)
- If expired/invalid: shows a friendly error with contact details
- If valid and patient has no auth account:
  - Shows a welcome screen with the clinic branding
  - Simple registration form: confirm name, set password
  - On submit: creates auth user, links to patient record (sets user_id), marks invite as accepted
- If valid and patient already has an account:
  - Auto-redirects to login with a prompt, then to their dashboard
- After successful signup/login: redirects to /patient with the outstanding forms prominently displayed

### 3. Patient Dashboard Enhancement

The existing PatientDashboard already shows outstanding forms. Enhancement:
- Add a welcome banner for newly invited patients ("Welcome to JIC! Please complete the forms below before your first appointment")
- Make forms clickable to open the full-screen form renderer
- Show a completion celebration when all forms are done

### 4. Admin Invite History

On the PatientDetail page, add an invite status section showing:
- Last invite sent date
- Current status (pending/accepted/expired)
- Resend or revoke buttons

---

## New Files

| File | Purpose |
|---|---|
| supabase/migrations/XXXX_patient_invites.sql | Table, enum, RLS |
| supabase/functions/send-patient-invite/index.ts | Token generation, invite record, email dispatch |
| src/pages/InviteLanding.tsx | /invite/:token page with signup/redirect logic |
| src/components/admin/SendInviteDialog.tsx | Dialog for sending invites from PatientDetail |
| src/hooks/usePatientInvites.ts | CRUD hooks for patient_invites |

## Modified Files

| File | Change |
|---|---|
| src/App.tsx | Add /invite/:token route (public) |
| src/pages/admin/PatientDetail.tsx | Add "Send Invite" button and invite status display |
| src/pages/patient/PatientDashboard.tsx | Welcome banner for new patients, clickable form cards |

---

## Implementation Order

1. Database migration (patient_invites table, enum, RLS)
2. Edge function (send-patient-invite with token generation and email)
3. Send Invite dialog on PatientDetail
4. Invite landing page (/invite/:token with signup flow)
5. Patient dashboard enhancements (welcome banner, clickable forms)

---

## Technical Notes

- Tokens will be generated using `crypto.randomUUID()` in the edge function for security
- The edge function will use the service role to create auth users (same pattern as create-staff)
- Email content will include the clinic name, patient name, and a clear CTA button
- Invite expiry defaults to 7 days but admin can resend to generate a fresh token
- When a patient accepts an invite, the patients.user_id column gets linked to their new auth user ID

