## Goal

Make the "Reschedule request" action item on the admin dashboard a fully dynamic workflow: clicking Open jumps straight into the reschedule flow for that appointment, and the action item auto-updates as each step is completed (reschedule saved → SMS confirmation sent). No admin has to manually click "Done".

## Flow

```text
Dashboard action list
  └─ [Open] on "Reschedule request" for James Hawkins
         │  (carries change_request_id)
         ▼
  Appointment detail page opens
  Reschedule dialog auto-opens, pre-filled with the patient's
  preferred date / time window / reason
         │
         ├─ Admin saves reschedule
         │     → change request marked "rescheduled, awaiting SMS"
         │     → dashboard row updates: badge changes to
         │       "Rescheduled – send SMS", Open button now says
         │       "Send SMS confirmation"
         │
         └─ Admin sends SMS confirmation (from dialog or dashboard)
               → change request marked "resolved"
               → row disappears from action list
```

## Changes

### 1. Track two-stage progress on the request

Add two columns to `appointment_change_requests`:
- `new_appointment_id uuid` — the appointment created by the reschedule
- `sms_sent_at timestamptz` — when the confirmation SMS was successfully sent

Extend the status flow: `pending → rescheduled_pending_sms → resolved` (existing `dismissed` unchanged). We keep the request visible in the action list until it reaches `resolved`.

### 2. Dashboard action item

`src/components/admin/DashboardActionsPanel.tsx`
- "Open" for a `pending` request → `/admin/appointments/:id?rescheduleRequestId=<id>` (deep-links straight into the reschedule dialog).
- For `rescheduled_pending_sms`, render the row with a different secondary label ("Rescheduled – SMS not sent") and a primary "Send SMS confirmation" button that calls the reschedule SMS hook against the new appointment, then marks the request resolved.
- Manual Done/Dismiss remain as fallbacks.

### 3. Deep link + auto-open on Appointment Detail

`src/pages/admin/AppointmentDetail.tsx`
- Read `rescheduleRequestId` from the query string.
- If present, auto-open `RescheduleDialog` and pass the request through so its `preferred_date`, `preferred_time_window`, and `reason` pre-fill the dialog fields.

### 4. RescheduleDialog – split reschedule from SMS

`src/components/admin/RescheduleDialog.tsx`
- Accept optional `changeRequest` prop.
- Pre-fill date/time/reason from the request when provided.
- Stop auto-sending the SMS on save. Instead:
  1. Save reschedule.
  2. If a `changeRequest` was provided, update it to `rescheduled_pending_sms` with `new_appointment_id` set.
  3. Show a follow-up step in the same dialog: "Send SMS confirmation to patient" button (primary), plus "I'll send it later" (closes dialog, leaves action item in `rescheduled_pending_sms`).
  4. On successful SMS send, stamp `sms_sent_at` and mark the request `resolved` (which removes it from the dashboard automatically via the existing realtime invalidation).

This makes the SMS an explicit, tracked action so a second admin can always see whether it was sent.

### 5. Hook updates

`src/hooks/useAppointmentChangeRequests.ts`
- Extend `usePendingChangeRequests` to return both `pending` and `rescheduled_pending_sms` rows (single query, `status in (...)`).
- Add `useMarkRequestRescheduled({ id, new_appointment_id })` and `useMarkRequestSmsSent({ id })` mutations. Keep `useResolveChangeRequest` for manual Done/Dismiss.

## Assumptions

- The SMS should become an explicit admin click (today `RescheduleDialog` auto-sends it). This is what enables reliable tracking; if you'd rather keep auto-send, the two-stage tracking collapses into one and the "Send SMS" follow-up step is skipped.
- No schema changes to `appointments` — reschedule already creates a new appointment via `useRescheduleAppointment`; we simply record its id on the change request.
