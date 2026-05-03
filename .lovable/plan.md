# Make scheduled sessions visible & flag onboarding-ready patients

## What's actually wrong (verified against the DB)

- James Hawkins has **13 scheduled appointments** persisted against his iron course — scheduling is working.
- The Treatment Course card only renders a `sessions_completed / total_planned` progress bar. That counter only ticks up when a session is **completed**, so it stayed "0 / 4" and looked like nothing saved.
- The card never lists the actual upcoming bookings, and there's no link to view them on the calendar.
- Because the screen looked empty, the dialog was opened again and again → duplicate session numbers (multiple #1s, #2s, etc.).
- The patient list has no signal that onboarding forms are complete, so you can't tell at a glance who's ready to schedule.

## Changes

### 1. Treatment Course card — show what's booked

In `PatientTreatmentCoursesTab.tsx`, for each active course:

- New row of three counters: **Completed X · Scheduled Y · Planned Z** (replaces the misleading "0/4" headline; progress bar stays but is clearly labelled "completed").
- New collapsible **"Scheduled sessions (Y)"** section listing every non-cancelled appointment for that course: session #, date/time, chair, nurse, status pill. Click a row → navigate to `/admin/appointments/:id`.
- "Schedule sessions" button changes label to **"Schedule more sessions"** when bookings already exist, and shows a subtle warning if `scheduled + completed >= total_planned` ("All planned sessions are already on the calendar — adding more will exceed the course plan").
- New **"View on calendar"** link that opens `/admin/appointments?patient=<id>`.

Data: extend `useTreatmentCoursesByPatient` to also pull `appointments(id, scheduled_start, scheduled_end, status, session_number, chair:treatment_chairs(name), nurse:profiles(...))` filtered to non-cancelled, ordered by `scheduled_start`.

### 2. Prevent accidental duplicate scheduling

In `RecurringSessionDialog.tsx`:

- On open, fetch existing non-cancelled appointments for the course and:
  - Default `numSessions` to `max(0, planned - completed - alreadyScheduled)` instead of `remaining`.
  - Show an inline notice at the top: **"3 of 4 sessions already scheduled"** with the next upcoming date.
  - If user tries to create more than the remaining slots, show a confirm dialog ("This will exceed the planned 4 sessions. Continue?").
- Replace the existing amber "Nothing is booked yet" banner with a context-aware message (it currently lies when bookings exist).

### 3. "Forms complete / Ready to schedule" indicator on patient list

`AdminPatients.tsx` already shows a Pipeline stage chip (`ready_to_schedule`, etc.). Two small additions:

- Add a thin green left-border (`border-l-4 border-l-emerald-500`) to rows whose `pipeline_stage === "ready_to_schedule"` so they pop visually in the table — this directly addresses "highlight in green".
- Reuse the existing `PatientReadinessBadge` next to the patient name when stage is `onboarding` or `ready_to_schedule`, so you can see "5/5 forms" at a glance without opening the patient.

### 4. Patient detail header — quick onboarding status

In `PatientDetail.tsx`, next to the patient name, render `<PatientReadinessBadge patientId={id} />` so the green "Ready" pill is visible everywhere inside the patient record, not just buried in tabs.

## Optional follow-up (not in this change unless you want it)

The DB has duplicate `session_number` rows for James from the earlier accidental re-bookings. I can add a one-off cleanup to renumber sessions chronologically per course — say the word and I'll include it.

## Files touched

- `src/components/admin/PatientTreatmentCoursesTab.tsx` — counters, scheduled list, calendar link
- `src/hooks/useTreatmentCourses.ts` — include appointments in `useTreatmentCoursesByPatient`
- `src/components/admin/RecurringSessionDialog.tsx` — pre-aware of existing bookings, smarter defaults & banner
- `src/pages/admin/AdminPatients.tsx` — green row accent + readiness badge
- `src/pages/admin/PatientDetail.tsx` — readiness badge in header
