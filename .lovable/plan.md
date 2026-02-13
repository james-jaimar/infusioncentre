

# Master Redesign: Private Medical Centre Clinical Platform

## What Changes

This redesign transforms every visual layer of the platform — from foundational design tokens through to the key clinical screens. The goal is to shift from a "startup SaaS admin panel" feel to a **premium private medical centre operating system**.

## Phase 1: Design Foundation (Tokens, Fonts, Primitives)

### 1A. Font System
- **Replace** Exo + Poppins with **Inter** (Google Fonts) — a clean, institutional sans-serif with excellent numeric rendering and medical-grade legibility
- Update `index.html` font imports and `index.css` / `tailwind.config.ts` font-family references
- Establish clear hierarchy: Page titles 28px semibold, section headers 18px medium, primary metrics 36px bold, supporting text 14px regular muted

### 1B. Color System Overhaul (`index.css`)
- **Background**: Shift from pure white `#FFFFFF` to soft institutional grey `#F4F6F8`
- **Primary**: Shift from `#3E5B84` (slate blue) to deeper navy `#1F3A5F` — more authoritative
- **Card surfaces**: Stay white `#FFFFFF` for contrast against grey background
- **Border**: Softer `#D8E0E6` instead of current `#E5E5E5`
- **Add clinical state CSS custom properties**:
  - `--state-success` / `--state-success-soft` for Running/Stable (muted green)
  - `--state-warning` / `--state-warning-soft` for Monitor/Due (warm amber)
  - `--state-danger` / `--state-danger-soft` for Critical (deep red)
  - `--state-info` / `--state-info-soft` for Pre-assessment (muted blue)
  - `--state-neutral` / `--state-neutral-soft` for Completed (grey)

### 1C. Radius + Shadow System
- **Radius**: Change `--radius` from `0rem` (square) to `6px` — institutional, not bubbly
- **Shadows**: Add utility classes for `shadow-clinical-sm`, `shadow-clinical-md`, `shadow-clinical-lg` with very subtle depth

### 1D. Component Primitives
- **Card** (`card.tsx`): Add `shadow-clinical-md` default, use `rounded-md` (6px)
- **Badge** (`badge.tsx`): Keep pill shape but add clinical state variants (`success`, `warning`, `danger`, `info`, `neutral`)
- **Button** (`button.tsx`): Slightly increase default height, use 6px radius
- **Progress** (`progress.tsx`): Reduce height to 8px with rounded ends for infusion bars

### Files changed:
- `index.html` — font import
- `src/index.css` — full token overhaul + clinical state utilities
- `tailwind.config.ts` — colors, radius, shadows, fonts
- `src/components/ui/card.tsx` — shadow + radius
- `src/components/ui/badge.tsx` — clinical state variants
- `src/components/ui/button.tsx` — radius + sizing
- `src/components/ui/progress.tsx` — slimmer clinical bar

## Phase 2: Layout Shell

### 2A. Nurse Layout (`NurseLayout.tsx`)
- Sidebar: Deep navy `#1F3A5F` background (using new primary)
- Main content area: Soft grey `#F4F6F8` background
- Navigation links: Slightly more spacing, subtle left-border accent on active item instead of background highlight
- User section: Cleaner typography hierarchy

### 2B. Admin Layout (`AdminLayout.tsx`)
- Same sidebar treatment as nurse layout for consistency
- Main area uses institutional grey background

### 2C. Login Page (`Login.tsx`)
- Full institutional grey background
- Card with subtle shadow and 6px radius
- Logo prominent, restrained typography
- Remove "Sign in to your account" heading bloat — keep it clean

### Files changed:
- `src/components/layout/NurseLayout.tsx`
- `src/components/layout/AdminLayout.tsx`
- `src/pages/Login.tsx`

## Phase 3: Command Centre Redesign

The Command Centre transforms from a basic card grid into a **Clinical Operations Board**.

