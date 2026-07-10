What I found:
- The latest SMS for the screenshot appointment was sent successfully, but its appointment row is now `status = confirmed` while `patient_confirmed_at` is still empty.
- That means the app is showing “confirmed” because the status was changed somewhere, not because the patient tapped Confirm.
- The patient confirmation page currently only shows accept/deny/reschedule actions when the appointment is not already confirmed; if `status = confirmed`, it hides the action buttons.
- Realtime is enabled for `appointments`, but the calendar can still show stale appointment objects because the open modal/page state is not being updated optimistically when an external confirmation happens.

Plan:

1. Make patient confirmation links action-based, not status-blocked
- Update the confirmation page so a patient can still see the appointment action choices unless the appointment is cancelled or already has `patient_confirmed_at`.
- Treat `patient_confirmed_at` as the real “patient tapped confirm” signal.
- Do not hide “Request new date” or “Cancel” just because an admin/manual status says `confirmed`.

2. Correct the confirm endpoint response
- Update `confirm-appointment` so after a patient confirms, the response returns the updated `status` and `patient_confirmed_at` state, not the stale pre-update appointment values.
- Ensure “already confirmed” only means `patient_confirmed_at` exists, not merely `status = confirmed`.

3. Prevent manual SMS send from marking patient-confirmed
- Audit the Quick Edit SMS send path so sending an SMS only logs/traces the SMS and clears reschedule follow-up where appropriate.
- It must not set the appointment into a patient-confirmed UX state or remove patient action choices from the SMS link.

4. Push calendar updates immediately
- Strengthen realtime invalidation for appointment updates and the selected/open appointment.
- Add a direct realtime update handler on the calendar appointments query so when `status` or `patient_confirmed_at` changes, the visible card updates without a manual refresh.
- Keep the existing query invalidation as a fallback.

5. Surface clearer calendar state
- Calendar badge should show “Confirmed” only when `patient_confirmed_at` is present.
- If status is manually `confirmed` but no patient tap exists, show a different admin-status badge or leave it as normal scheduled/confirmed status without implying patient confirmed.

6. Verify with live data
- Re-check the affected appointment row and recent SMS logs.
- Confirm the SMS link still offers Confirm / Request new date / Cancel when `patient_confirmed_at` is empty.
- Confirm that after the patient taps Confirm, the calendar updates without refresh and the card shows patient-confirmed state.