# Allow nurses to step backward through job-card stages

## Why

Right now the nurse workflow is one-way: Check-In → Pre-Assessment → In Progress → Post-Assessment → Discharged. If a nurse hits "End Treatment" by mistake, they land on Post-Assessment with discharge criteria failing (IV not removed, post-vitals not recorded) and no way to return to the previous stage. The only escape is the override button, which silently fakes compliance — the wrong tool for "I clicked too soon."

We need a safe, auditable way to reverse a stage transition.

## What we'll build

A small, consistent **"Back to <previous stage>"** secondary control on every stage where reversing is sensible, plus the underlying state transitions and audit trail.

### 1. Action bar gets a secondary "Step back" button

In `JobCardActions` (the fixed bottom bar), alongside the primary CTA, add a left-aligned outline button labelled e.g. "← Back to In Progress". It is shown only when a previous stage exists for the current state.

- Tapping it opens a confirmation dialog: *"Return to <stage>? Any progress on the current stage will remain saved."*
- On confirm, the treatment status is reverted and the appointment status follows.

### 2. Allowed reversals

| Current stage      | Can step back to | Notes                                                    |
| ------------------ | ---------------- | -------------------------------------------------------- |
| Pre-Assessment     | Check-In         | Clears `checked_in_*` only if user wants; default keep   |
| In Progress        | Pre-Assessment   | Keeps `started_at` for audit; clears `pre_assessment_*` is **not** done — preserved as history |
| Post-Assessment    | In Progress      | Clears `ended_at` so the timer resumes                   |
| Discharged         | (no back)        | Locked — needs admin/clinical lead intervention          |

Discharge is final from the nurse UI on purpose. If a nurse needs to undo a discharge, that's a separate admin-only flow and out of scope for this change.

### 3. Audit trail

Every reversal is logged through the existing `audit_log` system (the `log_status_change` trigger already captures status transitions in both directions). We'll additionally record a row in the assessments/notes table tagged `stage_reverted` with the old → new stage and the actor, so the StageHistoryStrip can show a small "↶ Reverted by Sarah · 10:14" chip.

### 4. UI feedback

- `StageHistoryStrip` gets a new "reverted" visual variant (muted, with the curved-arrow icon) so the audit is visible at a glance.
- A toast confirms the reversal: *"Returned to Pre-Assessment"*.

## Out of scope

- Undoing a completed discharge (admin-only, separate task).
- Editing already-saved vitals/medications from a previous stage (those records remain immutable; a new entry is the correct fix).
- Free jump-to-any-stage navigation. Only one step back at a time, to keep the audit narrative linear.

## Technical details

- **`NurseJobCard.tsx`**: add `handleStepBack(targetStage)` that calls `updateTreatment` with the reverted status (`pre_assessment` → `checked_in`, `in_progress` → `pre_assessment`, `post_assessment` → `in_progress`) plus clearing `ended_at` when leaving Post-Assessment. Compute `previousStage` from `deriveStage` and pass it into `JobCardActions`.
- **`JobCardActions.tsx`**: accept optional `secondaryLabel` + `onSecondary`. Render as `variant="outline"` button at the left of the bar. Wrap in shadcn `AlertDialog` for confirmation. Hidden when `stage === "discharged"`.
- **`PostAssessmentPanel.tsx`**: no logic changes needed; the bar handles reversal. The override checkboxes stay, but the more correct path (going back to remove IV and record vitals) is now visibly available.
- **Audit note**: write a small assessment row `assessment_type: "stage_reverted"` with `{ from, to }` so `StageHistoryStrip` can render it. No DB schema changes required — the existing `treatment_assessments` table already supports arbitrary `assessment_type` strings.
- **`StageHistoryStrip.tsx`**: read those `stage_reverted` assessments and interleave them chronologically with the existing forward-stage chips.

No migration needed. No new dependencies.
