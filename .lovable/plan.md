
## Problem

When admin moves/reschedules an appointment, the row keeps its old `patient_confirmed_at` and `status = confirmed`. The calendar still shows "Confirmed" even though the patient never confirmed the new date. Nothing prompts admin to send a fresh SMS.

## Fix

### 1. Clear patient confirmation on any admin-driven time change

Update the two write paths in `src/hooks/useAppointments.ts`:

- `useRescheduleAppointment` — when updating the row, also set:
  - `patient_confirmed_at: null`
  - `status: "scheduled"` (only if current status is `confirmed`; leave `cancelled`, `checked_in`, etc. alone — pass through via a small pre-check or just always downgrade `confirmed` → `scheduled`)
- `useMoveAppointment` (drag-drop) — same clearing when `newStart` differs from the existing `scheduled_start`. Include the fields in both the DB update and the optimistic cache patch so the badge flips immediately.

Rationale: any admin time change invalidates the patient's prior consent to the slot.

### 2. Prompt admin to re-confirm after reschedule

`RescheduleDialog` already has a two-stage flow (edit → SMS) — good. Extend it so the SMS stage always shows after a successful reschedule (already does) and add a secondary **"Mark manually confirmed"** button next to *"I'll send it later"* / *"Send SMS confirmation"*. That button calls `useUpdateAppointment` to set `status: "confirmed"` and `patient_confirmed_at: now()` — same as the existing manual-confirm affordance elsewhere.

For drag-drop moves (no dialog), surface the state via the calendar badge (see step 3) plus a toast "Patient must re-confirm — send SMS from the appointment card."

### 3. Calendar badge accuracy

`AdminAppointments.tsx` already distinguishes:
- ✓ Confirmed → `patient_confirmed_at && !hasRescheduleRequest`
- Admin confirmed → `status === "confirmed" && !patient_confirmed_at`

After step 1, a rescheduled appointment drops to `status = scheduled`, so it will render as neither badge (correct — needs action). Add a subtle "Needs re-confirmation" pill when the appointment has a non-null `reschedule_reason` (or was recently updated) and `patient_confirmed_at is null` and `status in ('scheduled')`. Simplest signal: `reschedule_reason IS NOT NULL AND patient_confirmed_at IS NULL AND status = 'scheduled'`.

### 4. Broader workflow review — findings & follow-ups

Areas that already look correct after prior fixes:
- Realtime UPDATE patching in `useAppointments` (direct cache patch on postgres_changes UPDATE)
- SMS confirmation link now uses `patient_confirmed_at` not `status`
- `confirm-appointment` edge function returns fresh state

Gaps worth flagging (not implementing yet — confirm before doing):
- `AppointmentQuickEditDialog` time/chair edits should also clear `patient_confirmed_at` when start time changes. This is the "silent" path most likely to reintroduce the bug.
- `useCreateBulkAppointments` and drag-drop should never carry over a stale confirmation from a template.
- Cancellations by admin: patient should get a cancellation SMS, not just a status change (out of scope for this plan).

## Files to change

- `src/hooks/useAppointments.ts` — clear confirmation in `useRescheduleAppointment` and `useMoveAppointment`
- `src/components/admin/AppointmentQuickEditDialog.tsx` — same clearing when `scheduled_start` changes
- `src/components/admin/RescheduleDialog.tsx` — add "Mark manually confirmed" button on SMS stage
- `src/pages/admin/AdminAppointments.tsx` — add "Needs re-confirmation" badge; toast on drag-drop move

## Verification

- Move James Hawkins III's appointment via drag-drop → badge flips to "Needs re-confirmation", `patient_confirmed_at` is null in DB.
- Reschedule via dialog → SMS stage shows, with option to send SMS or mark manually confirmed.
- Send SMS from the confirmation link and tap Confirm → badge flips back to "✓ Confirmed" without page refresh (realtime cache patch).
