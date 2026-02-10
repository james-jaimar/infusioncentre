
# Fix: End-to-End Clinical Workflow Linkage

## Issues Identified

After tracing the entire patient journey from appointment creation through to discharge, here are the problems found:

### 1. Screen doesn't refresh after status changes (Admin Appointment Detail)
When you click "Confirm", "Check In", or "Start Treatment" on the admin appointment detail page, the toast says success but the UI badge and available action buttons don't visually update. This is because `useUpdateAppointment` invalidates the `["appointments"]` query key, but the single appointment view uses `["appointment", id]` -- a different query key. The mutation's `onSuccess` never triggers a refetch of the individual appointment data.

### 2. Treatment never transitions to "in_progress"
In `NurseJobCard.tsx`, `handleStartTreatment` creates a treatment record (which defaults to `status: "pending"`, `started_at: null`), records pre-vitals and assessment, and updates the appointment to `in_progress`. But it never updates the treatment itself to `status: "in_progress"` or sets `started_at`. This means the treatment timer never starts, the stepper stays on the wrong step, and the "End Treatment" button never appears.

### 3. No nurse assignment on appointments
The appointment creation form (`AppointmentNew.tsx`) has no field to assign a nurse. The `assigned_nurse_id` is always set to `null`. There's no way for admin to assign a nurse, and the appointment detail page doesn't show or allow editing the nurse assignment either.

### 4. Discharge "Back" button links to wrong route
`NurseDischarge.tsx` has a "Back to treatment" link pointing to `/nurse/treatment/{treatmentId}` (the old `NurseActiveTreatment` page), not back to the Job Card which is now the primary workflow.

### 5. Duplicate/parallel screens with no clear primary
`NurseCheckIn.tsx` and `NurseActiveTreatment.tsx` exist as standalone pages alongside the Job Card, which duplicates functionality and creates confusion. The Job Card should be the single source of truth.

### 6. Admin appointment detail has no link to the nurse Job Card
When viewing an appointment in the admin panel, there's no way to open the Job Card or see it from the admin side. Admin should be able to start a treatment or link through to the nurse view.

---

## What Gets Fixed

### A. Query invalidation fix (screen refresh issue)
Update `useUpdateAppointment` and `useDeleteAppointment` in `useAppointments.ts` to also invalidate the single `["appointment"]` query key, so the detail view refreshes after status changes.

Similarly, update `useUpdateTreatment` to invalidate both `["treatments"]` and the specific `["treatment"]` keys properly.

### B. Treatment status transition fix
In `NurseJobCard.tsx`, after creating the treatment, immediately update it to `status: "in_progress"` and `started_at: new Date().toISOString()`. This makes the timer start, the stepper advance, and the "End Treatment" button appear.

### C. Nurse assignment
Add a nurse selector to:
- `AppointmentNew.tsx` -- select a nurse when creating an appointment
- `AppointmentDetail.tsx` -- view and edit the assigned nurse

This requires fetching staff with the "nurse" role. A new hook `useNurseStaff` will query `user_roles` + `profiles` to get available nurses.

### D. Fix discharge navigation
Update `NurseDischarge.tsx` to navigate back to the Job Card (`/nurse/job-card/{appointmentId}`) instead of the old treatment page. This requires the discharge page to know the appointment ID (available from the treatment record).

### E. Admin-to-Job-Card link
Add a "Open Job Card" button on the admin `AppointmentDetail.tsx` that links to `/nurse/job-card/{appointmentId}`, visible when the appointment is checked_in or in_progress.

---

## Technical Details

### Files to modify

| File | Changes |
|---|---|
| `src/hooks/useAppointments.ts` | Fix `onSuccess` in mutations to invalidate `["appointment"]` query key too |
| `src/hooks/useTreatments.ts` | Fix `onSuccess` in `useUpdateTreatment` to invalidate specific treatment keys |
| `src/pages/nurse/NurseJobCard.tsx` | After `createTreatment`, call `updateTreatment` to set `status: "in_progress"` and `started_at` |
| `src/pages/admin/AppointmentNew.tsx` | Add nurse selector field |
| `src/pages/admin/AppointmentDetail.tsx` | Add nurse display/edit + "Open Job Card" button |
| `src/pages/nurse/NurseDischarge.tsx` | Fix back navigation to Job Card |

### Files to create

| File | Purpose |
|---|---|
| `src/hooks/useNurseStaff.ts` | Hook to fetch users with the "nurse" role and their profile names |

### Implementation order
1. Fix query invalidation (immediate screen refresh fix)
2. Fix treatment status transition in Job Card
3. Create nurse staff hook
4. Add nurse assignment to appointment creation and detail views
5. Fix discharge navigation
6. Add admin-to-Job-Card link
