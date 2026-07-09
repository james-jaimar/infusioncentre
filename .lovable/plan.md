I checked the live data and the code path instead of guessing.

What is actually happening:
- The SMS is being sent successfully and logged in `communication_log`.
- The two latest sends for this appointment are recorded as generic `related_entity_type = appointment`, not `appointment_reschedule`.
- The current open change request is still `status = pending`, with no `sms_sent_at` or `resolved_at`.
- The Quick Edit modal only marks the request resolved when the request is already `rescheduled_pending_sms`, so the button shown in your screenshot sends the SMS but does not update the request.
- The UI also does not show SMS send history beside the appointment notes, even though the backend has the log rows.

Plan:

1. Make the Quick Edit SMS button request-aware
- If an appointment has any open reschedule request (`pending` or `rescheduled_pending_sms`), the button should send the reschedule SMS template, not the generic reminder SMS.
- After a successful send, mark the change request resolved with `sms_sent_at`, `resolved_at`, and `resolved_by`.
- This covers the exact flow in the screenshot, where the request is still `pending`.

2. Fix the reschedule dialog handoff
- When a reschedule is saved, ensure the request is updated against the same appointment id.
- If the admin sends SMS from the reschedule dialog, mark the same request resolved immediately.
- Avoid relying on `new_appointment_id`, because this app now moves the same appointment row rather than creating a duplicate appointment.

3. Add visible SMS tracing in the appointment modal
- Query recent SMS log entries for the appointment from `communication_log`.
- Show a compact “SMS history” row in the Quick Edit dialog, for example: “SMS sent today 19:14 · reschedule confirmation”.
- Show failed sends too, with the error where available.
- This gives Gail/admins visible proof without opening backend logs.

4. Clean up dashboard/action item state
- Ensure dashboard and calendar badges use `appointment_id` for open requests.
- Once `sms_sent_at` is written, the action item should disappear for all admins after query invalidation/realtime refresh.

5. Verify against real data
- Re-check `appointment_change_requests` and `communication_log` after the code path is changed.
- Confirm the modal changes from “needs SMS” to a visible sent/audit state after the send succeeds.