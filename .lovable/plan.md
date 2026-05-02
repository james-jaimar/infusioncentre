## The problem (lateral view)

Right now the workflow has **three distinct admin micro-tasks** for every incoming referral:

```text
1. Triage         pending          → accepted / rejected
2. Patient link   accepted, no PID → accepted, patient_id set
3. Course set up  accepted, PID    → treatment_course created (draft+)
```

We only flag step 1 ("new referral, awaiting triage"). Steps 2 and 3 silently look "done" because the status is `accepted`, even though the journey isn't finished. Your James Hawkins 2 record proves it: status `accepted`, patient created, **zero courses** — and nothing in the UI tells Gail.

This plan treats *workflow completeness* — not just status — as the source of truth, and makes the gap visible everywhere the admin works.

---

## What we'll build

### 1. Derived "needs attention" state for every referral

A small helper `lib/referralProgress.ts` that, given a referral + its course count, returns one of:

- `awaiting_triage` — status `pending`
- `needs_patient` — accepted/under_review but no `patient_id`
- `needs_course` — accepted, has patient, no treatment course
- `complete` — accepted with at least one course (or terminal status)

This becomes the single source of truth used by every surface below.

### 2. Dashboard "Workflow to-do" card (replaces today's single banner)

Today's amber "X new referrals awaiting triage" card grows into a small **to-do strip** with up to three chips, each clickable:

```text
┌─ Referrals needing your attention ──────────────────────┐
│  [ 0 to triage ]  [ 1 needs patient ]  [ 2 needs course ] │
└─────────────────────────────────────────────────────────┘
```

Each chip deep-links to the Referrals page pre-filtered (e.g. `?attention=needs_course`). Hidden when all three are zero.

### 3. Sidebar badge counts everything incomplete

The red "Referrals" badge currently only counts `pending`. Change it to count `awaiting_triage + needs_patient + needs_course` so Gail isn't lulled into ignoring it once she's triaged.

Hook rename: `usePendingReferralsCount` → `useReferralsAttentionCount` (returns a breakdown object + total).

### 4. Referrals page: new "Attention" filter + visible row badges

- Add a new filter pill row above the table: **All · Needs attention · Awaiting triage · Needs patient · Needs course · Complete**. Defaults from `?attention=` URL param so dashboard chips deep-link.
- Add a new metric card "Incomplete workflow" alongside the existing four.
- In `ReferralTable`, add an inline amber pill next to the patient name when the referral is in a `needs_*` state — e.g. `⚠ Needs course setup`. Row also gets a soft amber background (same pattern already used for urgent-pending rows).

### 5. Row action reflects what's actually next

Currently every row shows a generic **Review** button. Change it to context-aware:

- `awaiting_triage` → **Review** (opens triage dialog, same as today)
- `needs_patient` → **Link patient** (opens triage dialog on the Patient Match tab)
- `needs_course` → **Set up course** (opens `ConvertReferralDialog` directly — skips triage)
- `complete` → **View** (opens triage dialog read-only-ish, same handler)

This means after Gail closes the convert dialog without picking a date, the very next time she sees the row the button literally says "Set up course" — no thinking required.

### 6. Gentle nudge when she abandons the convert dialog

In `ConvertReferralDialog`, when the user cancels/closes without converting **and** the referral is already `accepted` with a patient linked, show a non-blocking toast:

> "Course setup not finished — this referral will stay in your to-do list until a course is created."

Small thing, but it closes the loop on the exact moment that produced this bug.

---

## Technical details

**New files**
- `src/lib/referralProgress.ts` — pure helper:
  ```ts
  export type ReferralAttention = 'awaiting_triage' | 'needs_patient' | 'needs_course' | 'complete';
  export function getReferralAttention(r: { status: string; patient_id?: string|null }, courseCount: number): ReferralAttention;
  ```
- `src/hooks/useReferralsAttentionCount.ts` — replaces `usePendingReferralsCount`. Single query that left-joins referral → treatment_courses count, returns `{ awaiting_triage, needs_patient, needs_course, total }`. Keeps the same realtime `postgres_changes` subscription on `referrals` **and** adds one on `treatment_courses` (insert) so badges drop the moment Gail finishes a course.

**Data fetch change**
- `useReferrals` query: add `treatment_courses(id)` to the select so each row carries `course_count = referral.treatment_courses.length`. No new round-trip.

**Edits**
- `src/components/layout/AdminLayout.tsx` — swap hook, badge shows `total`.
- `src/pages/admin/AdminDashboard.tsx` — replace single warning card with the three-chip to-do strip.
- `src/pages/admin/AdminReferrals.tsx` — read `?attention=` param, add attention filter state, pass to table.
- `src/components/admin/referrals/ReferralFilters.tsx` — add the attention pill row.
- `src/components/admin/referrals/ReferralMetrics.tsx` — add "Incomplete workflow" card.
- `src/components/admin/referrals/ReferralTable.tsx` — attention badge + row tinting + context-aware action button. New `onSetupCourse` prop wired to existing `ConvertReferralDialog` flow already on `AdminReferrals`.
- `src/components/admin/ConvertReferralDialog.tsx` — abandonment nudge toast (only when the referral is already in `needs_course` state).

**Removed**
- `src/hooks/usePendingReferralsCount.ts` (replaced).

**No DB migrations.** Everything is derived from existing columns + the existing `treatment_courses.referral_id` relation.

---

## Why this matters beyond this one bug

Same pattern (derived "what's next" state, surfaced in sidebar + dashboard + row action) is reusable for the other holistic gaps you've hinted at — patient onboarding not finished, appointments missing chair/nurse, courses with no first session booked, etc. If you like how this lands, the next iteration can roll the same `*Attention` shape into a single **"Admin To-Do"** widget on the dashboard that aggregates across domains. Flagging that as a follow-up rather than scope-creeping this change.
