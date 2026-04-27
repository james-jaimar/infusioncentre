## Make scheduled sessions individually editable before booking

Right now `RecurringSessionDialog` auto-generates a tidy preview (e.g. weekly Mondays at 9am) and Gail has only one button: **Create N Appointments**. Real life is messier — a patient might want session 2 a day later, session 3 in the afternoon, etc. This change turns the static preview into an editable list.

### Behaviour

1. **Suggestion stays the same.** Pick start date + frequency + time → the dialog still seeds the same N suggested slots. This is the "starting point" Gail confirms with the patient on the phone.

2. **Each suggested slot becomes editable.** The preview area changes from read-only badges to a tidy list of rows. Each row shows:
   - Session number (`#1`, `#2`, …)
   - A **date picker** (popover calendar, same control as the Start Date field)
   - A **time picker** (same 30-min select as the Time field)
   - A small **Remove** (trash) icon button on the right

3. **Add another session** button under the list — appends a new row defaulted to "1 week after the last one, same time", which Gail can then adjust.

4. **Re-seed safely.** If Gail changes Start Date / Frequency / Preferred Day / Time / Sessions-to-schedule **after** she's manually tweaked rows, show a small inline notice: *"You've customised some sessions. Regenerate from new settings?"* with a **Regenerate** button. This avoids silently wiping her edits.

5. **Validation before submit.**
   - Each row must have a date and a time (both already required by the controls).
   - Warn (non-blocking, amber text) if any two rows are on the same date — clinics occasionally do this deliberately, so don't block.
   - Block submit (red text) if any row is in the past.
   - Re-sort rows chronologically right before submit so session numbers stay in order.

6. **Submit** uses the edited list verbatim — same `createBulk.mutateAsync` call, just sourced from the editable state instead of the recomputed `generateDates()`.

### Layout sketch

```text
Preview (4 sessions)                         [Regenerate from settings]

#1   [📅 Tue, Apr 28, 2026  ▾]   [🕘 9:00 AM ▾]   🗑
#2   [📅 Tue, May  5, 2026  ▾]   [🕘 9:00 AM ▾]   🗑
#3   [📅 Wed, May 13, 2026  ▾]   [🕘 2:30 PM ▾]   🗑   ← edited
#4   [📅 Tue, May 19, 2026  ▾]   [🕘 9:00 AM ▾]   🗑

[+ Add another session]
```

The list scrolls inside the existing `max-h-48` preview region (bumped to `max-h-72` to fit the controls comfortably).

### Technical changes (single file)

**`src/components/admin/RecurringSessionDialog.tsx`**

- Replace the derived `previewDates` with a `useState<Date[]>` called `sessionDates`, plus `customised: boolean` flag.
- A `useEffect` on `[startDate, frequency, preferredDay, secondDay, time, numSessions]` regenerates `sessionDates` **only when `customised` is false**. First time the user edits a row → set `customised = true`.
- New small subcomponent (inline) renders each row: `Popover` + `Calendar` for date, existing `Select` + `TIME_SLOTS` for time, `Button variant="ghost" size="icon"` with `Trash2` for remove.
- "Add another session" button appends `addWeeks(last, 1)` at the same time-of-day as the last row.
- "Regenerate from settings" pill button (only visible when `customised` is true) re-runs `generateDates()` and clears the flag.
- Submit handler sorts `sessionDates` chronologically, recomputes `session_number` as `sessions_completed + index + 1`, and passes them to `createBulk.mutateAsync` exactly as today.
- No schema, no hook, no other UI changes.

### What stays the same
- Frequency presets, chair/nurse selection, ongoing-vs-fixed-course logic, the `useCreateBulkAppointments` mutation, toast messages.
- The dialog still feels one-click-fast for the common "yes, weekly Mondays is fine" case — Gail just hits **Create** without touching any row.
