## Root cause (verified against the DB)

The reschedule request that you submitted via the SMS link is in the database:

- Row `d2a616c1-…` on `appointment_change_requests` for James Hawkins test 4, appointment `93895a4e-…`, `status = 'pending'`, reason "Can we move to Tuesday please".

So `confirm-appointment` did its job — the note was appended to the appointment AND the change request was inserted. What's broken is the **client read**, not the write.

`appointment_change_requests` now has **two** foreign keys pointing at `appointments`:

- `appointment_id → appointments(id)`
- `new_appointment_id → appointments(id)` (added when we introduced the "rescheduled_pending_sms" flow)

`usePendingChangeRequests` embeds the appointment with `appointment:appointments(…)`. With two FKs to the same target, PostgREST can't decide which relationship to use and the whole query errors out — so on the client the list looks empty. Older rows appeared before because they were already cached / queried before the second FK existed. New rows never surface.

That's why:
- The Action Items panel on the dashboard doesn't list the reschedule request.
- The appointment modal doesn't show the "Patient requested a reschedule" banner.
- Tomorrow's appointment on the dashboard doesn't get the reschedule marker (same hook feeds it).

## Fix

Disambiguate the embed by naming the FK explicitly. One-line change in `src/hooks/useAppointmentChangeRequests.ts` inside `usePendingChangeRequests`:

```ts
.select(
  "id, appointment_id, patient_id, request_type, preferred_date, preferred_time_window, reason, status, created_at, new_appointment_id, sms_sent_at, appointment:appointments!appointment_change_requests_appointment_id_fkey(id, scheduled_start, scheduled_end, appointment_type:appointment_types(name)), patient:patients(id, first_name, last_name, phone)"
)
```

No other file needs to change — `DashboardActionsPanel`, `AdminDashboard`, and `AppointmentQuickEditDialog` all consume this hook.

## Verification

1. Load `/admin` — the Action Items card should list `Reschedule request · James Hawkins test 4 · Current: Mon 13 Jul · 10:30 · Ketamine Therapy` with the "Can we move to Tuesday please" reason.
2. Tomorrow's Appointments row for James Hawkins test 4 should show the amber reschedule marker.
3. Opening the appointment modal should show the "Patient requested a reschedule" banner with the Reschedule / Send SMS actions.

## Out of scope

No DB migration, no changes to `confirm-appointment`, no changes to the write mutations, no UI/design changes.
