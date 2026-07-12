## Goal

When Gail books a first appointment via **Appointment Quick Create**, surface the course structure (this is session 1 of N) and let her choose to schedule just this one, or all remaining sessions in the same transaction — instead of remembering to open the course page later and use "Schedule recurring sessions".

## What we already have (good news)

- `treatment_course_templates` already carry `default_sessions`, `default_frequency`, `default_session_duration_mins`, `medication_name` — the "flavours" per treatment type.
- `RecurringSessionDialog.tsx` already does the multi-session generation (weekly / twice-weekly / biweekly / monthly, editable per-row) against a course. We just don't invoke it from Quick Create.
- Quick Create already find-or-creates the `treatment_courses` row and links the new appointment to it.

The missing piece is purely **UX plumbing at the Quick Create step**.

## Changes

### 1. Course template picker inside Quick Create

In `AppointmentQuickCreateDialog.tsx`, after Treatment Type is chosen:

- Load active `treatment_course_templates` for that `appointment_type_id` via `useActiveCourseTemplatesByType`.
- If the type has one or more templates, show a **Course variant** select ("Iron Infusion — single", "Iron Infusion — weekly ×4", "Ketamine Induction — 6 sessions", "As-needed / one-off"…). If there are none, fall back to today's single-session behaviour with a small "Single session" note.
- Chosen template pre-fills:
  - `total_sessions_planned` (from `default_sessions`, editable inline as "Sessions in course: [4]")
  - `duration` (from `default_session_duration_mins` if set)
  - `frequency` (kept in local state for step 3)
  - `course_template_id` on the course insert (already supported by `useCreateTreatmentCourse` and the DB trigger `create_onboarding_from_course`).

### 2. "This is session X of N" awareness

Show a small info strip once a course/template is picked:

```text
Iron Infusion course · 4 sessions total · weekly
This booking = session 1 of 4
```

Compute session_number = (existing completed + already-scheduled non-cancelled sessions on the course) + 1. Save it onto the appointment via the existing `session_number` column.

### 3. Scheduling-mode radio

Directly under the info strip, three choices:

- **Just this appointment** — today's behaviour. Remaining sessions left as a task (they already surface via the "needs scheduling" bucket / course detail page).
- **Book all N sessions now** — after the first appointment is created and the course is find-or-created, open the existing `RecurringSessionDialog` prefilled with:
  - `initialStartDate` = the just-picked date/time
  - `initialFrequency` = template's `default_frequency` (fallback weekly)
  - `numSessions` = remaining (N − 1, since session 1 is already booked)
  - Chair/nurse/time carried over as defaults.
  On submit, those extra sessions are appended to the same course.
- **Book a custom number now** — same as above but the operator sets how many to book right now (2, 3…) and can defer the rest. `RecurringSessionDialog` already supports this because `numSessions` is an editable field.

Default selection: **Just this appointment** (least destructive; matches current muscle memory).

### 4. Post-booking success card

The success dialog already shows "Linked to: <course type> (new draft/existing)". Extend it to:

- Include `Session X of N` under that line.
- If scheduling-mode was "Just this appointment", add a secondary button **"Book remaining N−1 sessions"** that opens `RecurringSessionDialog` on the just-created course. This gives Gail an escape hatch if the patient decides on the phone after booking session 1.

### 5. Course reuse rule stays the same

The find-or-create logic (`treatment_courses` where patient + type + status in draft/onboarding/ready/active) is unchanged. If a course already exists for this patient+type, we reuse it, and:

- We do **not** overwrite `total_sessions_planned` on an existing course silently. If the picked template implies a different session count than the existing course, show an inline warning: *"This patient already has an active Iron Infusion course with 4 sessions planned — this appointment will be added as session {n+1}."* No template swap on an existing course from this dialog.

## Out of scope

- No schema changes. `treatment_courses.course_template_id`, `session_number`, `total_sessions_planned`, `treatment_course_id` on appointments all exist.
- No changes to `RecurringSessionDialog` internals beyond passing the new initial props (already supported: `initialStartDate`, `initialFrequency`).
- Referral triage / Convert-referral flow untouched — it already uses templates via `ConvertReferralDialog`. This plan only closes the parallel gap in Quick Create.
- No changes to nurse / patient portals.

## Technical notes

Files touched:

- `src/components/admin/AppointmentQuickCreateDialog.tsx` — add template picker, sessions-in-course field, scheduling-mode radio, computed session_number, chained open of `RecurringSessionDialog`.
- Reuse: `useActiveCourseTemplatesByType` (already exports), `RecurringSessionDialog` (already accepts `initialStartDate` / `initialFrequency`), `useCourseTemplates` types for `CourseFrequency`.

`AppointmentQuickEditDialog.tsx` gets a smaller version: show the current course's "Session X of N" read-only, and a "Book remaining sessions" button that opens `RecurringSessionDialog` for its course. No template picker on edit — the course is already chosen.

## Verification

- Booking a new patient for an Iron Infusion "weekly ×4" template with "Book all 4 now" produces one course + four appointments numbered 1–4, spaced weekly, all linked to the same `treatment_course_id`.
- Booking "Just this appointment" then, from the success card, "Book remaining 3 sessions" produces the same end state.
- Booking against an existing active course shows the "already planned" warning and increments `session_number` correctly on the new appointment.
- Dashboard "Referrals needing attention" / "Needs scheduling" counts drop as sessions get scheduled (existing logic; unchanged).
