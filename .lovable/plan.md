## Problem

The dashboard's "Referrals needing attention" flags patients as **Needs course setup** even when a course is clearly attached to their appointments (e.g. Mark Hawkins has Iron Infusion / Wound Care / Ketamine courses on his sessions).

Root cause: `useReferralsAttentionCount` counts courses via the `treatment_courses.referral_id` foreign key. But when a course is auto-created from the **Appointment Quick Create** dialog (`AppointmentQuickCreateDialog.tsx` lines 336–381), we only set `patient_id` and `treatment_type_id` — we never populate `referral_id`. So the referral sees zero linked courses and gets tagged `needs_course`.

The `ensureDoctorReferral` step and the course creation step run independently; they never wire up to each other.

## Fix

### 1. Link new appointment-created courses to the referral

In `src/components/admin/AppointmentQuickCreateDialog.tsx` (and the same pattern in `AppointmentQuickEditDialog.tsx` if it has the equivalent course-creation block):

- After `ensureDoctorReferral(patientId, doctorId)` returns, look up the most recent non-terminal `referrals` row for `(patient_id = patientId, doctor_id = doctorId)`.
- Pass that `referral_id` into both branches of the course logic:
  - When **creating** a new `treatment_courses` row → include `referral_id` in the insert.
  - When **reusing** an existing draft/onboarding/ready/active course that has no `referral_id` yet → `UPDATE` it to set `referral_id`.
- Also bump `total_sessions_planned` to at least the number of appointments already booked in that course, so the "needs scheduling" logic doesn't misfire either.

### 2. Backfill existing courses

One-shot data migration (via the insert tool, not schema) to repair the existing data shown in the screenshots:

```sql
UPDATE treatment_courses tc
SET referral_id = r.id
FROM referrals r
WHERE tc.referral_id IS NULL
  AND tc.patient_id = r.patient_id
  AND r.status IN ('accepted','under_review','info_requested','scheduled','converted_to_course')
  AND r.doctor_id IS NOT NULL;
```

If a patient has multiple accepted referrals from different doctors, prefer the referral whose `doctor_id` matches the appointment's referring doctor. Practically, given the current data volume, picking the most recent accepted referral per patient is sufficient — we can refine with a `DISTINCT ON (tc.id)` + `ORDER BY r.created_at DESC` if needed.

### 3. Verify

After the code change and backfill:
- Mark Hawkins' referral row should no longer show the "Needs course setup" badge.
- Dashboard's "Referrals needing attention" count should drop to only genuinely-unlinked referrals.
- New appointments booked via Quick Create should immediately produce a course that shows up under the referral, without any manual re-linking.

## Out of scope

- No schema changes; `treatment_courses.referral_id` already exists.
- No change to the attention heuristic itself (`src/lib/referralProgress.ts`) — it's correct; the data feeding it was wrong.
- Nurse/patient portal logic untouched.
