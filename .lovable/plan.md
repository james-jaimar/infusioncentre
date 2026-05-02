You’re right: the workflow is currently split in the wrong place. “Convert to course” only creates the course shell and stores an expected end date. It does not schedule an appointment, it does not ask for time, and it does not clearly move the admin to the next required scheduling step. I also confirmed in the database that the latest converted referral has a treatment course with 6 sessions and an expected end date, but 0 appointments, which matches what you described.

Plan to fix this holistically:

1. Redefine the referral/course attention states
   - Keep “new referral” and “needs patient” as referral tasks.
   - Once a treatment course exists, stop showing “ready to convert to treatment course”.
   - Add a separate “course needs scheduling” state when a course exists but has no appointments, or fewer scheduled appointments than planned.
   - Rename the user-facing language from “needs course setup” to something clearer like “Needs session scheduling”.

2. Make conversion a two-step clinical workflow, not a misleading finish button
   - Change the conversion dialog copy so the date is clearly “preferred first session date”, not a complete appointment booking.
   - Require either:
     - a preferred first session date, then continue to session scheduling, or
     - skip scheduling for now, but leave a visible task.
   - After conversion succeeds, automatically open the recurring session scheduler for the newly created course instead of closing the workflow and leaving the admin stranded.

3. Pre-fill the recurring session scheduler from the conversion choice
   - Pass the chosen preferred start date into `RecurringSessionDialog`.
   - Use the selected course template frequency where possible: weekly, twice weekly, biweekly, monthly.
   - Pre-fill the number of sessions from the course/template.
   - Keep the existing editable session list so Gail can review all generated dates and adjust them individually.
   - Make time selection explicit and prominent before creating appointments.

4. Improve scheduling validation and wording
   - The scheduler will clearly say: “These are proposed appointments. Choose a time and review/edit each session before creating them.”
   - Do not imply anything is on the appointments calendar until appointments are actually created.
   - If the admin closes scheduling without creating appointments, show a toast/nudge that the course remains in “Needs session scheduling”.

5. Fix course status and referral status after successful conversion/scheduling
   - On conversion, create the treatment course and return it to the UI so we can continue scheduling immediately.
   - Update the referral status to `converted_to_course` after the course is created, instead of leaving it simply as `accepted`, so the referral no longer looks unfinished.
   - After appointments are bulk-created, invalidate referral/course/appointment queries and optionally move the course from onboarding/draft toward `ready` where the existing lifecycle allows.

6. Surface unscheduled courses in admin task areas
   - Update the sidebar/dashboard referral badge/count so it includes “course needs scheduling” rather than incorrectly keeping “ready to convert”.
   - Add dashboard chips such as:
     - Awaiting triage
     - Needs patient
     - Needs session scheduling
   - Update the referrals table button for converted-but-unscheduled items to “Schedule sessions”, which opens the scheduler rather than the conversion dialog.

7. Technical files likely to change
   - `src/lib/referralProgress.ts` — expand workflow states to include scheduling-needed.
   - `src/hooks/useReferrals.ts` — fetch enough course appointment/session info to calculate scheduling completeness.
   - `src/hooks/useReferralsAttentionCount.ts` — include unscheduled/part-scheduled courses in the task count.
   - `src/hooks/useTreatmentCourses.ts` — return the newly-created course and update referral status to `converted_to_course`.
   - `src/components/admin/ConvertReferralDialog.tsx` — make conversion continue directly into scheduling.
   - `src/components/admin/RecurringSessionDialog.tsx` — accept initial start date/frequency/session defaults and add clearer “not scheduled until created” language.
   - `src/components/admin/referrals/ReferralTable.tsx`, `ReferralFilters.tsx`, `ReferralMetrics.tsx`, `src/pages/admin/AdminReferrals.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/components/layout/AdminLayout.tsx` — update labels, buttons, filters, and counts.

Outcome: choosing a date during conversion will no longer create a hidden half-state. The admin will either immediately complete appointment scheduling with dates and time, or the system will visibly keep a “Needs session scheduling” task until those appointments exist.