# Calendar Bug Fixes — Full Review

A code review of `AdminAppointments.tsx`, `AppointmentQuickEditDialog.tsx`, and `RescheduleDialog.tsx` surfaced four real bugs plus a couple of related issues. Here is what's broken, why, and how each will be fixed.

---

## Bug 1 — Red "now" line shows on every chair row

**Cause:** The current layout stacks one chair-row per chair, each row is a full 12-hour-tall droppable cell, and each cell renders its own `NowLine`. So if there are 3 chairs, the now-line is drawn 3 times (once per row), one above the other.

**Fix:** Move the now-line out of `DroppableCell` and render it **once per day column**, as an overlay that spans the full height of all chair rows for that day. Use a single absolutely-positioned wrapper around the whole day column.

---

## Bug 2 — Clicking an empty slot opens the edit modal of a nearby appointment

**Cause:** `DraggableEvent` wraps `CalendarEventCard` in a zero-sized wrapper div that holds the `onClick`, while the card itself is `position: absolute`. The wrapper has no size, but its `onClick` listener still fires for any bubbled click coming from the absolutely-positioned card. Worse — dnd-kit's `useDraggable` listeners on the empty wrapper sometimes intercept clicks across the whole droppable region depending on pointer activation, so clicks land on the wrapper and open the wrong modal.

**Fix:**
1. Move `setNodeRef`, `listeners`, `attributes`, and `onClick` directly onto the `CalendarEventCard` (the absolutely-positioned element). Drop the empty wrapper.
2. Use dnd-kit's recommended pattern: track pointer-down vs pointer-up positions; only treat as a click when delta < 4px AND `isDragging === false`.
3. Stop propagation on the card's pointerdown so the underlying cell never receives it.
4. In `DroppableCell.handleSlotClick`, replace the brittle `e.target !== e.currentTarget` check with a positive check that the click landed on the cell's background layer (use a dedicated child `<div>` as the click surface with `data-slot-bg` and check that attribute).

---

## Bug 3 — Drag-and-drop doesn't work

**Cause (same root as Bug 2):** dnd-kit listeners are attached to the zero-sized wrapper, so the pointer rarely lands on the draggable surface. When it does start, the activation distance of 6px combined with the wrapper's lack of a layout box means the drag aborts immediately.

**Fix:** Once `setNodeRef`/`listeners` move onto the actual card (Bug 2 fix), drag will activate from the visible card. Also:
- Add `touch-action: none` to the card so touch drags don't scroll the page.
- Use `transform` from `useDraggable` so the card visually follows the pointer during drag (currently the card stays put because the transform is never applied).
- Keep the existing `DragOverlay` so the user sees a clean drag preview.

---

## Bug 4 — Reschedule (new date + new time) silently fails

**Causes:**
1. `RescheduleDialog` initializes `newChairId` to `appointment.chair_id || ""`. The `<Select>` uses `value={newChairId || "none"}`, but writes back the original empty string. If the user never touches the chair field, the insert sends `chair_id: null` (because `newChairId || null`) — fine. But if the original appointment had no chair, the Select shows "No chair" and never stores a real value. Not the main issue.
2. `useRescheduleAppointment` updates the original row to `status: "rescheduled"` then inserts a new row. The new row inherits a unique constraint conflict if `treatment_course_id` + `session_number` already exists (we have a uniqueness index on the courses table). The insert fails silently in the toast handler (only `console.error`).
3. The Calendar `disabled={(date) => date < new Date()}` blocks today's date entirely (because `new Date()` is later today), so picking "today" is impossible. Users hitting this assume the picker is broken.
4. The dialog's `onOpenChange` from inside `AppointmentQuickEditDialog` closes the parent edit modal before the reschedule mutation resolves, hiding error toasts behind a closed UI.

**Fix:**
1. Compare dates by start-of-day in the `disabled` predicate so today is selectable.
2. In `useRescheduleAppointment`, surface insert errors clearly and avoid touching `session_number` if it would collide — instead just carry the original session number and let the original row keep it (the rescheduled row gets `null` to avoid the unique conflict, since the original is preserved with status `rescheduled`).
3. Don't auto-close the parent edit dialog when the reschedule dialog closes; close only on success.
4. Add a Sonner error toast that includes the underlying Postgres message for visibility.

---

## Bonus issues caught during review

- **Quick-edit "Save" doesn't refresh the calendar position** because the optimistic cache in `useUpdateAppointment` doesn't merge new start/end into the cached list. Add a small optimistic update mirroring `useMoveAppointment`.
- **`AppointmentQuickCreateDialog` ignores the time the user clicked** — it uses `format(defaultDate, "HH:mm")` correctly, but then the `time` Select shows the closest preset which may snap to "09:00" if the click resolved to e.g. 09:07. Round the `defaultDate` to the nearest 30-min slot before seeding `time`.
- **`useAppointments` filter `lte("scheduled_start", endDate)`** misses appointments that start before `endDate` but spill across midnight. Switch to `lt("scheduled_start", endOfDay(endDate))` so end-of-week appointments render in the week view.

---

## Files to edit

- `src/pages/admin/AdminAppointments.tsx` — restructure now-line, fix `DraggableEvent`/`DroppableCell` event handling, add transform.
- `src/components/admin/AppointmentQuickEditDialog.tsx` — don't auto-close parent on reschedule open.
- `src/components/admin/RescheduleDialog.tsx` — fix today-disabled bug, error toasts, chair default.
- `src/hooks/useAppointments.ts` — optimistic update in `useUpdateAppointment`, surface errors in `useRescheduleAppointment`, widen date range query.

No new dependencies, no DB migrations.

---

## Technical summary (for engineers)

```text
DraggableEvent (before)
  <div ref> ← 0×0, has onClick + dnd listeners
    <CalendarEventCard absolute />   ← visible, no handlers

DraggableEvent (after)
  <CalendarEventCard absolute ref onClick {...listeners} />  ← single node
```

Click vs drag disambiguation:
```ts
const downRef = useRef<{x:number,y:number}|null>(null);
onPointerDown = e => { downRef.current = {x:e.clientX,y:e.clientY}; }
onClick = e => {
  const d = downRef.current;
  if (!d) return;
  const moved = Math.hypot(e.clientX-d.x, e.clientY-d.y);
  if (moved < 4 && !isDragging) onEdit();
}
```

Now-line refactor:
```text
DayColumn
 ├─ <NowLine /> (absolute, spans full chair-stack height)
 └─ for chair in chairs:
      <DroppableCell />   ← no NowLine
```
