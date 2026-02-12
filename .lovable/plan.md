

# Connect the End-to-End Clinical Workflow

## The Problem

All the individual pieces exist (patients, onboarding forms, appointments, job cards, treatments) but they operate as separate islands. An admin has to manually navigate between unrelated pages and mentally track what's been done. Nothing guides you from "new patient" to "patient in the chair."

## The Connected Flow (After Changes)

```text
CREATE PATIENT ──> GENERATE ONBOARDING ──> PATIENT COMPLETES FORMS
       |                                           |
       v                                           v
  BOOK APPOINTMENT <── readiness check ──── FORMS COMPLETE?
       |                                    (warns if not)
       v
  NURSE OPENS JOB CARD
       |
       v
  CHECKLIST AUTO-VERIFIED ──> START TREATMENT ──> DISCHARGE
  (consent on file = YES/NO)
```

## What Changes

### 1. Post-Patient-Creation Flow

After saving a new patient, instead of just landing on the patient detail page, show a "Next Steps" prompt:

- "Generate Onboarding Checklist" button (pre-selects treatment types if known)
- "Book First Appointment" button (links to appointment booking with patient pre-selected)
- "Done for Now" to just view the patient record

This turns the patient detail page from a dead-end into a launchpad.

### 2. "Book Appointment" Button on Patient Detail

Add a prominent "Book Appointment" button to the patient detail header (next to Edit / Delete / Send Invite). Clicking it navigates to `/admin/appointments/new?patient_id={id}`, and the appointment form auto-selects that patient.

### 3. Onboarding Readiness Check on Appointment Booking

When an appointment type is selected during booking, check whether the patient has completed the required onboarding forms for that treatment type:

- Green badge: "All onboarding forms complete" -- good to go
- Amber warning: "2 of 3 required forms incomplete" with a link to the patient's onboarding tab
- This is advisory (doesn't block booking) but makes the gap visible

### 4. Onboarding Status on Appointment Detail

On the appointment detail page, show a small "Onboarding Status" card:

- Lists required forms for this appointment type
- Shows completed/pending status for each
- Links to patient's onboarding tab if forms are missing

### 5. Smart Pre-Treatment Checklist on Nurse Job Card

Currently the Job Card has a manual checkbox: "Consent form signed and on file." Replace this with an auto-verified check:

- Query the patient's onboarding checklist for this appointment type
- Show each required form with a real status (completed with date, or missing)
- "Consent form signed and on file" becomes green/red automatically
- Nurse can still manually override if paper consent was obtained

### 6. Auto-Generate Checklist When Booking

When an appointment is booked, automatically generate onboarding checklist items for any forms required by that appointment type that the patient hasn't completed yet. This means the onboarding tab is always up-to-date.

---

## Technical Details

### Files to modify

| File | Changes |
|---|---|
| `src/pages/admin/PatientNew.tsx` | After successful creation, navigate to patient detail with `?showNextSteps=true` query param |
| `src/pages/admin/PatientDetail.tsx` | Show "Next Steps" card when `showNextSteps` param is present; add "Book Appointment" button to header |
| `src/pages/admin/AppointmentNew.tsx` | Accept `patient_id` query param to pre-select patient; add onboarding readiness check when type is selected |
| `src/pages/admin/AppointmentDetail.tsx` | Add onboarding status card showing form completion for the appointment type |
| `src/pages/nurse/NurseJobCard.tsx` | Replace manual consent checkbox with auto-verified onboarding status; keep manual override option |
| `src/hooks/useAppointments.ts` | Update `useCreateAppointment` to trigger onboarding checklist generation after booking |
| `src/hooks/useOnboardingChecklist.ts` | Add `useOnboardingReadiness` hook that checks form completion for a patient + appointment type combo |

### New hook: useOnboardingReadiness

```text
useOnboardingReadiness(patientId, appointmentTypeId)
  -> returns {
       required: FormTemplate[],
       completed: FormSubmission[],
       pending: FormTemplate[],
       isReady: boolean,
       completionPercent: number
     }
```

This queries `form_templates` where `required_for_treatment_types` includes the appointment type, then cross-references with `form_submissions` for the patient.

### AppointmentNew.tsx changes

- Read `patient_id` from URL search params
- If present, auto-select that patient in the list
- When both patient and appointment type are selected, call `useOnboardingReadiness` and display the result as a status badge below the appointment type selector

### PatientDetail.tsx changes

- Add "Book Appointment" button in the header actions
- Detect `?showNextSteps=true` query param
- When detected, show a prominent card at the top with three action buttons:
  1. Generate Onboarding Checklist (already has this in the onboarding tab, but surface it prominently)
  2. Book First Appointment (navigates to `/admin/appointments/new?patient_id={id}`)
  3. Send Invite Link (already exists, just surface it)

### NurseJobCard.tsx changes

- Fetch onboarding checklist for the patient
- Filter by forms required for this appointment type
- Replace the static "Consent form signed and on file" checkbox with a dynamic list showing actual form status
- Keep remaining manual checklist items (identity verified, allergies reviewed, etc.)
- Add a manual override toggle: "Paper consent obtained" for edge cases

### Auto-generate checklist on booking

In the `useCreateAppointment` hook's `onSuccess`, call `useGenerateChecklist` with the patient ID and the selected appointment type ID. This ensures that when Gayle books a ketamine therapy, the ketamine consent form automatically appears on the patient's onboarding checklist.

### No database changes required

All the linking data already exists:
- `form_templates.required_for_treatment_types` links forms to appointment types
- `onboarding_checklists` tracks which forms a patient needs to complete
- `form_submissions` records completed forms
- `appointments.appointment_type_id` tells us what treatment is planned

The pieces are all there -- this plan wires them together in the UI.

