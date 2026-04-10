

## Plan: Allow Public Form Links for All Render Modes

### Problem
The slug field and public link button are currently only available for forms with `render_mode === "facsimile"`. The Ketamine Questionnaire (likely using "schema" or "pdf_overlay" mode) lost its link option because slug assignment is gated behind facsimile mode.

### Changes

**File: `src/pages/admin/AdminFormTemplates.tsx`**

1. **Move the slug input out of the facsimile-only block** — Allow entering/editing a slug for all render modes. Change it from a `<Select>` of facsimile slugs to a text `<Input>` (or keep the Select but also allow free-text), so any form can have a custom slug regardless of render mode.

2. **Keep the facsimile slug select as an additional option** — When render_mode is facsimile, show the existing dropdown of available facsimile slugs. For other modes, show a small text input where the admin can type a slug.

3. **Stop clearing slug on mode change** — Remove `slug: null` from line 255 so changing render mode doesn't wipe the slug.

4. **Link button stays as-is** — It already works for any form with a slug set (line 310), so no change needed there.

### Technical Detail

- Line 255: Remove `...(val !== "facsimile" ? { slug: null } : {})` from the mode change handler
- Lines 271-292: Move slug editing outside the `t.render_mode === "facsimile"` condition. For facsimile, keep the existing Select. For other modes, add a small Input + save button for slug entry.

### Result
All form templates can have a slug and a copyable public link, regardless of render mode.

