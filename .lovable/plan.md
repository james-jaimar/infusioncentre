

## Plan: Fix Public Form Responsiveness + Branding

### Problems

1. **Layout too narrow** — `max-w-3xl` (768px) constrains the header, identity card, and form content, wasting most of the screen on laptops/desktops
2. **Branding is generic** — Header just says "D.I.S Infusion Centre" in plain text with no logo or proper brand styling

### Changes

**File: `src/pages/PublicForm.tsx`**

1. **Widen layout** — Change `max-w-3xl` to `max-w-5xl` (1024px) on the header inner div, main content area, and all contained cards. This fills ~80% of a laptop screen while still being comfortable on mobile.

2. **Responsive header** — Make the header full-width with proper padding that scales: `px-4 sm:px-6 lg:px-8`. Use the brand navy (`bg-primary`) already in place but add a subtle bottom gradient or heavier shadow for depth.

3. **Brand polish** — Update the header to use the clinic's proper name styling with slightly larger text on desktop (`text-xl sm:text-2xl`), and add a subtle clinic icon or medical cross from Lucide if no logo asset is available.

4. **Form content width** — The FormRenderer already handles 2-column grids via `sm:grid-cols-2`. With the wider container, fields will have more breathing room automatically.

5. **Identity card** — Widen to match the new container. The existing `grid grid-cols-1 sm:grid-cols-2` layout will naturally benefit.

### Technical Detail

Only one file changes: `src/pages/PublicForm.tsx`. All `max-w-3xl` references become `max-w-5xl`. Padding adjusts responsively. No FormRenderer changes needed — it already responds to available width.

