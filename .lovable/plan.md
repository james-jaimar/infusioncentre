## Goal

Close the loop on Nicole's quick-booking flow so an admin can, without leaving the calendar:
1. Quick-add a patient (already works)
2. Book the appointment (already works)
3. Immediately create + send the patient portal login from the same place
4. Find the same "Send portal login" action on every existing appointment, in case the invite wasn't sent at booking time

The existing pieces are all there — `AppointmentQuickCreateDialog` already supports inline new-patient creation, `AppointmentQuickEditDialog` already has Mark Arrived + chair reassignment, and `SendInviteDialog` already generates and emails the portal invite. They're just not wired together.

## Changes

### 1. Post-create "Send portal login" prompt (quick-create dialog)

In `src/components/admin/AppointmentQuickCreateDialog.tsx`, after `create.mutateAsync` succeeds:

- Keep a small piece of local state for the freshly-created appointment (patient name, id, email, phone).
- Instead of immediately closing the dialog, swap the dialog body to a "Booked" success panel:
  - Confirmation line: "James Hawkins booked for Tue 12 Aug, 10:00 — Chair 2"
  - Primary button: **Send portal login** → opens `SendInviteDialog` pre-filled with the patient's email/phone.
  - Secondary buttons: **Open patient file** (new tab), **Done**.
- If the patient has no email on file (typical for quick-added patients without an address), show an inline email input above the Send button so the admin can type the address Nicole was given over the phone and send straight away.

### 2. "Send portal login" action on existing appointments (quick-edit dialog)

In `src/components/admin/AppointmentQuickEditDialog.tsx`, add a **Send portal login** button to the footer action row (next to Mark arrived / Reschedule). It opens the same `SendInviteDialog` for that appointment's patient. Hide it when the patient already has an accepted invite (we can derive this lightly from `patient_invites` via the existing hook).

### 3. Light reuse refactor of `SendInviteDialog`

`SendInviteDialog` currently renders its own trigger button. To use it from inside another dialog, split it so the trigger is optional:
- Add a `controlled` mode: accept `open` + `onOpenChange` props; when provided, render without the internal `DialogTrigger`.
- Existing call sites (patient detail page) keep working unchanged.

### 4. UX polish

- Success toast on booking now reads "Appointment booked — send portal login?" with the inline CTA above, instead of just "Appointment created".
- After invite send completes, show: "Portal login emailed to {email}. Patient can now complete their forms." and auto-close the quick-create dialog.

## Out of scope

- WhatsApp/SMS sending of the invite link (email only for now, matching current `send-patient-invite` edge function).
- Bulk-sending invites for already-booked patients.
- Any change to the arrival → chair-assignment flow (already implemented).
- Any change to forms themselves.

## Build order

1. Refactor `SendInviteDialog` to support controlled open/close.
2. Add post-booking success panel + Send portal login flow to `AppointmentQuickCreateDialog`.
3. Add Send portal login button to `AppointmentQuickEditDialog`.
