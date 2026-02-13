

# Command Centre v2 — Layout Fix

## The Problem

The current implementation breaks on tablet because:
- The 12-column grid uses `lg:grid-cols-12` (1024px+) — most tablets in portrait are 768-834px, so the grid never activates
- Chair panels have `min-h-[320px]` — far too tall, pushing everything off-screen
- The monitoring sidebar renders below all 4 chairs, requiring extensive scrolling
- Excessive padding and spacing throughout wastes precious viewport space

In the reference image, the chair grid and monitoring sidebar sit side-by-side even on a tablet-width viewport.

## Changes

### 1. NurseCommandCentre.tsx — Grid Breakpoint + Header

- Change `lg:grid-cols-12` to `md:grid-cols-12` so the 8+4 column layout activates at 768px (tablet portrait)
- Add a styled "Active Infusions" badge/chip in the header row matching the reference (green checkmark icon + count + label in a soft tinted container)
- Reduce `space-y-6` to `space-y-4` for tighter vertical rhythm
- Reduce gap between grid columns from `gap-6` to `gap-4`

### 2. ChairPanel.tsx — Compact Cards

- Remove `min-h-[320px]` — let content determine height naturally
- Reduce internal padding from `px-6 pt-5 pb-5` to `px-4 pt-4 pb-4`
- Reduce spacing between internal sections from `space-y-4` to `space-y-3`
- Make the elapsed timer slightly smaller (28px instead of 32px) so cards fit 2-per-row without being enormous
- Available chair card: reduce `min-h-[200px]` to let it be compact, matching the reference's small neutral placeholder
- Reduce "Open Session" button bottom padding

### 3. MonitoringSidebar.tsx — Tighter Sidebar

- Reduce card padding from `p-5` to `p-4`
- Reduce spacing between sections from `space-y-4` to `space-y-3`
- Make alert rows more compact (matching the reference's 2-line alert format with chair name + detail)
- Reduce section header text/margins slightly

### 4. UpcomingSessions.tsx — Compact

- Reduce padding to match sidebar density
- Tighten row spacing

### 5. ElapsedTimer.tsx — Slightly Smaller

- Reduce from `text-[32px]` to `text-[28px]` to allow chair panels to be more compact while still dominant

## Files Changed

| File | Change |
|------|--------|
| `src/pages/nurse/NurseCommandCentre.tsx` | Grid breakpoint `md:`, tighter spacing, active infusions badge |
| `src/components/nurse/command-centre/ChairPanel.tsx` | Remove min-height, compact padding, tighter internal spacing |
| `src/components/nurse/command-centre/MonitoringSidebar.tsx` | Compact padding and spacing |
| `src/components/nurse/command-centre/UpcomingSessions.tsx` | Compact padding |
| `src/components/nurse/command-centre/ElapsedTimer.tsx` | Reduce timer font to 28px |

## Result

The entire Command Centre (header + 4 chair panels + monitoring sidebar) will be visible on a single tablet screen without scrolling, matching the zoned layout from the reference image.
