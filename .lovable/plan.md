

## Plan: Make Render Mode Editable from the Template List

### Problem
The "Render Mode" dropdown is buried inside the full-screen Form Template Editor. The Mode badge shown in the table list is display-only and not clickable, which is confusing.

### Solution
Replace the static Mode badge in the template table with a clickable Select dropdown, allowing admins to change the render mode (and slug for facsimile) directly from the list page without opening the editor.

### Changes

**File: `src/pages/admin/AdminFormTemplates.tsx`**

1. Import `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` and `Input` components
2. Import `availableFacsimileSlugs` from the facsimile registry
3. Import `useUpdateFormTemplate` hook
4. Replace the static `<Badge>` in the Mode column with a small inline `<Select>` dropdown that calls `updateTemplate` on change
5. When "facsimile" is selected, show a small popover or inline input for the slug assignment
6. Use `updateTemplate.mutateAsync` to persist the change immediately

This gives admins a one-click way to switch any template between Schema, PDF Overlay, and Facsimile modes right from the table view.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/admin/AdminFormTemplates.tsx` | Replace Mode badge with inline Select; add slug input for facsimile |

