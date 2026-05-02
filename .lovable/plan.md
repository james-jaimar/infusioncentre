## Add a "List" view to the Appointments page

A fourth view mode on `/admin/appointments` that complements the calendar with a clean, scannable, sortable list — perfect for "what does today actually look like?" at a glance.

### Where it lives

In the existing view selector (currently `Day / Week / Month`) — add a new option **List**. Same toolbar, same date picker, same filters; only the body of the card changes.

```text
┌──────────────────────────────────────────────────────────────┐
│ ◀  Today  ▶   📅   Mon 4 May 2026          Filters  List ▾  │
├──────────────────────────────────────────────────────────────┤
│ Time   Patient            Treatment        Chair    Nurse   Status   ⋯ │
│ 08:30  James Hawkins      Iron Infusion    Chair 1  D. Patel In progress │
│ 09:00  Sarah Cole         Ketamine         Chair 2  —        Checked in │
│ 10:30  Mary O'Brien       Vitamin Drip     Chair 3  J. Lee   Confirmed  │
│ ...                                                                     │
└──────────────────────────────────────────────────────────────┘
```

### Behaviour

- **Range follows the toolbar.** List view of "Day" shows that day; switching to "Week" while in List shows the week's appointments grouped by date with sticky day headers. Default range when first opening List = today.
- **Columns:** Time (start–end), Patient, Treatment type (with the type's colour swatch), Chair, Nurse, Duration, Session # (e.g. `#3 of 6` chip when part of a course), Status pill.
- **Sort:** by Time (default, ascending), Patient, Chair, Treatment, Status. Click column headers to sort.
- **Same filters as calendar** (Chair / Treatment type / Status) apply automatically — no duplication.
- **Click a row** → opens the existing `AppointmentQuickEditDialog` (same as clicking a calendar block), so editing/assigning chair/nurse, rescheduling, etc. all works identically.
- **Quick search box** above the list to filter by patient name (handy when the list is long).
- **Empty state:** "No appointments for this range" with a "Schedule from patient" button.
- **Cancelled / no-show / rescheduled:** shown muted at the bottom (or hidden behind a "Show cancelled" toggle), matching how the calendar treats them.
- **Today highlight:** the current day's group header is highlighted; rows currently in progress get a soft accent.
- **Print-friendly:** the list view prints cleanly as the day's run-sheet (one CSS rule, no separate page).

### Why this helps Gail

- One screen, no scrolling chair-by-chair to piece the day together.
- Sortable by Time = a true run-sheet of the clinic.
- Sortable by Chair = same info as the calendar but linear.
- Print = paper backup at the front desk.
- Same click target → same edit dialog, so nothing new to learn.

### Technical notes

- New file: `src/components/admin/appointments/AppointmentsListView.tsx` — receives the already-filtered `appointments`, `chairs`, `types`, plus `onEdit(apt)`. Pure presentational; no data fetching of its own.
- `src/pages/admin/AdminAppointments.tsx`:
  - Extend `ViewMode` union: `"day" | "week" | "month" | "list"`.
  - Add `<SelectItem value="list">List</SelectItem>` to the existing view-mode `Select`.
  - In the body conditional, render `<AppointmentsListView ... />` when `viewMode === "list"`.
  - When `viewMode === "list"`, default `dateRange` derivation: if user hasn't picked Week explicitly, treat as a single day; otherwise honour the current week range. Simplest implementation: reuse current `dateRange` logic but force "day" semantics on first switch into List (preserve their range if they navigate).
  - `?view=list` round-trips through the existing `searchParams` sync.
- Uses `@/components/ui/table` (`Table`, `TableHeader`, `TableRow`, `TableCell`) — already in the project.
- Group-by-day rendering when the range spans multiple days: a sticky `<TableRow>` header per date.
- Sorting: local `useState<{ key, dir }>` inside the list component; sort with `date-fns` for time, locale compare for strings.
- Search: local `useState<string>`, simple `includes` on `${first_name} ${last_name}`.
- Print CSS: `@media print` rule in `src/index.css` (or scoped via a `print:` Tailwind utility on the list container) hides the toolbar & sidebar.

### Out of scope (can follow later)

- Drag-to-reschedule from the list (not natural in a list — calendar is the right place for that).
- CSV export of the list (easy follow-up if Gail wants to email the day's plan).
- Bulk actions (multi-select check-in, etc.).
