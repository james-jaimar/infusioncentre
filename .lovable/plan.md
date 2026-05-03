# Give admins full control over Universal form packs

## Problem

In **Settings → Form Packs**, every row whose `required_for_treatment_types` is `null` shows all treatment-type checkboxes as **checked and disabled**, and the "Universal" badge is read-only. There is no way to:

1. Convert a Universal form into a targeted one (e.g. only Ketamine).
2. Convert a targeted form back to Universal without re-clicking every checkbox.
3. Tell at a glance which treatment types a Universal form actually applies to (since the database value is `null`, not the full list).

Result: several forms that are wrongly tagged Universal cannot be corrected from the UI.

## Fix

Make the **Universal** column an editable toggle (Switch) and unlock the per-type checkboxes whenever Universal is off.

### Behaviour

- **Universal column** becomes a Switch (not a static badge).
  - On → form is universal. Per-type checkboxes are visually shown as ticked but disabled (current behaviour).
  - Off → per-type checkboxes become editable; admin picks specific treatment types.
- **Toggling Universal off** seeds the assignments with an empty array (admin must pick at least one type, with an inline warning if none selected).
- **Toggling Universal on** clears the per-type selection back to `null`.
- **Save** persists `required_for_treatment_types`:
  - Universal on → `null`
  - Universal off + selections → array of type IDs
  - Universal off + no selections → block save with a toast ("Pick at least one treatment type or mark as Universal").

### Small UX additions

- Show a tooltip on the Universal switch: *"Universal forms are required for every treatment type. Turn off to restrict this form to specific types."*
- Keep the "unsaved changes" Save button at the top (already present).
- Sort rows so Universal forms appear first (optional, low priority).

## Files to change

- `src/components/admin/settings/FormPackConfigTab.tsx`
  - Replace the Universal `<Badge>` with a `<Switch>`.
  - Track universal state per row in the `changes` map (extend shape to `{ universal: boolean, types: string[] }` or use a sentinel like `null` vs `string[]`).
  - Update `getAssignments` / `toggleAssignment` to respect the universal flag.
  - Update `handleSave` validation and payload.

No schema changes, no migrations. Purely a UI fix on top of the existing `required_for_treatment_types` column.
