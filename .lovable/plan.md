# Nurse Command Centre Overhaul + Stuck-Treatment Fix

Two things are wrong:

1. **Treatment is stuck in a loop.** The previous "Start Treatment" attempt created a `treatments` row with `status='pending'` and `started_at=null` (because the trigger error fired before the in_progress update). The Job Card now hides pre-assessment (treatment exists) and also doesn't show the active treatment view (status isn't `in_progress`) — so there's no button to move forward.
2. **Command Centre is empty / not operational.** Today's appointments don't show against chairs, the nurse can't see the schedule, and they're forced to detour via "Today's Patients" to find a job card.

---

## Part 1 — Fix the stuck treatment (immediate unblock)

**Job Card recovery logic** (`src/pages/nurse/NurseJobCard.tsx`):
- When a treatment exists but `status === 'pending'` (the broken intermediate state), treat it as if no treatment exists — show pre-assessment UI again.
- Update `handleStartTreatment` to **reuse** an existing `pending` treatment instead of always creating a new one (idempotent: if treatment row exists for this appointment, skip `createTreatment` and just attach vitals/assessment, then transition to `in_progress` + set `started_at`). This recovers any future failure mid-flow without manual intervention.
- Add a small "Recover session" notice if a pending treatment is detected, so the nurse knows the previous attempt is being resumed.

**One-time data fix** for the currently stuck record (treatment `561264f0…`): leave the row in place — the new recovery logic above will resume it cleanly when the nurse re-opens the job card.

---

## Part 2 — Rebuild the Nurse Command Centre

Goal: the command centre becomes the **single screen a nurse uses all day**, suitable for a wall monitor *and* tablet operation. No more bouncing to "Today's Patients".

### New layout (12-col grid, full-width, designed for big screens)

```text
┌─────────────────────────────────────────────────────────────────┐
│  Clinical Operations              13:07   ● 2 Active   4 Chairs │
├──────────────────────────────────┬──────────────────────────────┤
│  CHAIR FLOOR (8 cols)            │  TODAY'S SCHEDULE (4 cols)   │
│  ┌──────────┐  ┌──────────┐     │  ┌────────────────────────┐  │
│  │ Chair 1  │  │ Chair 2  │     │  │ 09:00  Jane Smith      │  │
│  │ Jane S.  │  │ Available│     │  │        Iron · Chair 1  │  │
│  │ Iron 45m │  │  [Assign]│     │  │        ● In Progress   │  │
│  │ ▓▓▓▓░░   │  │          │     │  ├────────────────────────┤  │
│  │ [Open]   │  │          │     │  │ 10:30  John Doe        │  │
│  └──────────┘  └──────────┘     │  │        Ketamine        │  │
│  ┌──────────┐  ┌──────────┐     │  │        ⊙ Checked-in    │  │
│  │ Chair 3  │  │ Chair 4  │     │  │        [Open Job Card] │  │
│  │ ...      │  │ ...      │     │  ├────────────────────────┤  │
│  └──────────┘  └──────────┘     │  │ 13:00  ...             │  │
│                                  │  └────────────────────────┘  │
│  UNASSIGNED (warning strip)      │                              │
│  • Sarah J. — Biologic [Assign▼] │  LIVE ALERTS                 │
│                                  │  • Chair 1 vitals overdue 3m │
│                                  │  QUICK STATS                 │
└──────────────────────────────────┴──────────────────────────────┘
```

### Key changes

**Today's Schedule panel (replaces the small "Upcoming Sessions" card)**
- Shows **every appointment for today** in chronological order — scheduled, confirmed, checked-in, in-progress, completed.
- Each row: time · patient · treatment type · chair · status pill · action button.
- Action button is context-aware:
  - `scheduled`/`confirmed` → "Open Job Card" (lets nurse check-in from job card)
  - `checked_in` → "Pre-Assessment" (highlighted, primary action)
  - `in_progress` → "Resume" (goes straight to active treatment)
  - `completed` → "View"
- Eliminates the need for the separate "Today's Patients" page for the daily workflow.

**Chair Floor improvements**
- Available chairs get an inline **"+ Assign Patient"** button → opens a small popover listing today's unassigned + checked-in patients to drop into that chair (mirrors current unassigned-sidebar logic but reversed: pick a patient *for* a chair).
- Occupied chair card shows the **stage chip** more prominently (Pre-Assessment / Running / Observing) so nurse sees workflow phase at a glance.
- "Open Session" button stays — primary tablet target.

**Header refinements**
- Add second metric pill: "**X / Y chairs occupied**" alongside Active count.
- Date displayed under the live clock (useful on a wall monitor).

**Sidebar refinements** (Live Alerts + Quick Stats)
- Keep Live Alerts at the top — make it more prominent (larger when there are alerts, collapsed when none).
- Quick Stats stays at the bottom but adds: "Next arrival in Xm" derived from upcoming sessions.
- Remove the "Unassigned" sidebar block — handled in the chair floor warning strip and the schedule panel now.

### Data layer (`src/hooks/useCommandCentre.ts`)
- Extend `treatmentsQuery` to include `status='pending'` so checked-in patients with a pending treatment row also appear linked to a chair (prevents the same stuck-state from disappearing the patient from the board).
- Add a `todaysAppointments` query (all of today regardless of status) to power the new schedule panel — replaces the narrower `upcomingQuery`.

### Files affected
- `src/pages/nurse/NurseCommandCentre.tsx` — new layout
- `src/components/nurse/command-centre/ChairPanel.tsx` — add assign-patient popover for available chairs, prominent stage chip
- `src/components/nurse/command-centre/MonitoringSidebar.tsx` — drop unassigned block, refine alerts/stats
- `src/components/nurse/command-centre/TodaysSchedule.tsx` — **new**, chronological day view with context actions
- `src/components/nurse/command-centre/AssignPatientPopover.tsx` — **new**, picks a patient for a chair
- `src/hooks/useCommandCentre.ts` — broader treatment query, today's appointments query
- `src/pages/nurse/NurseJobCard.tsx` — recovery from `pending` treatment state

### Out of scope for this round
- The "Today's Patients" page itself stays (admin/historical view) but is no longer part of the daily nurse loop.
- No changes to the Job Card stepper visual itself beyond the recovery fix.
- Wall-monitor-only "presentation mode" (huge fonts, no nav) — can come next if you want it.
