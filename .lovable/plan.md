## Goal

Make the appointment scheduler the daily working calendar for the clinic: one default view, one density, an extra "Treatment Room" column alongside the IV chairs, and a modal-first interaction model so busy nurses never lose their place.

## Changes

### 1. Add "Treatment Room" as a 5th resource column

The `treatment_chairs` table is just `{ name, display_order, is_active }` — no chair vs. room type field. The simplest, least invasive move is to add a 5th row called "Treatment Room" with `display_order = 5`. It will appear automatically as the rightmost column in the Day view and as a selectable resource everywhere chairs are already used (quick-create dialog, appointment edit, Command Centre chair panel).

If, later, the clinic wants to visually distinguish IV chairs from the room (e.g. a different header color or filter), we can add a `kind` column then — out of scope for now.

Migration: one `INSERT` into `treatment_chairs`.

### 2. Default to Day view, drop the density toggle

- `AdminAppointments.tsx` currently reads `view` from the URL and falls back to whatever the prior default was. Change the fallback to `day` and update the page so landing on `/admin/appointments` (no query string) lands on Day view.
- Remove the `density` toggle. Standardize on **comfortable** density — it gives roughly 64 px per 30-min slot, which is enough room for an hour-long appointment to show patient name + treatment type + a small status chip without truncation, and keeps tap targets large enough for tablet use.
- Verify the Day grid stays readable when the viewport narrows: 5 columns + the time gutter at 1024 px wide leaves ~190 px per column, which is the floor we'll design to. Below that (tablet portrait), horizontally scroll the grid rather than collapsing columns — losing a column would hide bookings.

### 3. Click an appointment block → details modal

Today, clicking an appointment in the Day grid opens the `AppointmentQuickEditDialog`. Audit what that dialog shows and bring it up to a proper "appointment details" modal:

- Header: patient name (link to patient file), treatment type, status pill.
- Body: scheduled start / end, chair/room, assigned nurse, contact phone (one-tap copy), notes.
- Actions: Mark Arrived, Reassign chair/room, Reschedule (opens date/time picker inline), Cancel appointment, Open full appointment page (escape hatch).
- The modal stays on the calendar — closing it returns the nurse to the same Day view scroll position. No sidebar navigation for routine appointment actions.

### 4. Quick-add patient flow polish

The inline "New patient" sub-form in `AppointmentQuickCreateDialog` already captures first name, last name, email, phone. Tighten the UX:

- When the dialog opens from an empty slot click, focus jumps to the patient search field; pressing "+ New patient" reveals the 4-field form with the first-name field auto-focused.
- After save, the dialog stays open and shows a success toast like "James Hawkins added — appointment booked for Tue 12:00". From there the nurse can click "Open patient file" (opens in a new tab so the calendar stays put) or just close.
- Phone field uses a phone-style input mask matching the existing patient form.

### 5. Modal-first interaction principle (applied here)

Across the appointments area, every routine action stays in a modal layered over the calendar. The only times we leave the calendar are: (a) opening a patient's full file, (b) opening the multi-step full appointment form for complex bookings (recurring sessions, multi-resource). Both open in a new tab so the calendar context survives.

## Out of scope

- Visual distinction between chairs and the treatment room (color band, icon).
- Tablet-portrait responsive collapse of columns.
- Recurring appointment UX, automated reminders.

## Technical notes

- Migration: `INSERT INTO public.treatment_chairs (name, display_order) VALUES ('Treatment Room', 5);` — idempotent via `ON CONFLICT DO NOTHING` after adding a unique constraint on `name`, or guarded with a `WHERE NOT EXISTS`.
- `AdminAppointments.tsx`: change default `view` to `'day'`; delete density state, `densityToggle` UI, and the `density` URL param; hard-code the row height that "comfortable" was using.
- `DayChairColumnsView` / `DayChairColumn`: no code changes needed — they already render whatever chairs come back from `useTreatmentChairs`.
- `AppointmentQuickEditDialog`: extend with the details layout above; add "Reschedule" inline date/time picker reusing `react-day-picker` per the project's date-selection convention.
- `AppointmentQuickCreateDialog`: focus management + post-save toast/CTA; reuse existing patient-create mutation.

## Build order

1. Migration to add Treatment Room.
2. Default to Day view + remove density toggle.
3. Click-to-open details modal (extend `AppointmentQuickEditDialog`).
4. Quick-add patient UX polish.
