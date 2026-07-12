## Root cause

For "James Hawkins test 4", the referral has **two treatment courses** under it:
- Iron Infusion — 1 planned, 1 booked
- Ketamine Therapy — 6 planned, 1 booked

`useReferrals` and `useReferralsAttentionCount` collapse all courses on a referral into a single sum: `total_sessions_planned = 1 + 6 = 7`, `appointment_count = 1 + 1 = 2`. That's where the "Session 2 of 7 · 5 outstanding" comes from — it's not wrong arithmetic, it's the wrong unit. The dashboard and referral queue treat "referral" as the schedulable unit, but the actual schedulable unit is the **course**. The `RecurringSessionDialog` opens against a single course (Ketamine, 6 sessions), which is why it correctly says "sessions 2–6".

The treatment label ("Iron Infusion") is also misleading — it comes from `first_course` regardless of which course actually needs scheduling.

## Fix — surface progress per course, not per referral

Small, presentation-only changes. No schema or data changes.

### 1. `src/hooks/useReferrals.ts`
Keep existing fields for backward compatibility, but also expose a per-course breakdown:
- Add `scheduling_courses: Array<{ course_id, treatment_name, planned, scheduled, outstanding }>` — one entry per course under the referral that still needs scheduling (`planned > scheduled`, or `planned === 0 && scheduled === 0`).
- Add `needs_scheduling_course_count = scheduling_courses.length`.

### 2. `src/pages/admin/AdminDashboard.tsx`
"Referrals needing attention" list:
- Instead of one row per referral, render one row per entry in `scheduling_courses` for every referral where `getReferralAttention === "needs_scheduling"`.
- Each row shows: `{patient name} · {course treatment_name}` on the left, `Session {scheduled} of {planned} booked · {outstanding} outstanding` on the right.
- Cap at 5 rows total; overflow line uses the course count, not the referral count.

### 3. `src/components/admin/referrals/ReferralTable.tsx`
For rows where attention is `needs_scheduling`:
- Treatment column: if there is exactly one scheduling course, show that course's name; if multiple, show `"{first course name} +{n-1} more"`.
- Subline under the patient name: if one course, keep `Session X of N booked · Y outstanding` using that course's numbers; if multiple, show `{count} courses need scheduling` and drop the misleading aggregate math.

### 4. `src/hooks/useReferralsAttentionCount.ts`
No behavioural change to the top-level `needs_scheduling` chip count (still counts referrals, matching the existing `getReferralAttention` contract). This keeps the "1 need session scheduling" chip consistent with the queue tab filter. Only the per-row detail switches to per-course.

### Out of scope
- `getReferralAttention` logic (still per-referral — a referral needs scheduling if *any* course does).
- `RecurringSessionDialog` — already correct.
- `AppointmentQuickEditDialog` — already course-scoped and correct.
- Any DB / RLS / edge function changes.

### Verification
After the change, for James Hawkins test 4 the dashboard should show a single row:
`James Hawkins test 4 · Ketamine Therapy — Session 1 of 6 booked · 5 outstanding`
(Iron Infusion is fully scheduled at 1/1 so it drops out.)