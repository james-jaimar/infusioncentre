
## Plan: PDF Overlay Form Mode — Pixel-Perfect Interactive Forms

### Problem

Some forms (like this Monofer/CosmoFer motivation form) have very specific layouts: branded headers, two-column prescription tables with tick boxes, ICD-10 code grids, pre-filled facility details, footer disclaimers, etc. Our generic FormRenderer can't replicate this level of layout fidelity. These forms need to look and feel exactly like the original PDF, with interactive fields overlaid on top.

### Solution: "PDF Overlay" Render Mode

Render the original PDF pages as background images, then overlay transparent interactive form fields (text inputs, checkboxes, signatures) at precise positions on top. The patient sees the exact original form and fills it in as if using a real PDF.

### How It Works

```text
┌──────────────────────────────────┐
│  Original PDF page (as image)    │
│  ┌────────────────────┐          │
│  │ [transparent input] │ ← Name  │
│  └────────────────────┘          │
│  ☐ ← tick checkbox              │
│  ┌──────┐                        │
│  │[sign]│ ← signature pad        │
│  └──────┘                        │
└──────────────────────────────────┘
```

### Implementation Steps

**1. Database: Add PDF overlay columns to `form_templates`**

New migration adding:
- `render_mode` enum: `'schema'` (default, current behaviour) or `'pdf_overlay'`
- `pdf_pages` JSONB: array of Supabase Storage URLs for each page image
- `overlay_fields` JSONB: array of positioned field definitions

```json
// overlay_fields example
[
  { "field_name": "patient_name", "field_type": "text", "page": 1,
    "x": 32, "y": 45, "width": 28, "height": 3 },
  { "field_name": "monofer_1000", "field_type": "checkbox", "page": 1,
    "x": 5, "y": 62, "width": 2, "height": 2 },
  { "field_name": "dr_signature", "field_type": "signature", "page": 1,
    "x": 10, "y": 88, "width": 30, "height": 6 }
]
```

Coordinates are percentages of the page dimensions, so they scale to any screen size.

**2. Edge function: Detect complex forms and suggest PDF overlay mode**

Update `extract-form-template` to return a `suggested_render_mode: "pdf_overlay"` flag when it detects the form is too layout-dense for schema rendering (branded headers, multi-column prescription grids, ICD code tables, etc.). The AI's reasoning would note this.

**3. PDF-to-image conversion (edge function)**

New edge function `pdf-to-images` that:
- Receives the uploaded PDF
- Converts each page to a high-res PNG/JPG
- Uploads images to Supabase Storage (`form-pdf-pages` bucket)
- Returns the public URLs

**4. Overlay Field Editor (admin UI)**

New component `PdfOverlayEditor` on the admin form template page:
- Displays each PDF page image at full width
- Admin clicks to place fields, drags to resize
- Field palette on the side (text, checkbox, signature, date, select)
- Each field gets a name, type, and position (x, y, width, height as % of page)
- Save writes `overlay_fields` and `pdf_pages` to the template

**5. PDF Overlay Renderer (patient-facing)**

New component `PdfOverlayRenderer`:
- Renders each page image as a background
- Overlays transparent interactive fields at the stored positions
- Text inputs: borderless, transparent background, matching font size
- Checkboxes: small tick overlays at exact positions
- Signatures: signature pad at the designated area
- Scales responsively using percentage-based positioning

**6. Route the correct renderer**

Update `FullScreenFormDialog` and `PublicForm` to check `render_mode`:
- `'schema'` → existing `FormRenderer` (no change)
- `'pdf_overlay'` → new `PdfOverlayRenderer`

**7. Submission**

The overlay form collects values in the same `Record<string, any>` format as schema forms. The existing submission pipeline (edge function, PDF generation, email) works unchanged.

### Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_pdf_overlay.sql` | Add `render_mode`, `pdf_pages`, `overlay_fields` columns |
| `supabase/functions/pdf-to-images/index.ts` | New edge function: PDF → page images → Storage |
| `supabase/functions/extract-form-template/index.ts` | Add complexity detection, suggest overlay mode |
| `src/components/forms/PdfOverlayRenderer.tsx` | New: renders PDF pages with interactive overlay fields |
| `src/components/forms/PdfOverlayEditor.tsx` | New: admin drag-and-drop field placement on PDF pages |
| `src/components/forms/FullScreenFormDialog.tsx` | Route to correct renderer based on `render_mode` |
| `src/pages/PublicForm.tsx` | Route to correct renderer based on `render_mode` |
| `src/pages/admin/AdminFormTemplates.tsx` | Add overlay editor option for PDF overlay templates |

### Phased Delivery

This is a large feature. Recommended build order:

1. **Phase 1**: Database migration + `PdfOverlayRenderer` component + manual JSON field placement (admin pastes overlay config)
2. **Phase 2**: `pdf-to-images` edge function + visual drag-and-drop `PdfOverlayEditor`
3. **Phase 3**: AI auto-detection of complex forms + suggested field positions

### Trade-offs

- **Pro**: Pixel-perfect fidelity for complex branded forms
- **Pro**: Patients see the exact form they'd get on paper
- **Pro**: Existing schema forms are completely unaffected
- **Con**: Requires manual field placement by admin (until Phase 3)
- **Con**: PDF page images need storage (~200-500KB per page)
- **Con**: Larger feature scope than schema-only approach
