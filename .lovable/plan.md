# Nurse Job Card — 5-Stage Sequential Workflow

## Goal

Turn the cosmetic 5-tab stepper into a real, sequential workflow that supports staff handoff (e.g. Gail checks the patient in, another nurse runs the treatment, anyone qualified does post-assessment & discharge). Every stage ends with an explicit "Complete & continue" button that advances the stepper. Fix the current bug that strands the nurse on Check-In with no visible action button.

## The 5 stages

```text
1. Check-In         → identity / consent verified, patient seated
2. Pre-Assessment   → baseline vitals, safety checklist, IV access
3. In Progress      → medication administration, monitoring, reactions
4. Post-Assessment  → closing vitals, IV removal, fit-for-discharge check
5. Discharged       → final sign-off, billing finalised, summary
```

Each stage shows only its own panels. The previous stage's data stays visible read-only in the sidebar / history. The stepper at the top reflects the true current stage and is the source of truth.

## Stage-by-stage UX

**Check-In** (who: front desk / any nurse)
- Panels: Patient identity verification (name + DOB), allergy review, consent forms readiness (auto from onboarding), paper-consent override.
- Bottom action: **"Confirm Check-In →"** (enabled when identity + consent satisfied). Records who checked the patient in, timestamp.

**Pre-Assessment** (who: any nurse — can be different from check-in)
- Panels: Pre-treatment safety checklist (current manual items), Initial vitals, IV access site & cannulation, pre-treatment notes.
- Banner shows "Checked in by {name} at {time}" so the receiving nurse has context.
- Bottom action: **"Start Treatment →"** (enabled when checklist complete + vitals captured + IV access recorded). Sets `treatment.started_at`, advances to In Progress.

**In Progress** (who: assigned treating nurse)
- Panels: Live timer, protocol monitoring banner, vitals timeline, medications, reactions, ketamine panel (if applicable).
- Bottom action: **"End Treatment →"** advances to Post-Assessment (does NOT navigate away).

**Post-Assessment** (NEW in-page stage)
- Panels: Closing vitals, IV removal (time, site condition), patient response/observations, fit-for-discharge checklist (alert, oriented, stable vitals, no active reactions, mobility OK).
- Bottom action: **"Proceed to Discharge →"** (enabled when closing vitals captured + fit-for-discharge confirmed).

**Discharged** (who: any nurse)
- Inline summary + final sign-off + billing review + discharge instructions. The existing `/nurse/discharge/:id` content moves into this stage as the final panel. Bottom action: **"Complete & Sign Off"** marks treatment `completed`.

## Handoff support

- Each stage records `{stage}_completed_by` (user_id) and `{stage}_completed_at` (timestamp).
- A small "Stage history" strip under the stepper shows: `Check-in: Gail · 09:42 · Pre-assess: Sarah · 10:05 · …` so the next nurse can see the trail.
- The Command Centre patient row is annotated with current stage (Check-in / Pre-assess / In progress / Post-assess / Discharge) instead of just status.

## Bug fix (immediate)

The action bar in `JobCardActions.tsx` only shows "Start Treatment" when `!treatmentStatus`. When a recoverable `pending` treatment row exists (the orange "Resuming previous attempt" banner), neither Check-In nor Start Treatment renders, leaving the nurse stranded — exactly what you saw with James. We will also show "Start Treatment" when `treatmentStatus === "pending"` and `!started_at`. (This is fixed naturally by the new sequential design but should also be hot-fixed so today's session can proceed.)

## Technical changes

**Database (migration):**
- Extend the treatment status enum / dictionary to include `checked_in`, `pre_assessment`, `in_progress`, `post_assessment`, `completed`. (Currently only `pending`/`in_progress`/`completed`.)
- Add columns to `treatments`: `checked_in_by`, `checked_in_at`, `pre_assessment_by`, `pre_assessment_completed_at`, `post_assessment_by`, `post_assessment_completed_at`, `discharged_by`, `discharged_at`, `iv_removed_at`, `fit_for_discharge_data jsonb`.
- Backfill existing rows: any `in_progress` row gets `checked_in_at = pre_assessment_completed_at = started_at`.

**Hooks:**
- `useTreatments`: add `useAdvanceStage(treatmentId, nextStage)` mutation that writes the right `_by` / `_at` pair and updates status atomically.

**Components:**
- `NurseJobCard.tsx`: replace the giant single-screen render with a stage-router that renders only the current stage's panels + a single "Complete & continue" CTA.
- `JobCardStepper.tsx`: drive off the new richer status; clicking a completed stage scrolls to read-only summary of that stage.
- `JobCardActions.tsx`: collapse to a single dynamic primary CTA whose label & handler come from the active stage.
- New small components: `CheckInPanel`, `PreAssessmentPanel`, `PostAssessmentPanel`, `DischargePanel` (extracts existing `NurseDischarge` content).
- `NurseDischarge.tsx`: keep the route as a redirect to the job card with the discharge stage selected, so old links don't break.

**Audit:**
- The existing `log_status_change` trigger automatically logs each new treatment status transition — no extra work needed.

## Out of scope (call out)

- Role-based gating per stage (e.g. only senior nurse can sign off discharge). Today everyone with the `nurse` role can do every stage; we can layer permissions later once you confirm with Gail how she wants it split.
- Reassigning the "treating nurse" mid-session — for now we just record who completed each stage.