### Chair Cards — Complete Visual Overhaul
Each occupied chair card gets:
- **4px left border** colour-coded by state (green=running, amber=monitor, blue=pre-assessment)
- **Soft tinted background** matching state (e.g. `bg-[#E6F3EE]` for running)
- **Patient name** large and prominent (18px semibold)
- **Treatment type** as a subtle text label, not a coloured badge
- **Elapsed time** displayed large and dominant (monospace, 28px+)
- **Infusion progress bar** — subtle 8px bar showing time elapsed vs expected duration
- **Vitals indicator strip** — compact row showing last BP/HR/O2 inline
- **Status chip** in upper-right corner using clinical state colours
- **"Open Session" button** — strong, full-width, institutional

Empty chairs:
- Neutral grey background, muted border
- Minimal visual weight — clearly "available"

### Summary Stats Row
- Add a top-level stats strip: Active Infusions count, Chairs in Use, Alerts count
- Clean, metric-focused — large numbers with supporting labels

### Unassigned Treatments Card
- Amber left border accent
- Cleaner row layout with better spacing

### Files changed:
- `src/pages/nurse/NurseCommandCentre.tsx` — full redesign

## Phase 4: Treatment Session (Job Card) Redesign

### Header Strip (`JobCardHeader.tsx`)
- Patient name dominant (22px semibold)
- DOB/age, diagnosis info on second line
- Allergies banner: controlled deep red tint background, not screaming
- Chair number, session time window, and clinical state as compact metadata
- Subtle bottom border separation

### Treatment Timer
- Elapsed time rendered at **36px bold monospace** — the primary metric
- Subtle label above: "Elapsed Time"
- Sits in a slightly elevated card with institutional feel

### Stepper (`JobCardStepper.tsx`)
- Steps use subtle background tints matching clinical states
- Active step gets a left-border accent line
- Completed steps show muted with check icon
- Clean horizontal layout with better spacing

### Vitals Card (`JobCardVitals.tsx`)
- Countdown badge with clinical state colours (green/amber/red)
- Latest vitals displayed as a structured grid with icon + label + value
- History section: cleaner table-like layout

### Medications, IV Access, Reactions, Billing Cards
- All cards get consistent 24px padding, 6px radius, subtle shadow
- Section headers: 18px medium weight
- Better internal spacing using 8px grid

### Sticky Action Bar (`JobCardActions.tsx`)
- Cleaner backdrop blur
- Buttons with institutional styling
- Emergency button: deep red, controlled

### Files changed:
- `src/pages/nurse/NurseJobCard.tsx`
- `src/components/nurse/JobCardHeader.tsx`
- `src/components/nurse/JobCardStepper.tsx`
- `src/components/nurse/JobCardVitals.tsx`
- `src/components/nurse/JobCardActions.tsx`
- `src/components/nurse/JobCardSidebar.tsx`
- `src/components/nurse/JobCardBilling.tsx`
- `src/components/nurse/JobCardMedications.tsx`
- `src/components/nurse/JobCardIVAccess.tsx`
- `src/components/nurse/JobCardReactions.tsx`
- `src/components/nurse/JobCardKetaminePanel.tsx`

## Phase 5: Admin Dashboard Polish

- Stat cards: Subtle shadow, institutional colours
- Today's appointments: Cleaner list with left-border state indicators
- Quick actions: More restrained, less "click me" energy

### Files changed:
- `src/pages/admin/AdminDashboard.tsx`

## What Does NOT Change

- **All functionality** stays identical — no database changes, no hook changes, no routing changes
- **Tablet/gloved-hand optimisations** from previous work are preserved (48px touch targets, tap grids, sheet sidebar)
- **Public-facing pages** (home, services, training) keep the current brand — this redesign targets the clinical operations platform only

## Design Principles Enforced

Every element will be checked against:
1. Does it increase **clarity**?
2. Does it increase **safety**?
3. Does it increase **hierarchy**?
4. Does it increase **confidence**?

If not — it gets removed.

## Total Files Changed: ~22

All changes are CSS/component-level. No database migrations, no new dependencies, no breaking changes.

