
## Make the Appointments calendar a real scheduling cockpit

Today the calendar is read-only: clicking an event navigates away to a separate edit page. We'll turn it into the kind of "all-singing, all-dancing" calendar Gail expects — click for a quick-edit modal, drag to reschedule, drop into a different chair, and richer at-a-glance info on each card.

### What Gail will be able to do

1. **Click a card → Quick-Edit modal opens in place.**
   - Patient name + treatment header (links to full patient/appointment page if she wants the deep view).
   - Inline-editable: status, chair, assigned nurse, start time, duration, notes.
   - Buttons: **Save**, **Reschedule** (opens existing `RescheduleDialog`), **Cancel appointment**, **Open full page**.
   - Close without saving = no change.

2. **Drag an event to a new time slot** (same chair lane) → confirms via toast and saves.
3. **Drag an event to a different chair row / different day column** → same flow, updates `chair_id` and `scheduled_start` together.
4. **Click an empty slot** → opens a "New appointment" modal pre-filled with that day/time/chair (instead of going to the `/admin/appointments/new` page for every booking). Big "Open full form" button for complex cases.
5. **Resize handle at the bottom of each card** → drag to change duration.

### Toolbar upgrades

- **View switcher:** Day / Week / **Month** (new month grid showing per-day appointment counts + dots per chair).
- **Filters** (popover): by chair, by appointment type, by nurse, by status. Multi-select chips, persisted in URL.
- **"Today" highlight** stays; add a small **Jump to date** popover (calendar icon).
- **Density toggle:** Compact / Comfortable (changes `64px per hour` → `48` or `80`).
- **Legend:** small inline legend of status colours + appointment-type colours.

### Card visual upgrades

- Coloured left border = appointment type, background tint = status.
- Show: patient name, type, time range (e.g. `10:00 – 11:30`), session number badge if part of a course (`#2 of 6`), chair name only in day-view, small icons for `nurse assigned`, `consent missing`, `no-show risk` (last visit cancelled).
- Hover → tooltip with full notes preview.
- "Now" line: a thin red horizontal line at current time on today's column.

### Conflict + safety

- Drag-drop calls `useCheckConflicts` (already exists) before commit. If conflict → toast "Chair X is busy from 10:00–11:00" and snap back.
- Past-time drops blocked with an inline confirm ("Schedule in the past?") to avoid fat-finger errors.
- Optimistic update on the calendar so it feels instant; rollback on error.

### Layout sketch

```text
┌─────────────────────────────────────────────────────────────────┐
│  ◀ Today ▶   📅 Jump to date   Apr 27 – May 3, 2026             │
│  [Day|Week|Month]  Filters ▾  Density ▾  Legend ▾  + New        │
├─────┬───────┬───────┬───────┬───────┬───────┬───────┬───────────┤
│Chair│ Mon27 │ Tue28 │ Wed29 │ Thu30 │ Fri 1 │ Sat 2 │ Sun 3     │
├─────┼───────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│  1  │       │ ┃Hawk │       │       │       │       │           │
│     │       │ ┃ Iron│       │       │       │       │           │
│     │       │ ┃#2/6 │       │       │       │       │           │
├─────┼───────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│  2  │       │       │       │       │       │       │           │
└─────┴───────┴───────┴───────┴───────┴───────┴───────┴───────────┘

  Click card → Quick Edit modal
  Drag card  → Reschedule (with conflict check)
  Click slot → New appointment modal
```

### Technical changes

| File | Change |
|------|--------|
| `src/pages/admin/AdminAppointments.tsx` | Major refactor — toolbar, filters state (URL-synced via `useSearchParams`), density, month view, "now" line, click-slot handler, click-card handler that opens modal instead of navigating. |
| `src/components/admin/AppointmentQuickEditDialog.tsx` *(new)* | Modal with inline edit fields. Uses `useUpdateAppointment` for save, `useDeleteAppointment` for cancel, and re-uses `RescheduleDialog`. |
| `src/components/admin/AppointmentQuickCreateDialog.tsx` *(new)* | Lightweight create modal (patient picker + type + duration + notes), pre-filled from clicked slot. Falls through to `/admin/appointments/new` for power-user flow. |
| `src/components/admin/CalendarEventCard.tsx` *(new)* | Reusable card with status/type colours, session badge, icons, tooltip — used in both week and month views. |
| `src/components/admin/CalendarMonthView.tsx` *(new)* | Month grid showing per-day appointment count + colour dots + click-to-zoom-into-day. |
| `src/hooks/useAppointments.ts` | Add `useMoveAppointment` mutation that updates `chair_id` + `scheduled_start` + `scheduled_end` together with optimistic cache update. |
| `package.json` | Add `@dnd-kit/core` + `@dnd-kit/utilities` for drag-drop (matches Lovable stack — no React-DnD). |

### What stays the same

- Backing tables (`appointments`, `appointment_types`, `treatment_chairs`) and RLS — no schema changes.
- `RescheduleDialog`, `RecurringSessionDialog`, `useCheckConflicts` are reused as-is.
- Existing detail page at `/admin/appointments/:id` remains for deep-linking and complex edits.

### Out of scope (can be follow-ups)

- Nurse-lane view (group by nurse instead of chair) — easy to add once filters land.
- Patient-side iCal feed.
- Recurring-rule editing from the calendar (still done from the patient's course tab).

