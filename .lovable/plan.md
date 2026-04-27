## Calendar stabilisation plan

This pass will simplify the appointment calendar back into a reliable scheduling board: view, edit, and move existing sessions only. New appointments will remain tied to the patient/treatment-course workflow.

### 1. Remove empty-slot appointment creation from the calendar
- Remove the “click empty slot to book” behaviour from the week/day grid.
- Remove the quick-create modal from the calendar page.
- Change the header guidance to reflect the real workflow: click an appointment to edit; drag appointments to move them.
- Replace the “New appointment” calendar button with a safe navigation action to the proper patient/treatment flow, such as Patients / Treatment Courses, rather than opening an ad-hoc appointment modal.
- Keep the existing patient/course scheduling tools intact, especially `Schedule Sessions` inside the patient’s Treatment Course tab.

### 2. Remove the red “now” line
- Delete the `NowLine` rendering entirely from the appointment calendar.
- Remove the related props and state from calendar cells.
- Keep today highlighting if useful, but no red horizontal line across the grid.

### 3. Fix rescheduling so it moves the original appointment instead of leaving a grey copy
- Change the reschedule action from “mark old appointment as rescheduled + insert a new appointment” to a direct update of the same appointment’s `scheduled_start`, `scheduled_end`, `chair_id`, and nurse/session metadata as needed.
- Keep the reschedule reason by writing it to `reschedule_reason` on the same appointment.
- Do not create `rescheduled_from_id` records for this UI flow.
- Hide any existing `rescheduled` appointments from the calendar by default so historical greyed-out records do not clutter Gail’s working schedule.

### 4. Fix drag-and-drop behaviour
- Remove the `DragOverlay` clone, because it is causing the “two representations” effect.
- Use the real appointment card as the only dragged visual element.
- Rework the draggable card structure so `useDraggable` is applied to the actual appointment card and the transform is applied consistently.
- Keep the click-vs-drag separation so a normal click opens the appointment modal, while a deliberate drag moves the appointment.
- Make drop calculation deterministic:
  - day comes from the target column,
  - chair comes from the target row,
  - time is calculated from the pointer/drop position and snapped to 30-minute slots,
  - duration stays unchanged.
- Keep conflict checks before saving and show a clear toast if the chair/time is occupied.

### 5. Tighten appointment filtering and cache updates
- Exclude `cancelled`, `no_show`, and `rescheduled` from drag conflict checks where appropriate.
- Keep completed appointments visible unless filtered out, but only active/upcoming statuses should be draggable if that is safer.
- Ensure the appointment query and optimistic cache update keep the visible card in the new slot immediately after a successful drag or reschedule.

### 6. Validation after implementation
- Run TypeScript/build checks.
- Review the calendar code path for the four reported regressions:
  1. no red line,
  2. empty grid clicks do nothing,
  3. reschedule leaves only the new slot,
  4. drag shows one card and persists the move.

## Main files to change
- `src/pages/admin/AdminAppointments.tsx`
- `src/hooks/useAppointments.ts`
- `src/components/admin/RescheduleDialog.tsx`
- `src/components/admin/AppointmentQuickEditDialog.tsx`
- Potentially remove or stop using `src/components/admin/AppointmentQuickCreateDialog.tsx`

## Technical notes
- The current grey leftover is caused by `useRescheduleAppointment()` inserting a new row and setting the old one to `status = 'rescheduled'`.
- The current double-drag visual is caused by rendering both the transformed source card and a `DragOverlay` clone.
- The empty-slot create behaviour is caused by `DroppableCell` calling `onSlotClick`, which sets `createSlot` and opens `AppointmentQuickCreateDialog`.