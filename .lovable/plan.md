

## Plan: Semantic Field Grouping for Signatures + Related Fields

### Problem

The form has two signature blocks (Patient signature + ID number, Representative signature + ID number), but the layout engine pairs fields purely by adjacency and type. This means "ID number" gets paired with another "ID number" or floats separately, rather than sitting directly below its related signature.

### Solution

Introduce a `group` property to the form schema that lets the AI extraction (and the renderer) semantically group related fields into visual blocks.

### Changes

**1. Update FormField interface** (`src/components/forms/FormRenderer.tsx`)
- Add `group?: string` to the `FormField` interface

**2. Update `renderFieldGroup` logic** (`src/components/forms/FormRenderer.tsx`)
- Before pairing fields, detect consecutive fields sharing the same `group` value
- Render grouped fields together in a single visual container (e.g., a `div` with subtle styling)
- Within a group, apply the existing inline/full-width pairing logic
- Ungrouped fields continue to use the current pairing behaviour

**3. Update extraction prompt** (`supabase/functions/extract-form-template/index.ts`)
- Add to LAYOUT & UX RULES: "When a signature field has associated fields (e.g., ID number, printed name, date) that belong to the same signatory, assign them the same `group` value (e.g., `group: 'patient_signature_group'`). This ensures they render as a visual unit."
- Add `group` to the tool schema's field properties

**4. Redeploy edge function**

### Rendering Behaviour

```text
Before (flat pairs):
┌──────────────┐ ┌──────────────┐
│ Date picker  │ │ Patient sig  │
├──────────────┤ ├──────────────┤
│ ID number    │ │ Rep sig      │
├──────────────┤
│ ID number    │
└──────────────┘

After (semantic groups):
┌─────────────────────────────────┐
│ Date    │ Patient sig           │
│         │ ID number             │
└─────────────────────────────────┘
┌─────────────────────────────────┐
│ Rep sig           │             │
│ ID number         │             │
└─────────────────────────────────┘
```

Actually, a simpler and more flexible approach: render each group as a 2-column grid where the fields flow naturally within the group boundary, rather than across groups.

### Technical Detail

- `group` is optional; ungrouped fields behave exactly as today
- The renderer collects consecutive fields with the same `group` into a sub-array, then calls `renderFieldGroup` on each sub-array independently
- This prevents cross-group pairing (an ID number from one signature block pairing with a field from another)
- The AI prompt change ensures new extractions produce the `group` metadata; existing forms without `group` are unaffected

