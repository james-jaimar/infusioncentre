

# Tablet & Gloved-Hand Responsiveness Audit

## The Problem
Nurses use tablets with rubber gloves, which means:
- Reduced touch precision (gloves make fingers "fatter")
- No fine-motor actions like hovering or precise small-target taps
- Scrolling is harder with gloves -- fewer, bigger sections are better
- Sliders are particularly difficult with gloves (imprecise drag)

## Issues Found Across Nurse Screens

### 1. Touch Target Sizes (Multiple Files)
Several interactive elements fall below the 48x48px "gloved touch" minimum (44px is bare minimum, but with gloves we should aim for 48px+):

| Component | Issue |
|-----------|-------|
| `JobCardStepper` | Steps have `min-h-[44px]` but are narrow horizontally -- fine, but the connector lines between steps are not tappable targets so this is OK |
| `JobCardBilling` | "Add" button uses default `size="sm"` without explicit height -- needs `h-12 min-w-[48px]` |
| `JobCardBilling` | Delete (trash) icon buttons are `h-7 w-7` -- far too small for gloves |
| `JobCardBilling` | Suggested item badges are small tap targets with no padding |
| `JobCardReactions` | "Mark Resolved" button is `h-9` -- too small |
| `JobCardKetaminePanel` | Collapse toggle is `h-9 w-9` -- borderline, bump to `h-12 w-12` |
| `NurseLayout` sidebar | Nav links use `py-2.5` -- should be `py-3.5` for gloved tapping |
| `NurseLayout` mobile header | Hamburger menu button has no explicit size -- needs `h-12 w-12` |
| `JobCardSidebar` | Phone links and collapsible triggers are small text -- need larger hit areas |
| `NurseCommandCentre` | Elapsed timer text is `text-xs` -- hard to read at arm's length |

### 2. Slider Controls Are Glove-Hostile (JobCardKetaminePanel)
The 5 sliders (alertness, mood, pain, dissociation, anxiety) are very difficult to use with rubber gloves. Sliders require precise horizontal dragging which is nearly impossible with thick gloves.

**Fix**: Replace sliders with large **tap-to-select button grids**. For example, Pain (0-10) becomes a row of 11 large buttons (0 through 10), each 48px+ tall. The selected value gets a filled/highlighted state. This is a single-tap action instead of a drag.

### 3. Dialog Overflow on Tablet (Multiple Dialogs)
Several dialogs use `max-w-md` or `max-w-lg` which work fine, but:
- `JobCardReactions` dialog has many fields and uses `max-h-[90vh] overflow-y-auto` -- good
- `JobCardIVAccess` dialogs do not have max-height/scroll -- could overflow on landscape tablet
- `JobCardMedications` dialog has many fields without scroll protection

**Fix**: Add `max-h-[85vh] overflow-y-auto` to all dialog content areas.

### 4. Layout Responsiveness (NurseJobCard.tsx)
The main job card uses `lg:grid-cols-[300px_1fr]` which means on a typical 1024px tablet in landscape, the sidebar shows beside the content. On portrait (768px), it stacks. This is correct but:
- The sidebar is `order-2 lg:order-1` meaning on tablet portrait, the sidebar renders BELOW the main content -- the nurse has to scroll past all treatment panels to see patient info
- **Fix**: On tablet, move sidebar into a collapsible drawer/sheet that can be toggled, keeping the main treatment flow front and center

### 5. Sticky Action Bar (JobCardActions.tsx)
The sticky bottom bar uses `lg:left-[var(--sidebar-width,0px)]` but `--sidebar-width` is never set as a CSS variable. On desktop with sidebar visible, the action bar extends under the sidebar.

**Fix**: Set `--sidebar-width: 16rem` on the layout root when sidebar is visible, or use `lg:left-64` directly.

### 6. Command Centre Grid (NurseCommandCentre.tsx)
- Grid is `grid-cols-1 md:grid-cols-2` -- good for tablet
- Chair tiles have `min-h-[220px]` -- could be taller for better glove tapping
- The "Open Session" button is `min-h-[44px]` -- bump to `h-14` for gloves

### 7. Font Sizes for Clinical Readability
Several components use `text-xs` for clinical data (vitals history, site checks, medication details). Nurses reading at arm's length on a tablet need larger text.

**Fix**: Bump clinical data text from `text-xs` to `text-sm`, and labels from `text-sm` to `text-base`.

## Implementation Plan

### File Changes

| File | Changes |
|------|---------|
| `src/components/nurse/JobCardKetaminePanel.tsx` | Replace all Slider components with tap-to-select button grids; increase collapse toggle size; bump font sizes |
| `src/components/nurse/JobCardVitals.tsx` | Bump vitals display font sizes; ensure dialog has scroll protection |
| `src/components/nurse/JobCardMedications.tsx` | Add dialog scroll protection; bump button sizes |
| `src/components/nurse/JobCardIVAccess.tsx` | Add dialog scroll protection; bump button and checkbox sizes |
| `src/components/nurse/JobCardReactions.tsx` | Bump "Mark Resolved" button to h-12; increase severity selection button padding |
| `src/components/nurse/JobCardBilling.tsx` | Increase "Add" button to h-12; increase trash icon to h-10 w-10; add padding to suggested badges |
| `src/components/nurse/JobCardActions.tsx` | Fix sidebar offset with `lg:left-64` |
| `src/components/nurse/JobCardSidebar.tsx` | Increase phone link tap area; bump collapsible trigger sizes |
| `src/components/nurse/JobCardHeader.tsx` | Bump badge and info text sizes slightly |
| `src/pages/nurse/NurseJobCard.tsx` | Convert sidebar to a toggleable sheet on smaller screens instead of stacking below |
| `src/pages/nurse/NurseCommandCentre.tsx` | Increase chair tile min-height; bump "Open Session" to h-14; increase timer font sizes |
| `src/components/layout/NurseLayout.tsx` | Increase nav link padding to py-3.5; bump hamburger button size; set --sidebar-width CSS variable |
| `src/components/nurse/JobCardStepper.tsx` | Increase step padding slightly for better touch |

### Key UX Principle Applied
Every tappable element will be minimum 48x48px. Sliders replaced with tap grids. Dialogs scroll-safe. Clinical text readable at arm's length. Sidebar becomes a toggleable panel on tablet to keep the treatment cockpit unobstructed.

