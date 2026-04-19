

## Restructure: Templates under "Treatment Courses", live courses under Patient

### What changes

**Sidebar "Treatment Courses" link** — currently shows the list of *live patient courses* (`AdminTreatmentCourses`). Will be replaced to show **course templates** (the recipes: Ferinject 4 sessions, Monofer, Ketamine Induction, etc.).

**Live treatment courses for a patient** — moved into the patient detail page as a new "Treatment Course" tab. Shows the course(s) selected for that patient, sessions completed/remaining, schedule, status, with the inline "Schedule Sessions" action.

**Settings → Course Templates tab** — removed (just added it there last round; moving home).

### Detailed changes

| File | Change |
|---|---|
| `src/pages/admin/AdminTreatmentCourses.tsx` | Rewrite as the **Course Templates** management page (CRUD list grouped by treatment type). Uses existing `useCourseTemplates` hook + the editor UI from `CourseTemplatesTab`. |
| `src/components/admin/settings/CourseTemplatesTab.tsx` | Refactor into a reusable `CourseTemplatesManager` component (or keep the file, just have both pages render the same component) |
| `src/pages/admin/AdminSettings.tsx` | Remove the "Course Templates" tab and import |
| `src/components/layout/AdminLayout.tsx` | Rename sidebar label from "Treatment Courses" to "Course Templates" (icon stays `Layers`). Keeps URL `/admin/treatment-courses` so existing links don't break — or update to `/admin/course-templates` (cleaner). I'll go with `/admin/course-templates` and add a redirect. |
| `src/pages/admin/PatientDetail.tsx` | Add a new "Treatment Course" tab between existing tabs, showing the patient's active/historical courses, sessions progress, status, with "Schedule Sessions" button (re-uses `RecurringSessionDialog`) |
| `src/hooks/useTreatmentCourses.ts` | Add a `useTreatmentCoursesByPatient(patientId)` query if not already present (quick check during impl) |
| `src/App.tsx` | Update the route: `treatment-courses` → renders new templates page; add `course-templates` as alias; live patient courses no longer have a top-level route |

### Sidebar navigation after change

```text
... Referrals
    Course Templates    ← was "Treatment Courses" (now templates only)
    Form Templates
    ...
```

### Patient detail tabs after change

```text
[Overview] [Medical History] [Documents] [Treatment Course]  ← NEW
[Onboarding] [Forms] [Notes] [Communications] [Account]
```

The Treatment Course tab will show:
- Active course card: variant name, treatment type chip, status badge, sessions progress (e.g. "2 / 4 sessions"), referring doctor, created date
- "Schedule Sessions" button (when status allows) → opens existing `RecurringSessionDialog`
- Past/cancelled courses listed below

### What stays the same

- Database schema unchanged — templates table and live courses table both already exist
- `useCourseTemplates`, `useTreatmentCourses`, `RecurringSessionDialog`, `ConvertReferralDialog` all keep working
- Doctor's referral flow unchanged
- Form auto-attachment trigger unchanged

### Out of scope this round

- Doctor portal showing the same Treatment Course tab inside patient view (logical next step)
- Patient portal showing their own course progress (already partially there via OnboardingProgress)

