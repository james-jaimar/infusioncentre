# Auto-link referring doctor when creating/editing an appointment

## Problem
When Gail picks a referring doctor on an appointment (quick create or quick edit), the system today only writes free-text fields (`referring_doctor_name/practice/phone`) onto the patient row. It never links the patient to the doctor in a structured way, so:

- The doctor's **Patients** tab (`DoctorDetail`) stays empty — it's driven by `referrals.doctor_id → patient_id`.
- The doctor's **Referrals** tab stays empty — same source.
- The patient doesn't appear in the doctor portal (`DoctorMyPatients`, `DoctorReferrals`) either.

Expected: picking a doctor on the appointment should behave "as if that doctor referred the patient" — the patient shows up under the doctor everywhere.

## Fix

When the appointment dialog saves with a doctor selected, in addition to writing the referring-doctor text fields on `patients`, ensure a `referrals` row exists linking `patient_id ↔ doctor_id`:

1. Query `referrals` for `patient_id = <patient>` AND `doctor_id = <selected doctor>`.
2. If none exists, insert a minimal referral:
   - `doctor_id`, `patient_id`
   - `patient_first_name`, `patient_last_name` (copied from the patient record)
   - `patient_phone`, `patient_email` (copied from patient if available)
   - `status = 'accepted'` (admin-created, already actioned — matches screenshot 114 where existing referral is "accepted")
   - `urgency = 'routine'`
   - `reason_for_referral = 'Admin-created via appointment scheduling'` so it's clear where it came from
   - `reviewed_at = now()`, `reviewed_by = current user id` if convenient
3. If a referral already exists for that pair, do nothing (idempotent — avoids duplicate rows when Gail edits the appointment later).
4. If the doctor selection is **cleared** (`"none"`), leave existing referrals untouched. We don't want to delete referral history just because someone unset the field on an appointment.

Invalidate the relevant React Query caches after the write so the doctor detail page refreshes without a manual reload:
- `["referrals"]`, `["doctor-linked-patients", doctorId]`, `["doctor-detail", doctorId]`.

## Files to change

- `src/components/admin/AppointmentQuickCreateDialog.tsx` — after the patient/appointment insert, run the ensure-referral logic when `doctorId !== "none"`.
- `src/components/admin/AppointmentQuickEditDialog.tsx` — same logic in `handleSave` alongside the existing patient text-field sync.
- Optionally centralise as a small helper `src/lib/ensureDoctorReferral.ts` so both dialogs share one implementation.

## Non-goals

- No schema migration needed — `referrals` already supports this shape.
- No changes to the doctor portal queries — they already read from `referrals` correctly.
- No change to the "Rescheduled/Confirmed" badge work from the previous turn.

## Verification

1. Create/edit an appointment for James Hawkins test 4, pick "doctor test 2", save.
2. Open **Doctors → doctor test 2**: James Hawkins test 4 appears under **Patients** and a new row appears under **Referrals** with status `accepted`.
3. Edit the same appointment again (no doctor change) → no duplicate referral is created.
4. Change the doctor to another doctor → new referral appears under the new doctor; old one stays under the previous doctor (history preserved).
