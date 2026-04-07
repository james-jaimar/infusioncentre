

## Plan: "Facsimile" Render Mode — Pixel-Perfect Forms Built in Pure React/CSS

### Idea

Instead of overlaying fields on PDF images (fragile, alignment issues), introduce a third `render_mode` called `"facsimile"`. This is a **custom React component per form template** that recreates the document's exact visual layout using CSS Grid, borders, and typography — like a digital carbon copy. The patient fills in a form that *looks* like the original PDF but is built entirely with HTML/CSS.

### How It Works

```text
┌─────────────────────────────────────────────────┐
│  PHARMACHEM (logo area)          MOTIVATION FOR │
│  Monofer®/CosmoFer® Iron IV Infusion           │
├───────────────┬─────────────────────────────────┤
│ Patient Name  │ [___________________________]   │
├───────────────┼─────────────────────────────────┤
│ Date of Birth │ [__________]  │ Weight │ [____] │
├───────────────┴─────────────────────────────────┤
│ Product:  ☐ Monofer 1000mg   ☐ CosmoFer 500mg  │
├─────────────────────────────────────────────────┤
│ ICD 10 Code:                                    │
│ ☐ D50.0  ☐ D50.8  ☐ D50.9  ☐ D63.0  ☐ D63.8  │
├─────────────────────────────────────────────────┤
│ Signature: [signature pad]    Date: [________]  │
└─────────────────────────────────────────────────┘
```

All built with `<div>`, `<table>`, borders, and the existing form input components. No images needed.

### Implementation

**1. New component: `MonoferFacsimileForm.tsx`**

A dedicated React component that:
- Uses CSS Grid / HTML tables with thin borders to replicate the exact row-by-row layout of the Monofer PDF
- Embeds existing `<Input>`, `<Checkbox>`, `<SignatureCanvas>` components in the correct cells
- Accepts the same `values` / `onChange` / `readOnly` props as `FormRenderer`
- Styled to look like a printed form: white background, thin black borders, small font sizes, tight spacing

**2. Registry pattern for facsimile forms**

Create a `facsimileRegistry` map: `{ [templateSlug]: ReactComponent }`. When `render_mode === "facsimile"`, look up the component by slug. This allows adding more facsimile forms later without changing routing logic.

**3. Route the renderer**

Update `FullScreenFormDialog` and `PublicForm` to handle `render_mode === "facsimile"`:
- `"schema"` → `FormRenderer` (existing)
- `"pdf_overlay"` → `PdfOverlayRenderer` (existing)
- `"facsimile"` → look up from registry, render with same props

**4. Database**

Set the Monofer template's `render_mode` to `"facsimile"` and its `slug` to `"monofer-motivation"`. No migration needed — `render_mode` column already exists as text.

### Files Changed

| File | Change |
|------|--------|
| `src/components/forms/facsimile/MonoferMotivationForm.tsx` | New: pixel-perfect React/CSS recreation of the Monofer PDF |
| `src/components/forms/facsimile/registry.ts` | New: slug-to-component map |
| `src/components/forms/FullScreenFormDialog.tsx` | Add facsimile renderer branch |
| `src/pages/PublicForm.tsx` | Add facsimile renderer branch |

### Trade-offs

- **Pro**: Perfect fidelity, fully responsive, no PDF images needed, no alignment drift
- **Pro**: Uses existing input components — same validation, same submission pipeline
- **Pro**: Fast to load, accessible, works on all devices
- **Con**: Each unique form layout needs its own component (not auto-generated)
- **Con**: Layout changes to the original form require manual code updates

### Future Enhancement

Once this pattern works well, the AI extraction could generate the facsimile JSX automatically for dense forms — but for now, hand-crafting the Monofer form component gets us a perfect result immediately.

