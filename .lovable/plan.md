

# Command Centre v2: Clinical Operations Board

## Overview

Complete architectural redesign of `NurseCommandCentre.tsx` from a flat card grid into a zoned clinical operations board with a 12-column layout, dedicated monitoring sidebar, and dominant chair panels.

## Layout Architecture

```text
+------------------------------------------------------------------+
| Header: "Clinical Operations"            11:45 AM  * 3 Active    |
+------------------------------------------------------------------+
| PRIMARY OPERATIONS (8 cols)       | MONITORING (4 cols)           |
|                                   |                               |
| +-------------+ +-------------+  | Live Alerts                   |
| | Chair 1     | | Chair 2     |  |   Chair 3: Vitals overdue     |
| | Thandi N.   | | Johan vdM   |  |   Chair 2: Running over       |
| | Iron Inf.   | | Ketamine    |  |                               |
| | 54:01       | | 1:40:23     |  | Unassigned Treatments         |
| | [progress]  | | [progress]  |  |   Sipho D. - IV Vitamin       |
| | [Open]      | | [Open]      |  |   [Assign Chair v]            |
| +-------------+ +-------------+  |                               |
| +-------------+ +-------------+  | Quick Stats                   |
| | Chair 3     | | Chair 4     |  |   3 Active Infusions          |
| | Fatima P.   | | Available   |  |   1 Chair Available           |
| | Biologics   | |             |  |   Avg: 2h 03m                 |
| | 2:16:16     | |             |  |                               |
| | [Open]      | |             |  |                               |
| +-------------+ +-------------+  |                               |
+------------------------------------------------------------------+
| SECONDARY: Upcoming Sessions                                     |
+------------------------------------------------------------------+
```

On tablet portrait (below 1024px), the monitoring sidebar collapses below the primary zone as a full-width section.

## What Changes

### 1. Header -- Thin, Institutional

Replace the current title + 3 large KPI cards with a single thin header row (60-72px):
- Left: "Clinical Operations" title + "Real-time treatment monitoring" subtitle
- Right: Live clock (updates every second), active infusion count with a subtle green dot indicator

The 3 large stat cards at the top are **removed entirely**.

### 2. Primary Operations Zone (8/12 columns)

A container card labeled "Primary Operations" holding all chair panels in a 2-column grid. Only occupied chairs show full panel treatment; available chairs render as compact neutral placeholders.

Chair Panel redesign (each occupied chair):
- **4px left border** colour-coded by state
- **Top row**: Chair icon + name (muted) | State badge (right-aligned)
- **Patient name**: 18px semibold, dominant
- **Treatment type**: 14px muted text below
- **Elapsed time**: 32px monospace bold with clock icon
- **Duration metadata**: "Remaining 1h 05m" or "Overdue 14m" as a small inline indicator
- **Vitals strip**: Inline countdown badge (reuse existing VitalsCountdown)
- **Progress bar**: 8px with state-coloured fill and smooth transition
- **Open Session button**: Full-width, h-14, institutional navy

Available chairs: Minimal card with ghosted chair icon, name, "Available" label -- no stripe, muted border.

### 3. Monitoring and Alerts Zone (4/12 columns)

A new right-side column with three stacked sections:

**Live Alerts**: Computed from existing hook data:
- Vitals overdue: any chair where `lastVitalsAt` or `startedAt` is >15 minutes ago
- Running over expected: any chair where elapsed > 2 hours (default expected)
- Each alert shows: warning icon, "Chair X: Vitals overdue", timestamp, soft state-tinted background

**Unassigned Treatments**: Compact list (moved from bottom), each row shows patient name, treatment type, and inline "Assign Chair" select dropdown.

**Quick Stats**: Three minimal text lines (no decorative cards):
- Active Infusions count (with small clinical-success number)
- Chairs Available count
- Average Session Duration (computed from active treatments)

### 4. Secondary Zone: Upcoming Sessions

A new section below the main grid showing upcoming appointments for today that haven't started yet. This requires a small addition to the `useCommandCentre` hook to fetch today's pending appointments.

### 5. Responsive Behaviour

- **Desktop (1024px+)**: 12-column grid -- 8 cols primary, 4 cols monitoring sidebar
- **Tablet portrait (<1024px)**: Single column -- primary operations full width, monitoring sections stack below
- All touch targets remain 48px+ for gloved use

## Files Changed

| File | Change |
|------|--------|
| `src/pages/nurse/NurseCommandCentre.tsx` | Complete rewrite: zoned layout, new header, monitoring sidebar, alert computation, upcoming sessions |
| `src/hooks/useCommandCentre.ts` | Add `upcomingSessions` query for today's pending/scheduled appointments not yet started |

## No Other Files Change

All design tokens, badge variants, progress component, and layout shell remain as-is from the previous redesign. This is purely a page-level architectural change.

## Data Notes

- Alerts are **derived client-side** from existing `chairs` data (vitals overdue = `lastVitalsAt` or `startedAt` older than 15 min; running over = elapsed > 2hr)
- Upcoming sessions query filters `appointments` table for today's date with status `scheduled` or `confirmed`, ordered by `scheduled_start`
- Average session duration computed from active treatments' `started_at` timestamps
- Live clock uses a single `setInterval` at the page level, shared via state

