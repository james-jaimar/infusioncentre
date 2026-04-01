

## Plan: Handle Complex Questionnaires with Checkbox+Detail Pattern and Section Separation

### Problem

The ketamine questionnaire has two patterns the AI struggles with:

1. **Section merging**: Distinct sections like "GENERAL", "MUSCLE/JOINTS/BONES", "Referring Psychiatrist", "Current Medication" get lumped together instead of each getting its own `section_header`.

2. **Checkbox + detail pattern**: Items like "Recent weight gain; How much" are checkboxes with an inline follow-up prompt for details. The AI doesn't split these into a checkbox + conditional text field — it either drops the detail part or renders them incorrectly.

### Solution

Update the extraction prompt with two new rule blocks. No frontend changes needed — the existing `checkbox`, `conditional_on`, and `layout_hint: "inline"` primitives already support this rendering.

### Changes

**File: `supabase/functions/extract-form-template/index.ts`**

Add two new rules to the LAYOUT & UX RULES section:

**SECTION SEPARATION rule:**
```
- SECTION SEPARATION: Every visually distinct heading, category label, or 
  bold/underlined group title in the document MUST become its own 
  "section_header" field. Do NOT merge sections. If the document shows 
  "GENERAL" as one heading and "MUSCLE/JOINTS/BONES" as another, those 
  are TWO separate section_headers. When in doubt, create more sections 
  rather than fewer.
```

**CHECKBOX WITH DETAIL rule:**
```
- CHECKBOX WITH DETAIL: When a checkbox item includes a follow-up prompt 
  after a semicolon, comma, or dash (e.g., "Recent weight gain; How much", 
  "Allergies - please list"), split it into TWO fields: (1) a "checkbox" 
  field with the condition name as the label (e.g., "Recent weight gain"), 
  and (2) a "text" field for the detail (e.g., label "How much", with 
  "conditional_on": {"field": "recent_weight_gain", "value": "true"}) and 
  layout_hint "inline". This pattern applies to any checkbox list where 
  some items request additional information when checked.
```

**CHECKBOX GRID LAYOUT rule:**
```
- CHECKBOX GRID LAYOUT: When a section contains a list of checkbox items 
  displayed in multiple columns on the document (e.g., symptoms listed in 
  2-3 columns), use individual "checkbox" fields with layout_hint "inline" 
  so they pair up in a grid. Do NOT use checkbox_group for these — each 
  item needs to be independently checkable with its own field_name.
```

### Deployment

Redeploy the `extract-form-template` edge function. Re-import the PDF to test.

