
# Phase 4: Treatment Job Cards

## Overview

Treatment Job Cards transform the nurse's workflow from separate, disconnected screens into a single unified "work order" view. When a nurse taps on a patient, they see everything they need on one screen: patient info, allergies, medical history, onboarding status, vitals, medications, treatment progress, and previous visit history -- all optimised for tablets in landscape mode.

No new database tables are required. This phase is a UI/UX layer built on top of existing data.

---

## What the Nurse Will See

### 1. Job Card Screen (the core deliverable)

A single-page view at `/nurse/job-card/:appointmentId` that consolidates:

**Header Strip**
- Patient name, age, gender, medical aid info
- Treatment type badge (colour-coded: Ketamine = amber, Iron = blue, etc.)
- Chair assignment and assigned nurse
- Appointment time window
- Allergy flags (red alert banner if allergies exist)

**Sidebar / Collapsible Panels**
- **Patient Summary**: Emergency contact, referring doctor, medical aid details
- **Medical Flags**: Allergies (highlighted in red), chronic conditions, current medications
- **Onboarding Status**: Progress bar showing completed/pending forms with the ability to view submitted forms inline
- **Previous Treatments**: A compact history of past visits showing date, treatment type, duration, and any notes -- giving the nurse instant context on whether this is a first visit or a returning patient

**Main Treatment Area**
- **Status Stepper**: Visual progress indicator showing the workflow stages: Check-In, Pre-Assessment, In Progress, Post-Assessment, Discharged
- **Vitals Panel**: Latest readings with quick-add button, plus a mini chart/sparkline of trends from this session
- **Medications Panel**: Current session medications with quick-add, showing lot numbers
- **Treatment Timer**: Large, prominent elapsed time display
- **Protocol-Specific Section**: Automatically shows Ketamine monitoring controls when the treatment type is Ketamine, or wound care notes fields for wound care appointments (placeholder for now -- detailed medical fields to be populated after Gail's input)
- **Notes**: Running treatment notes for this session

**Action Bar (sticky bottom on tablet)**
- Large touch-friendly buttons: "Record Vitals", "Add Medication", "End Treatment"
- Emergency Protocol button always visible

### 2. Updated Navigation Flow

Currently the nurse workflow is: Dashboard -> Today's Patients -> Check In -> Active Treatment -> Discharge (5 separate pages).

The Job Card consolidates Check-In + Active Treatment + Discharge into one tabbed/stepped view. The nurse taps a patient from the queue and lands on the Job Card, which guides them through each stage without page navigation.

### 3. Treatment History on Job Card

A collapsible "Previous Visits" section that queries past completed treatments for this patient, showing:
- Date and treatment type
- Duration (started_at to ended_at)
- Medications administered
- Any discharge notes
- Number of vitals readings

This gives the nurse instant visual context: "This patient has had 4 previous ketamine sessions, last one was 2 weeks ago."

---

## Files to Create

| File | Purpose |
|---|---|
| `src/pages/nurse/NurseJobCard.tsx` | Main Job Card page -- the unified treatment view |
| `src/components/nurse/JobCardHeader.tsx` | Patient info strip with allergy flags and treatment badge |
| `src/components/nurse/JobCardSidebar.tsx` | Collapsible panels for medical history, onboarding, and previous treatments |
| `src/components/nurse/JobCardVitals.tsx` | Vitals display with quick-add and trend sparklines |
| `src/components/nurse/JobCardMedications.tsx` | Medication list with quick-add dialog |
| `src/components/nurse/JobCardStepper.tsx` | Visual workflow stepper (Check-In through Discharge) |
| `src/components/nurse/JobCardActions.tsx` | Sticky bottom action bar for tablets |
| `src/components/nurse/TreatmentHistory.tsx` | Previous visits summary component |
| `src/hooks/useTreatmentHistory.ts` | Hook to fetch past treatments for a patient |

## Files to Modify

| File | Change |
|---|---|
| `src/App.tsx` | Add `/nurse/job-card/:appointmentId` route |
| `src/pages/nurse/NurseDashboard.tsx` | Update queue links to point to Job Card instead of check-in |
| `src/pages/nurse/NurseTodaysPatients.tsx` | Update action buttons to open Job Card |
| `src/components/layout/NurseLayout.tsx` | No changes needed (navigation stays the same) |

---

## Implementation Order

1. **Treatment History hook** -- query past treatments for a patient so the Job Card can show previous visits
2. **Job Card Header** -- patient info strip with allergy alerts, treatment badge, chair assignment
3. **Job Card Sidebar** -- medical history panels, onboarding checklist status, previous treatment history
4. **Job Card Stepper** -- visual workflow from check-in to discharge with stage transitions
5. **Job Card Vitals and Medications** -- extract and enhance from current `NurseActiveTreatment.tsx`
6. **Job Card Actions** -- sticky bottom bar with large touch targets
7. **Main Job Card page** -- assemble all components into the unified view
8. **Route and navigation updates** -- wire up the new route and update dashboard/queue links

---

## Technical Notes

- **Tablet-first layout**: Uses CSS Grid with a sidebar + main area layout. Min touch targets of 44x44px maintained throughout. Landscape-optimised with horizontal panels.
- **No new database tables**: All data comes from existing tables: `appointments`, `treatments`, `patients`, `patient_medical_history`, `onboarding_checklists`, `treatment_vitals`, `treatment_medications`, `treatment_assessments`, `ketamine_monitoring`.
- **Treatment history query**: Joins `treatments` with `appointments` and `appointment_types` for the same `patient_id`, filtered to `status = 'completed'`, ordered by date descending.
- **Existing pages preserved**: The current `NurseCheckIn`, `NurseActiveTreatment`, and `NurseDischarge` pages remain functional as fallbacks. The Job Card is the new primary entry point but doesn't delete anything.
- **Protocol-specific sections**: The Ketamine monitoring UI (sliders for alertness, mood, pain, dissociation) is embedded directly in the Job Card when the treatment type is Ketamine. For wound care and stoma therapy, placeholder sections will be created with a note that detailed fields will be added after clinical input from Gail.
- **Stepper state management**: The stepper maps directly to the existing `treatment_status` enum (`pending` -> `pre_assessment` -> `in_progress` -> `post_assessment` -> `completed`). Stage transitions call the same `useUpdateTreatment` and `useUpdateAppointment` hooks already in use.
