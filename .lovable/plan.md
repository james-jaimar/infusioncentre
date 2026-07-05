## Goal

From Gayle's dashboard, clicking any row in **Today's Appointments** or **Tomorrow's Appointments** should take her straight into the calendar (`/admin/appointments`) on the correct day, with the quick-edit modal for that appointment already open — so she can immediately resend an SMS, reschedule, mark arrived, etc., without a second click.

This keeps the calendar as the single "everything appointments" surface and turns the dashboard panels into a true action list.

## Changes

1. **`src/pages/admin/AdminDashboard.tsx`** — change the appointment row link
   - Today it links to `/admin/appointments/{id}` (the full detail page).
   - Change it to `/admin/appointments?view=day&date=YYYY-MM-DD&apt={id}` where `date` is the appointment's scheduled day.
   - Keep the row's visual design; only the destination changes.

2. **`src/pages/admin/AdminAppointments.tsx`** — honour the new query param
   - It already reads `view` via `useSearchParams` and holds `editingApt` state for the quick-edit modal.
   - Add a `date` param handler: if present, set `currentDate` to that day.
   - Add an `apt` param handler: once the day's appointments are loaded, find the matching appointment and call `setEditingApt(...)`. Then strip `apt` (and `date`) from the URL via `setSearchParams` so a manual refresh doesn't keep re-opening the modal, and closing the modal doesn't leave stale params behind.
   - If the ID isn't found in the current fetch (e.g. filters exclude it), fall back to a `toast` and skip — no crash.

3. **No changes** to `AppointmentQuickEditDialog`, the detail page, or any data hooks. The detail page (`/admin/appointments/:id`) stays available for the "Full page" link inside the modal and for anyone with a bookmarked URL.

## UX notes

- Row click → calendar in Day view, jumped to the right date, modal open. One click, no extra navigation.
- The modal already exposes: reschedule, send SMS confirmation, mark arrived, send portal login, edit chair/nurse/status/notes, delete, and a "Full page" escape hatch. That covers the actions Gayle takes on an awaiting/late appointment.
- Because we scrub `?apt=...` after opening, browser back from the modal returns her to the dashboard naturally and the calendar URL stays clean.

## Out of scope (happy to tackle next, just flagging)

- Grouping the dashboard panel by status ("2 awaiting confirmation" pinned to the top as an action bucket).
- Adding a compact status filter on the dashboard panels themselves.
- Retiring or slimming `/admin/appointments/:id` — worth a separate conversation once we see whether the modal covers ~everything Gayle needs day-to-day.
