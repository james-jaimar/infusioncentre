## What's wrong today

1. The quick-create dialog books an `appointment` but never creates / attaches a `treatment_course`. So the new patient lands in the system with:
   - No active course on their file
   - No onboarding checklist to drive the portal invite
   - Appointment shows under "Appointments" but the patient page looks empty under Treatment Courses
2. The dialog itself overflows: `DialogContent` defaults to `max-w-lg` without `max-h` or `overflow-y-auto`, so on shorter viewports (or after the success panel renders) the inner cards spill past the modal edge and a stray scrollbar appears inside the "Next step" box.

## Plan

### 1. Auto-create a treatment course on quick-book

In `AppointmentQuickCreateDialog.tsx`, after `create.mutateAsync` succeeds:

- Look up an existing **active** course for this patient + selected appointment type (`useTreatmentCoursesByPatient`).
- If none exists, call `useCreateTreatmentCourse` with:
  - `patient_id`
  - `treatment_type_id` = the appointment type the receptionist picked
  - `total_sessions_planned: 1` (sensible default — admin can edit later)
  - `notes: "Auto-created from front-desk booking"`
  - Status will default to `draft`.
- Patch the just-created appointment with that `treatment_course_id` so the session shows up under the course.

This makes the existing "Send portal login" → onboarding flow meaningful because the patient now has a course to generate a checklist against.

Order of operations inside `handleCreate`:

```text
1. create appointment (as today)
2. find-or-create draft treatment_course for (patient, type)
3. update appointment.treatment_course_id
4. show success panel
```

If step 2 or 3 fails, we still keep the appointment (don't roll back) but surface a soft warning toast: "Appointment booked — couldn't link a treatment course, please attach manually."

### 2. Surface the course on the success panel

The success panel gets one extra line above the "Next step" card:

```text
Linked to: <Treatment type name> course (draft)
```

…with a small "Open course" link (new tab) for power users who want to set the real session count straight away.

### 3. Fix the modal overflow

Two small, contained changes — no changes to the shared `dialog.tsx`:

- Switch `DialogContent` in this file to `className="max-w-lg max-h-[90vh] overflow-y-auto"` for the create form, and `max-w-md max-h-[90vh] overflow-y-auto` for the success view.
- Replace the `grid grid-cols-2` block with `grid sm:grid-cols-2` so it stacks below the `sm` breakpoint instead of forcing a 2-col layout that clips on narrow widths.
- Remove the stray scrollbar from the success "Next step" card by dropping the implicit height — it's caused by the parent `grid gap-4` plus a too-tight `DialogContent`. Once `max-h-[90vh]` is on the content, the inner card sizes naturally.

### 4. Out of scope (call out, don't build)

- Wiring the **course template / session count** picker into the quick-add flow — keep that to the full "New course" page on the patient file.
- Re-working the portal onboarding wizard itself.
- Touching the `AppointmentQuickEditDialog` "Send portal login" button (already works once a course exists).

## Files touched

- `src/components/admin/AppointmentQuickCreateDialog.tsx` — course wiring + responsive grid + modal sizing
- `src/hooks/useAppointments.ts` — small `useUpdateAppointment` patch helper if not already present (likely already there; verify before adding)

## Acceptance checks

- Quick-add a brand-new patient + book → open the patient file → a draft course of the matching type appears under Treatment Courses, with the booked appointment listed under it.
- Open the booked appointment → it shows the linked course.
- The create modal no longer clips its inner cards at 1280×720; the success modal has no inner scrollbar.
