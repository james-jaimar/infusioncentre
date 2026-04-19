

## Patient list with treatment course at-a-glance + filtering

### What Gail will see

**On the Patients page (`/admin/patients`):**

1. **New "Treatment Course" column** in the patient table — shows a colored chip per active course using the appointment_type's `color` token. Format: `● Iron Infusion` with a small progress badge `2/4`. If multiple active courses, show stacked chips.
2. **New filter dropdown** "Treatment Type" next to the existing Status filter — lets her see only Iron patients, only Ketamine patients, etc.
3. **Quick toggle** "Show only patients with active courses" — checkbox/toggle that filters to patients who have at least one course in `draft`, `active`, or `scheduled` status. (This is what she means by "active patients" — not just `status=active` but actually have treatment underway.)
4. **Status filter expanded** to include the active-course quick option as a top-level chip row above the table:
   `[All] [Active courses] [Awaiting scheduling] [Completed] [No course yet]`

**On the Admin Dashboard:**

5. **New stat card** "Active Treatment Courses" replacing or sitting alongside the existing one — counts courses in `active`/`scheduled` state, links to the filtered patient list.
6. **New "Active Patients" panel** below Today's Appointments — shows the top 5–10 patients with active courses, color-coded chip per course, sessions completed/planned, last visit date.

### Color coding strategy

- Each `appointment_type` already has a `color` field (e.g. Iron = #...). We use that as the chip background (low opacity) with the type's color as text/border.
- Consistent everywhere: same chip used in patient list, dashboard panel, and patient detail Treatment Course tab.
- Build a tiny shared component `<TreatmentCourseChip course={...} />` so the visual language is one source of truth.

### Filtering logic (the data-side)

The current `usePatientList` hook only filters by status & search. We extend it:

```text
filters:
  search: string
  status: PatientStatus | 'all'
  treatment_type_id: string | 'all'    ← NEW
  course_state: 'all' | 'has_active' | 'awaiting_scheduling' | 'completed' | 'no_course'  ← NEW
```

Implementation: rather than complex SQL joins on every query, we'll fetch patients then enrich each row with their courses via a single batched join — Supabase can do this in one query:

```text
patients
  ↳ treatment_courses (filtered by status set)
       ↳ appointment_type (id, name, color)
```

For the treatment_type filter, we use a Supabase `inner` join on `treatment_courses` constrained to active states, then filter on `appointment_type_id`. For "no course yet" we use a left join + null check (handled client-side after fetch since Supabase JS doesn't expose this cleanly).

### Files to change

| File | Change |
|---|---|
| `src/hooks/usePatients.ts` | Extend `usePatientList` to accept `treatment_type_id` and `course_state` filters; join treatment_courses + appointment_type into the response |
| `src/components/shared/TreatmentCourseChip.tsx` (new) | Reusable colored chip showing type name + sessions progress |
| `src/pages/admin/AdminPatients.tsx` | Add Treatment Type filter dropdown, course-state chip row, new column rendering chips |
| `src/pages/admin/AdminDashboard.tsx` | Add "Active Treatment Courses" stat + "Active Patients" panel |
| `src/hooks/useAppointmentTypes.ts` | Already returns active types — used to populate the filter dropdown |
| `src/hooks/useTreatmentCourses.ts` | Add `useActivePatientsWithCourses(limit)` for the dashboard panel |

### URL behavior

Filters become URL search params (`?type=<id>&state=has_active`) so Gail can bookmark "all active Ketamine patients" and the dashboard's "Active Treatment Courses" card links straight to `/admin/patients?state=has_active`.

### Out of scope this round

- Bulk actions on filtered patient sets (message all active iron patients, etc.) — logical next step
- Saving filter presets ("My morning view")
- Course chips on the doctor's "My Patients" view (already shows progress bars, can align visually next round)

### What stays the same

- No DB schema changes — `appointment_types.color` already exists, `treatment_courses` already has status + sessions counts
- Existing patient row click → detail page navigation unchanged
- Existing pagination logic unchanged

