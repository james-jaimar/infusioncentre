## Problem

The two-stage reschedule workflow only wires up when admins enter the appointment via the RescheduleDialog on `AppointmentDetail`. In practice Gail is opening the appointment from the calendar/dashboard, which opens `AppointmentQuickEditDialog`. That dialog's generic "Send SMS confirmation" button knows nothing about the pending `appointment_change_requests` row, so:

- Sending the SMS from Quick Edit does not flip the request from `rescheduled_pending_sms` → `resolved`.
- No `sms_sent_at` / `resolved_by` stamp is written, so another admin cannot see it was handled.
- The dashboard action item stays in the amber "SMS pending" state indefinitely.
- The Today's Appointments "Rescheduled" chip title claims "SMS resent" even when it hasn't been.

## Fix

Make the change-request awareness travel with the appointment, no matter which entry point is used, and record who handled it.

### 1. `AppointmentQuickEditDialog` — become change-request aware

- Look up any open `appointment_change_requests` row for this `appointment_id` where `status IN ('pending','rescheduled_pending_sms')` (small hook `usePendingChangeRequestForAppointment(appointmentId)`, reuses realtime invalidation).
- When one exists, render a prominent banner at the top of the dialog:
  - `pending` → amber "Patient requested reschedule" with patient's preferred date/window and a "Reschedule…" CTA (opens existing reschedule flow).
  - `rescheduled_pending_sms` → red "Awaiting reschedule confirmation SMS" showing the new slot and who did the reschedule + when.
- Promote the SMS button to primary styling when a request is in `rescheduled_pending_sms`, relabel to "Send reschedule confirmation SMS".
- On successful send in that state, also call `useMarkRequestSmsSent` so the request transitions to `resolved` and `sms_sent_at` / `resolved_by` are stamped. Generic SMS sends (no pending request) behave exactly as today.
- After send, show inline confirmation text in the banner: "SMS sent by {name} · {time}" pulled from the resolved request, so any admin re-opening the appointment sees the trail.

### 2. Deep-link from Today's Appointments

- In `AdminDashboard.AppointmentsPanel`, join the today/tomorrow queries to `appointment_change_requests` (open statuses only) so each row knows if a request is pending and its state.
- Replace the misleading "Rescheduled · SMS resent" tooltip with accurate states:
  - `pending` → amber "Reschedule requested" chip.
  - `rescheduled_pending_sms` → red "SMS pending" chip.
  - Otherwise, no chip (the existing "Rescheduled" claim is removed).
- When a chip is shown, the row links to `/admin/appointments?view=day&date=…&apt=…&rescheduleRequestId=…` so the day view can auto-open the Quick Edit dialog with the banner already highlighting the outstanding step.

### 3. Day view auto-open

- In the appointments day view (`AdminAppointments` / `AppointmentsListView` — whichever handles `?apt=`), read `rescheduleRequestId` and pass it through when opening `AppointmentQuickEditDialog` so the banner + primary SMS state appear immediately without a second click.

### 4. Audit stamp visibility

- The Quick Edit banner and the dashboard action-items list already share `resolved_by` / `sms_sent_at` from the request row — surface `resolved_by`'s name (join `profiles`) in both places so a second admin can see "Handled by Gail · 09:42" at a glance.

## Out of scope

- No schema changes; the columns added in the previous migration (`new_appointment_id`, `sms_sent_at`, `resolved_by`) are sufficient.
- No changes to the RescheduleDialog itself; it already stamps `rescheduled_pending_sms` correctly.
- Nurse Command Centre / patient-side surfaces unchanged in this pass.

## Files to touch

- `src/components/admin/AppointmentQuickEditDialog.tsx` — banner, promoted SMS button, mark-resolved on send.
- `src/hooks/useAppointmentChangeRequests.ts` — add `usePendingChangeRequestForAppointment(appointmentId)`.
- `src/pages/admin/AdminDashboard.tsx` — join change requests, correct chips, deep-link query param.
- `src/pages/admin/AdminAppointments.tsx` (day view) — honour `rescheduleRequestId` when opening Quick Edit.
