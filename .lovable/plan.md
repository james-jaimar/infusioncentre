

# Command Centre — Reference Image Rebuild

## Approach

Adapt the user-provided reference component code to work with the existing HSL-based design system tokens (`clinical-success`, `clinical-warning`, etc.) rather than adding conflicting RGB tokens. The existing `index.css` and `tailwind.config.ts` already have all needed color tokens.

## Token Mapping (no file changes needed)

The reference code uses `oksoft`, `warnsoft`, etc. These map directly to existing tokens:

| Reference Token | Existing Token |
|---|---|
| `ok` / `oksoft` | `clinical-success` / `clinical-success-soft` |
| `warn` / `warnsoft` | `clinical-warning` / `clinical-warning-soft` |
| `danger` / `dangersoft` | `clinical-danger` / `clinical-danger-soft` |
| `info` / `infosoft` | `clinical-info` / `clinical-info-soft` |
| `surface` | `card` (white) |
| `surface2` | `muted` |
| `muted` (text) | `muted-foreground` |
| `text` | `foreground` |
| `primary` | `primary` |

No changes to `index.css` or `tailwind.config.ts` required.

## Files Changed

### 1. `src/pages/nurse/NurseCommandCentre.tsx` — Full rewrite

Replace the entire page with the reference layout structure:
- Thin header row with "Clinical Operations" title + live clock + active badge
- 12-column grid (`md:grid-cols-12`): 8-col primary zone + 4-col monitoring sidebar
- Primary zone contains a Card wrapping the 2-col chair grid, plus a secondary row with "Unassigned Treatments" and "Upcoming Sessions" side by side
- Monitoring sidebar with Live Alerts, Quick Stats (stacked cards)
- All data wired from the existing `useCommandCentre` hook

### 2. `src/components/nurse/command-centre/ChairPanel.tsx` — Rewrite to match reference

Key styling changes:
- Left accent stripe via CSS `before:` pseudo-element (4px wide, state-colored)
- Soft tinted gradient background per state (`bg-gradient-to-b from-clinical-success-soft/70 to-card/80`)
- State badge with border styling (`border border-clinical-success/20`)
- Chair number + icon in header, state badge right-aligned
- Patient name 18px semibold, treatment type muted
- Elapsed timer (reuse existing `ElapsedTimer` component)
- Duration metadata (expected + remaining)
- Custom progress bar (styled div, not default shadcn Progress) with state-colored fill
- Vitals strip row with icon + label + overdue badge
- "Open Session" button full-width, h-14
- Available chairs: compact, neutral styling with ghosted icon

### 3. `src/components/nurse/command-centre/MonitoringSidebar.tsx` — Restyle

- Alert rows with colored left dot, title + subtitle, time right-aligned
- Quick Stats as minimal text rows (active infusions, chairs available, avg duration)
- Tighter padding (p-4), compact spacing

### 4. `src/components/nurse/command-centre/UpcomingSessions.tsx` — Integrate into primary zone

Move upcoming sessions into the primary zone's secondary row (side by side with unassigned treatments) instead of being a standalone bottom section.

### 5. `src/components/nurse/command-centre/ElapsedTimer.tsx` — No changes needed

Already correctly styled with monospace font.

### 6. `src/components/nurse/command-centre/VitalsCountdown.tsx` — No changes needed

Already works as inline badge.

## Key Visual Details from Reference

- Cards use `rounded-xl` (16px) with `shadow-md` for soft institutional feel
- Left accent stripe is a `before:` pseudo-element: `before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl`
- State tint backgrounds use gradients: `bg-gradient-to-b from-[state-soft]/70 to-card/80`
- Progress bar is a custom div (not shadcn Progress) with state-colored fill and rounded corners
- Sidebar cards have subtle borders and compact internal spacing
- The entire layout should fit on a single tablet screen without scrolling

