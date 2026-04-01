

## Plan: Dynamic Date References in Text + Truly Responsive Field Layout

### Problem 1: Date Placeholders in Info Text
The terms section still shows "this ___ day of ___ 20___" as literal text. The AI extraction prompt already has digital upgrade rules, but the info_text content itself needs a mechanism to reference a dynamic date value. Currently there's no way for an info_text block to interpolate form field values.

**Fix**: Add template variable support to info_text rendering in FormRenderer. When info_text content contains `{{field_name}}`, it renders the current value of that field inline. Update the extraction prompt to instruct the AI to use `{{agreement_date}}` (or similar) placeholders within info_text content when the document has inline fill-in-the-blank date references, and place a date field nearby for the user to fill in.

Changes:
- **FormRenderer.tsx** — In the `info_text` case, replace `{{field_name}}` tokens with the corresponding value from `values`, or show a placeholder like "[date]" if not yet filled
- **extract-form-template/index.ts** — Update the DIGITAL UPGRADE RULES to say: "When inline text contains fill-in-the-blank date slots, keep the surrounding text in an info_text block but replace the blanks with `{{field_name}}` template tokens referencing the date field that follows. Example: content becomes 'This agreement will be effective from {{agreement_date}} until treatment is completed.'"
- Redeploy the edge function

### Problem 2: Layout Not Dynamic After Field Removal
The `renderFieldGroup` function pairs fields at render time based on array order, which is correct. But the issue is that when a field is removed from the schema (via the template editor), the pairing logic doesn't reflow — a remaining field that was paired with the deleted one may render alone in a half-width column.

**Fix**: The current logic already handles this correctly in theory (unpaired fields get full width via the `else` branch). The real issue is likely that `layout_hint: "inline"` is baked into the field, forcing it into a pair even when there's no partner.

Changes:
- **FormRenderer.tsx** — When a field has `layout_hint: "inline"` but the next field is missing/hidden/not-inline, render it full-width instead of in a half-width grid. The fix is in `renderFieldGroup`: only create a 2-col grid when BOTH adjacent fields want to be inline. This is already the intent of the code, so the bug may be that `isShortField` auto-inlines fields (text, number, date, select) even without a partner. Fix: when there's no valid next field, always render full-width regardless of `isShortField`.

This is actually already handled by the `if/else` at line 108 — if `nextVisible` is false or `next` doesn't exist, it falls through to single-column. So the layout should already reflow. The issue might be that the removed field is still in the schema array (just empty/hidden). Need to verify how field removal works in the template editor.

- **FormRenderer.tsx** — No change needed if field removal actually removes from the schema array. If fields are just hidden, add a filter step before `renderFieldGroup`.

### Summary of File Changes

| File | Change |
|------|--------|
| `src/components/forms/FormRenderer.tsx` | Add `{{field_name}}` interpolation in info_text rendering |
| `supabase/functions/extract-form-template/index.ts` | Update digital upgrade rules to use `{{field_name}}` template tokens in info_text for inline date/name references |
| Redeploy edge function | Required |

### Re-import Required
After these changes, the user will need to re-upload the PDF to get a fresh extraction with the new template token approach. Existing saved form schemas won't automatically update.

