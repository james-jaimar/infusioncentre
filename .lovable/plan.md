## Backfill: create referral links for existing appointments with a referring doctor

### Problem
The new `ensureDoctorReferral` logic only runs on appointment save going forward. Any appointments Gail already created/edited before this fix — where a referring doctor was picked — still have no `referrals` row linking the patient to that doctor. Those patients won't appear under the doctor's Patients/Referrals tabs until we backfill.

### Approach
Run a one-off SQL backfill (via migration) that inserts a `referrals` row for every distinct `(patient_id, doctor_id)` pair currently implied by appointments, where no matching referral already exists.

Two possible signals of "this appointment has a referring doctor":
1. `appointments.doctor_id` (structured link) — preferred if populated.
2. `patients.referring_doctor_name` free-text — harder to match reliably; skip for backfill (would need fuzzy matching against `doctors`). Gail can re-save those appointments if needed.

Backfill will use signal #1 only.

### SQL (single migration, idempotent)

```sql
INSERT INTO public.referrals (
  doctor_id, patient_id, tenant_id,
  patient_first_name, patient_last_name, patient_email, patient_phone,
  status, urgency, reason_for_referral, reviewed_at
)
SELECT DISTINCT
  a.doctor_id, a.patient_id, p.tenant_id,
  p.first_name, p.last_name, p.email, p.phone,
  'accepted', 'routine',
  'Backfilled from existing appointment (admin-scheduled)',
  now()
FROM public.appointments a
JOIN public.patients p ON p.id = a.patient_id
WHERE a.doctor_id IS NOT NULL
  AND a.patient_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r
    WHERE r.patient_id = a.patient_id
      AND r.doctor_id = a.doctor_id
  );
```

Safe to re-run: the `NOT EXISTS` guard makes it idempotent.

### Verification
1. Before running: check James Hawkins test 4 → doctor test 2 currently has no referral (or confirm which pairs are missing) via a `SELECT` first.
2. After running: open **Doctors → doctor test 2** → previously-scheduled patients now appear under Patients and Referrals tabs with status `accepted`.
3. Re-running the migration inserts 0 rows.

### Non-goals
- No code changes — the going-forward logic already works.
- No backfill from free-text `referring_doctor_name` (unreliable without fuzzy matching; can be addressed separately if needed).
- No touching existing referrals — only inserts the missing ones.

### Question
Before running, do you want me to first show a `SELECT` preview of the exact `(patient, doctor)` pairs that would be inserted, so you can eyeball it? Or just run the backfill directly?
