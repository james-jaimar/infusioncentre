
## Goal

Keep a patient's Onboarding tab in sync with the appointments booked for them, based on each appointment type's required forms — without ever duplicating a form or wiping one the patient has already completed.

## Current behaviour

- New patients get onboarding items only from the `create_onboarding_from_course` trigger (fires when a treatment course is created), plus a few "universal" templates.
- Booking or deleting an appointment does **not** touch `onboarding_checklists` at all.
- `form_templates.required_for_treatment_types` already stores the appointment-type IDs each form is required for — so the mapping we need is already there.

## What to build

Two database triggers on `public.appointments` that keep `onboarding_checklists` aligned with the patient's *pending* appointments. Doing this in the database (not the client) guarantees it fires no matter where the appointment is created or deleted from — Quick Create dialog, Recurring dialog, calendar drag-clone, admin backfill, etc.

### 1. After INSERT on appointments — add missing forms

For the appointment's `appointment_type_id`, find every active `form_templates` row where that ID is in `required_for_treatment_types`, and insert a `pending` row into `onboarding_checklists` for `(patient_id, form_template_id)` **only if** no row already exists for that pair (any status). This is the "don't add if already there" rule and also protects completed forms from being reset.

### 2. After DELETE on appointments — remove now-orphaned forms

For the deleted appointment's `(patient_id, appointment_type_id)`:

1. Find the set of form templates that were required *because of* this appointment type.
2. For each of those templates, check whether the patient still has **another** appointment (any status other than the one just deleted) whose type also requires the same template. If yes → keep the checklist item.
3. If no other appointment justifies it, delete the checklist row **only when** its `status` is still `pending` (never touch `completed`, `in_progress`, or anything with a `form_submission_id`). Universal templates (`required_for_treatment_types IS NULL`) are never removed — they belong to the patient regardless of appointments.

The user's phrasing "if it has not been fulfilled and has been deleted" maps directly to: only prune checklist items that are still pending.

### 3. No change on UPDATE

Changing an appointment's time/chair/nurse doesn't affect required forms. If an admin edits the *appointment type* of an existing appointment we can leave that as a follow-up — it's rare and can be handled by delete+recreate; flag if you want it in scope.

## Client-side follow-ups

- After `useCreateAppointment` / `useDeleteAppointment` succeed, invalidate `["onboarding_checklists", patientId]` and `["form_submissions_readiness", patientId]` so the Onboarding tab and the "Start Treatment" readiness gate refresh without a manual reload.
- No UI changes needed — the existing Onboarding tab already renders whatever is in `onboarding_checklists`.

## Out of scope (call out if you want them included)

- Backfilling onboarding items for appointments that already exist today.
- Handling appointment-type changes on an existing appointment.
- Removing forms when an appointment is *cancelled* rather than deleted (currently only hard deletes prune).

## Technical notes

- Both triggers are `SECURITY DEFINER` with `SET search_path = public`, matching the existing `create_onboarding_from_course` / `auto_generate_onboarding_checklist` pattern.
- Insert uses `ON CONFLICT DO NOTHING` against a partial unique index on `(patient_id, form_template_id)` (add the index if one doesn't already exist) to make the "no duplicates" guarantee race-safe.
- Delete uses a `NOT EXISTS` subquery over sibling appointments joined to `form_templates.required_for_treatment_types` via `= ANY(...)`.
