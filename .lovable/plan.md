

## Plan: Enhance Form Section Styling + Persist Import Data

### Two Issues

**1. Sections need more visual punch with the brand blue**
Currently section headers use `bg-primary/[0.06]` which is very subtle. Info text blocks also lack hierarchy. Need stronger blue accents.

**2. Navigating away loses imported form data**
After AI extraction, the imported schema is held in React state (`importedSchema`, `importedName`, etc. in `AdminFormTemplates.tsx`). If the user navigates away before saving, all state is lost. Need to persist to `sessionStorage` so it survives navigation.

### Changes

#### A. `src/components/forms/FormRenderer.tsx` — Stronger section styling

- Section headers: increase `bg-primary/[0.06]` to `bg-primary/[0.08]`, add a 3px left border in primary color (`border-l-[3px] border-l-primary`), make heading text `text-primary`
- Info text blocks: add a left blue border accent (`border-l-[3px] border-l-primary/40`) to match the clinical design system
- Section card wrapper: keep current subtle shadow but slightly increase border definition

#### B. `src/pages/admin/AdminFormTemplates.tsx` — Persist import data in sessionStorage

- After `handleAIImport` sets the state, also write `{ schema, name, description, category }` to `sessionStorage` under a key like `"pendingFormImport"`
- On component mount (`useEffect`), check `sessionStorage` for pending import data — if found, restore it into state and open the editor
- Clear the sessionStorage entry when the editor closes (either after save or cancel)
- This ensures navigating away and back restores the pending import

### Files

| File | Change |
|------|--------|
| `src/components/forms/FormRenderer.tsx` | Stronger blue accents on section headers and info text |
| `src/pages/admin/AdminFormTemplates.tsx` | Persist/restore import data via sessionStorage |

