

# Nurse Command Centre (4-Chair Live Board)

## Overview
Replace the current nurse dashboard with a clinical command centre showing all 4 treatment chairs in real-time. This becomes the primary nurse landing page at `/nurse`.

## What Gets Built

### 1. New Page: `src/pages/nurse/NurseCommandCentre.tsx`
A full-screen, tablet-optimized board displaying 4 large chair tiles in a 2x2 grid (desktop) or stacked on mobile.

**Each chair tile shows:**
- Chair name (Chair 1-4)
- If occupied: patient name, treatment type badge, session status badge
- Elapsed time counter (reusing the existing `ElapsedTimer` pattern from `ActiveTreatmentTimer`)
- "Next vitals due" countdown with color coding:
  - Green: more than 5 minutes remaining
  - Amber: within 5 minutes
  - Red/pulsing: overdue
- Primary action button:
  - Occupied: "Open Session" linking to `/nurse/job-card/{appointmentId}`
  - Empty: "Available" (greyed out, no action needed since assignments happen during scheduling)

**Below the grid:** an "Unassigned Treatments" section showing any active treatments that lack a `chair_id` on their appointment, with a dropdown to assign them to an available chair.

### 2. New Hook: `src/hooks/useCommandCentre.ts`
A single query that fetches:
- All 4 chairs from `treatment_chairs`
- Today's active/in-progress appointments with their treatments, patients, and appointment types
- The most recent vitals timestamp per treatment

This maps each chair to its current occupant (if any) and calculates the next vitals due time.

### 3. Route Changes in `src/App.tsx`
- Add route: `<Route path="command-centre" element={<NurseCommandCentre />} />`
- Change the nurse index route from `NurseDashboard` to `NurseCommandCentre`

### 4. Sidebar Update in `NurseLayout.tsx`
- Rename "Dashboard" nav item to "Command Centre" with href `/nurse`
- Keep "Today's Patients" and "Active Treatments" links as-is

### 5. Assign-to-Chair Mutation
A small mutation in the command centre hook that updates `appointments.chair_id` for unassigned treatments, allowing nurses to drag a treatment into a chair slot.

## Vitals Due Logic
```text
For each active treatment:
  1. Query most recent vitals entry (MAX recorded_at)
  2. next_due = last_vitals_at + 15 minutes
  3. If no vitals exist: next_due = treatment.started_at + 15 minutes
  4. Display countdown timer with color:
     - Green:  > 5 min remaining
     - Amber:  0-5 min remaining  
     - Red:    overdue (pulsing)
```

## Visual Design
- Large touch-friendly tiles (min 44x44px targets per clinical requirements)
- Status colours: green (in progress), blue (pre-assessment), amber (observing/post), grey (empty)
- Minimal text, high contrast, landscape-friendly
- Auto-refresh every 15 seconds (matching existing `useActiveTreatments` interval)

## Files Changed
| File | Change |
|------|--------|
| `src/pages/nurse/NurseCommandCentre.tsx` | New file -- the main board UI |
| `src/hooks/useCommandCentre.ts` | New file -- data fetching and chair mapping |
| `src/App.tsx` | Add command-centre route, change nurse index |
| `src/components/layout/NurseLayout.tsx` | Rename "Dashboard" to "Command Centre" |

## No Database Changes Required
- Chairs already exist (Chair 1-4 confirmed in DB)
- `appointments.chair_id` already links appointments to chairs
- `treatment_vitals.recorded_at` provides the vitals timestamp
- All needed RLS policies for nurses are already in place

