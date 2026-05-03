
## Part 1 — Fix the broken "Active courses" filter (root cause)

The course status dictionary actually contains: `draft`, `onboarding`, `ready`, `active`, `paused`, `completing`, `completed`, `cancelled`. Both your live courses are currently in `onboarding`.

But the patient list code only treats `draft / active / ready` as active (`src/hooks/usePatients.ts` line 38, and `src/pages/admin/AdminPatients.tsx` line 35). So `onboarding` courses fall through every filter except "All", which is exactly what the screenshots show.

Fixes:

- Treat the full live set as **Active**: `draft, onboarding, ready, active, paused, completing`.
- Re-define **Awaiting scheduling** to mean "course exists but no future appointments scheduled yet", computed from the joined `appointments` rows — not by hard-coding `status='draft'` (which is a transient setup state, not a scheduling state).
- Keep **Completed** = `status='completed'`.
- Keep **No course yet** = client-side filter for patients with zero courses (correct already).
- Update both `usePatients.ts` (`ACTIVE_COURSE_STATUSES`) and `AdminPatients.tsx` (`ACTIVE_SET`) so the chip ordering and the DB filter agree. Best to export one constant from `usePatients.ts` and import it into the page.

## Part 2 — Make Gail's pipeline visible at a glance

Goal: at every screen Gail lands on, she should immediately see *who is stuck where*. Today the dashboard shows referral attention buckets, but once a patient has a course there is no visibility into onboarding progress, invites, or forms.

### 2a. Patient list — add a "Stage" column and stage chips

Replace the single ambiguous chip strip with these chips per row (one or more):

- **Needs invite** — patient has no `user_id` and no pending `patient_invite`
- **Invite sent** — invite exists, not yet accepted (show age, e.g. "3d")
- **Onboarding X/Y** — course in onboarding; show forms completed / total from `onboarding_checklists`
- **Ready to schedule** — onboarding complete, no future appointments
- **Scheduled N/M** — appointments booked vs `total_sessions_planned`
- **In treatment** — at least one completed visit, more remaining
- **Completed** — course completed
- **Paused / Cancelled** — terminal/blocked

Add matching pipeline filter chips above the table to replace the current course-state chips:
`All • Needs invite • Invite sent • Onboarding • Ready to schedule • Scheduled • In treatment • Completed • Paused`

Each chip is also clickable from the dashboard.

### 2b. Admin dashboard — "Patient pipeline" card

A new card next to "Referrals needing attention" showing counts for each stage above, each linking to the patients list pre-filtered. This gives Gail the single overview she's asking for: how many patients are stuck waiting for an invite, how many invites are unanswered, how many have forms outstanding, how many are ready for scheduling, etc.

### 2c. Patient detail — "Onboarding & access" panel

Small panel at the top of the patient detail page summarising:

- Account status: no account / invite sent (date, resend) / linked (last login)
- Forms: `X / Y completed`, with a one-click **Send reminder** if any pending and patient has logged in
- Next action suggestion (e.g. "Send portal invite", "Chase outstanding forms", "Schedule first session")

Reuses existing `useOnboardingChecklist`, `usePatientInvites`, and the `password-reset` / `send-patient-invite` edge functions — no new backend.

### 2d. Stage derivation helper

New `src/lib/patientPipeline.ts` exporting:

```text
type PatientStage =
  | "needs_invite" | "invite_sent" | "onboarding"
  | "ready_to_schedule" | "scheduled" | "in_treatment"
  | "completed" | "paused" | "cancelled" | "no_course";

derivePatientStage(patient, courses, invites, checklist, appointments) -> PatientStage
```

Used by the list, the dashboard counter query, and the patient detail panel — single source of truth so labels/filters never drift again.

## Files touched

- `src/hooks/usePatients.ts` — fix active set, accept derived-stage filter, return invite + checklist + appointment counts inline
- `src/pages/admin/AdminPatients.tsx` — new chip set, new Stage column
- `src/pages/admin/AdminDashboard.tsx` — new Patient pipeline card
- `src/pages/admin/PatientDetail.tsx` — new Onboarding & access panel
- `src/lib/patientPipeline.ts` (new) — stage derivation
- `src/hooks/usePatientPipelineCounts.ts` (new) — dashboard aggregation

No DB migration required; everything derived from existing tables (`patients`, `treatment_courses`, `appointments`, `onboarding_checklists`, `patient_invites`).

## Out of scope for this round

- Automated reminder schedules (just manual "send reminder" buttons for now)
- Doctor-side pipeline (referrals dashboard already covers it)
- Reworking the Nurse command centre

Approve and I'll implement Part 1 + Part 2 together so the filter fix and the new pipeline visibility ship in one pass.
