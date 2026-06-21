## What's happening

In the appointment edit modal, the white dialog box (header + close X) is rendering at its usual `max-w-lg` (~512px) width, but the two-column form grid and footer buttons are spilling out to the right onto the dark backdrop. The "Full page" link, "Delete" button, "Close" and "Save changes" buttons all sit outside the white card.

Root cause: `DialogContent` is a CSS `grid` container, and `AppointmentQuickEditDialog` puts a `grid grid-cols-2 gap-4` child inside it. The nested grid's columns default to `minmax(auto, 1fr)`, so wide children (selects with long option text, the date popover trigger, etc.) force the column tracks past the parent's `max-w-lg`, overflowing the white background. Same effect on the footer row.

## Fix

Single file: `src/components/admin/AppointmentQuickEditDialog.tsx`

1. Widen the dialog and let it scroll on short viewports:
   - Change `DialogContent` className from `max-w-lg` to `max-w-2xl max-h-[90vh] overflow-y-auto`.

2. Make the form grid responsive and prevent track overflow:
   - Change `grid grid-cols-2 gap-4` to `grid grid-cols-1 gap-4 sm:grid-cols-2`.
   - Wrap each field cell so its select/input cannot push the column wider than the track — apply `min-w-0` on each of the six `space-y-2` field wrappers (Date, Time, Duration, Status, Chair, Assigned nurse).

3. Stop the footer from overflowing:
   - On the `DialogFooter`, keep the existing flex layout but add `flex-wrap` and `gap-2` so action buttons wrap to a second row instead of spilling out.
   - On the inner left-side action group (Mark arrived / Reschedule / Send portal login / Delete), add `flex-wrap` so those four buttons wrap on narrower widths.

4. Make the header row also wrap safely:
   - On the header `flex items-start justify-between gap-4` row, add `flex-wrap` so the "Full page" button drops below the title block instead of being pushed off the card on narrow widths.

## Out of scope

- No changes to `dialog.tsx` (the shared primitive stays as-is to avoid affecting other modals).
- No changes to behavior, data flow, or the Send-portal-login / Reschedule sub-dialogs.
- No changes to `AppointmentQuickCreateDialog` — its overflow fix already shipped in the previous turn.

## Verification

After the edit, open an appointment from `/admin/appointments`, confirm at 1242px viewport that:
- All form fields sit inside the white dialog card.
- Footer buttons all fit (or wrap cleanly) inside the card.
- "Full page" link is inside the header on the right.
