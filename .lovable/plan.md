## Goal

Reframe the Convert Referral dialog around the question a human actually asks first: **"When does this start?"** — not "When does it end?" The end date should be computed automatically from the template's frequency and session count.

## Current Behaviour

The dialog asks only for `Expected End Date`. The user has to mentally calculate when 6 sessions will end based on a "twice weekly" cadence. That's backwards — start date is the natural anchor.

## Proposed Behaviour

The dialog asks for **Preferred Start Date** (anchor) and shows a computed **Expected End Date** as a read-only hint underneath. Both get saved on the course.

```text
┌─────────────────────────────────────────┐
│ Total Sessions    │ Preferred Start Date │
│ [    6      ]     │ [ 📅  Pick a date ]  │
├─────────────────────────────────────────┤
│ Expected end:  ~ Fri 12 Jun 2026         │
│ (6 sessions, twice weekly)               │
│ Tip: you can finalise individual session │
│ dates later from the course schedule.    │
└─────────────────────────────────────────┘
```

If no template is selected (or frequency is `as_needed` / `custom_schedule`), the computed end is hidden and we just show: *"Schedule the remaining sessions at your convenience."*

## Detailed Changes

### 1. `src/components/admin/ConvertReferralDialog.tsx`

- Replace `expectedEndDate` state with `preferredStartDate` (Date | undefined).
- Swap the native `<input type="date">` for the project-standard shadcn DatePicker (Popover + Calendar with `pointer-events-auto`). Disable past dates.
- Derive `computedEndDate` via a small helper from:
  - `preferredStartDate`
  - `totalSessions`
  - `selectedTemplate.default_frequency`
- Show a muted hint line under the grid with the computed end and cadence label.
- Pass `expected_end_date: computedEndDate` (ISO date) to `convertMutation.mutateAsync`. Start date is informational for now (no DB column yet — see Technical Notes).

### 2. New helper `src/lib/courseSchedule.ts`

Pure function:

```typescript
export function computeExpectedEndDate(
  start: Date,
  sessions: number,
  frequency: CourseFrequency
): Date | null
```

Frequency → days-between-sessions map:
- `single` → end = start
- `weekly` → 7
- `twice_weekly` → 3-4 (use 3.5 avg, rounded)
- `biweekly` → 14
- `monthly` → ~30
- `as_needed` / `custom_schedule` → returns `null` (caller hides the hint)

End = `addDays(start, gap × (sessions - 1))`.

### 3. Copy tweaks

- Field label: "Expected End Date" → "Preferred Start Date"
- Helper text under the date picker:
  - With template: *"We'll estimate the end date from the cadence. You can adjust each session later."*
  - Without template: *"Pick a start date — schedule the rest at your convenience."*

## Out of Scope

- No DB migration in this pass. We don't add a `preferred_start_date` column yet; the date drives the computed `expected_end_date` that already exists. If you want the start date persisted as well, that's a follow-up (small migration adding `treatment_courses.preferred_start_date date`).
- The actual scheduling of individual sessions stays where it is today — user finalises dates in the course schedule view afterwards.

## Files Touched

- `src/components/admin/ConvertReferralDialog.tsx` (modified)
- `src/lib/courseSchedule.ts` (new)

## Technical Notes

- `useActiveCourseTemplatesByType` already returns `default_frequency`, so no extra query needed.
- Date math uses `date-fns` (already in the project — used via `format` elsewhere).
- DatePicker follows the existing shadcn pattern with `className={cn("p-3 pointer-events-auto")}` so it works inside the Dialog.
