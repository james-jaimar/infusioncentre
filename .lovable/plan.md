

# Upgrade Job Card into "Hero Session Cockpit"

## Overview
The Job Card (`NurseJobCard.tsx`) is already the primary treatment screen with vitals, medications, IV access, reactions, and billing. This upgrade adds two key enhancements:

1. **Vitals "Next Due" countdown** -- a real-time indicator showing when the next vitals check is due, with green/amber/red colour coding
2. **Inline Ketamine Monitoring** -- embed the ketamine sliders and history directly into the Job Card instead of navigating to a separate route

## Current State (what already exists)

The Job Card already has:
- `JobCardVitals` -- records and displays vitals with history (but no "next due" indicator)
- `JobCardMedications` -- captures medication name, dosage, route, diluent, infusion rate, and method
- `JobCardIVAccess` -- IV line documentation
- `JobCardReactions` -- adverse reaction logging
- `JobCardBilling` -- billing items
- A "Ketamine Protocol Active" banner that links to a **separate page** (`/nurse/ketamine/:treatmentId`)

The separate `NurseKetamineMonitoring.tsx` page has the slider form (alertness, mood, pain, dissociation, anxiety, nausea) and entry history. This content needs to move inline.

## What Changes

### 1. Add "Next Vitals Due" indicator to `JobCardVitals`

Add a countdown badge at the top of the Vitals card showing time until next vitals are due (15-minute cadence from last recorded entry, or from treatment start if none exist).

- Green: more than 5 minutes remaining
- Amber: 0-5 minutes remaining
- Red with pulse animation: overdue
- Updates every second

**Props change**: `JobCardVitals` gains an optional `treatmentStartedAt` prop so it can calculate the fallback.

### 2. New component: `JobCardKetaminePanel`

Extract the ketamine monitoring form and history from `NurseKetamineMonitoring.tsx` into a reusable component at `src/components/nurse/JobCardKetaminePanel.tsx`.

This component:
- Accepts `treatmentId` and `treatmentStartedAt` props
- Renders the slider form (alertness, mood, pain, dissociation, anxiety, nausea, notes) in a collapsible card
- Shows the monitoring history below
- Uses the existing `useKetamineMonitoring` and `useAddKetamineEntry` hooks

### 3. Update `NurseJobCard.tsx`

Replace the amber "Open Monitoring" link card (lines 402-418) with the inline `JobCardKetaminePanel` component. The ketamine panel renders directly in the treatment flow between Reactions and Billing.

### 4. Keep the standalone route (backward compatibility)

`NurseKetamineMonitoring.tsx` stays as-is for now (no breaking change). It could be removed later.

## Files Changed

| File | Change |
|------|--------|
| `src/components/nurse/JobCardVitals.tsx` | Add "next vitals due" countdown with colour-coded badge |
| `src/components/nurse/JobCardKetaminePanel.tsx` | New component -- inline ketamine sliders + history |
| `src/pages/nurse/NurseJobCard.tsx` | Replace ketamine link with inline panel, pass `treatmentStartedAt` to vitals |

## No Database Changes Required

All data already exists in `treatment_vitals` and `ketamine_monitoring` tables with the correct hooks.

