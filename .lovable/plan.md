
## Goal

Make it obvious across the admin UI how many sessions of a multi-session course are already booked vs. still outstanding — so Gail always sees "session 1 of 6, sessions 2–6 still to schedule" rather than just "session #1" or "needs scheduling".

Scope is UI/labelling only — no schema changes, no changes to how referrals get created. (The referral-queue entry exists because every course is anchored to a referral; we're going to make it read like an action item instead of hiding it.)

## Changes

### 1. Appointment Quick Edit dialog — "Session 1 of 6"
File: `src/components/admin/AppointmentQuickEditDialog.tsx`

- Where it currently renders `Session #{session_number}`, load the appointment's `treatment_course_id` (already on the row) and read `total_sessions_planned` from the course.
- Render as `Session {session_number} of {total_sessions_planned}` when the course has a planned total, otherwise fall back to the current `Session #N`.
- Add a small helper line beneath: `X of N booked · Y still to schedule` with a "Book remaining sessions" button that opens `RecurringSessionDialog` prefilled the same way Quick Create does (frequency/day/time from the course template if present).

### 2. Dashboard "Referrals needing attention" tile — richer heads-up
File: `src/components/admin/DashboardActionsPanel.tsx` (and the small count hook `src/hooks/useReferralsAttentionCount.ts` if we need per-referral detail).

- Keep the existing "1 need session scheduling" chip, but under it list each referral in that bucket with:
  - Patient name + treatment (appointment type name from the course).
  - "Session 1 of 6 booked · sessions 2–6 outstanding".
  - A primary "Schedule remaining" button that jumps straight to `RecurringSessionDialog` for that course.
- Data already available: `useReferralsAttentionCount` pulls courses + non-cancelled appointments per referral; we just need the same query to expose the referral rows to the panel (or add a sibling hook `useReferralsNeedingScheduling`) so we can render the detail rather than only a count.

### 3. Referral queue row — show treatment + progress
File: `src/components/admin/referrals/ReferralTable.tsx`

Right now the "James Hawkins test 4" row shows Treatment: "—" and just a "Needs session scheduling" chip. Update the row (only when attention === `needs_scheduling`) to:

- Fill the Treatment column from the linked course's appointment type name (fallback to `treatment_requested` on the referral).
- Under the patient name, add a subline: `Session 1 of 6 booked · 5 outstanding`.
- Keep the existing green "Schedule sessions" CTA — it already opens the recurring dialog.

Referral data fetch (`useReferrals`) already joins `treatment_courses`; we'll extend the select to include `appointment_type:appointment_types(name)` and the non-cancelled appointment count so the table can compute the subline without extra round-trips.

### 4. Recurring dialog copy tidy (tiny)
File: `src/components/admin/RecurringSessionDialog.tsx`

- The blue banner already says "1 session already scheduled of 6 planned." Add a second short line: "You're scheduling sessions 2–6." — purely a labelling change so Gail can see at a glance which numbers she's about to create. No logic change.

## Explicitly out of scope

- No change to whether these items live under Referrals vs. a separate "Actions" area. That's a bigger IA question; happy to open it as a follow-up if you want, but for now we lean into making the referral row read like an action item.
- No DB migrations, no changes to appointment/course creation logic, no nurse/patient-portal changes.

## Verification

1. Open the existing James Hawkins ketamine appointment → header reads "Session 1 of 6" with a "Book remaining 5 sessions" button.
2. Dashboard tile lists that referral with "Ketamine Therapy · Session 1 of 6 booked · 5 outstanding" and a Schedule remaining button.
3. Referrals queue → row shows Treatment "Ketamine Therapy" and the same progress subline.
4. Clicking through opens `RecurringSessionDialog` prefilled for sessions 2–6.
