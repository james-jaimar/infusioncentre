

## Plan: Improve AI Form Extraction Quality

### Problem

The AI extraction prompt lacks UX/layout guidance. It produces a flat list of fields without understanding the document's visual structure — e.g., fields that belong on the same row (Name + Age), Yes/No questions that should be radio buttons, condition checklists that should be structured tables with a "Details" column, and informational sections that need clear visual hierarchy.

### What the Document Contains

The Iron Infusion Pre-Questionnaire has a specific layout pattern:
1. **Header fields in rows**: Name + Age on one line, Current Weight + Ideal Weight on another, Pregnant (Yes/No) + Gestation + Pre-pregnancy weight
2. **Simple Yes/No questions** with conditional follow-ups (e.g., "Had iron infusion before?" → if yes, "any reactions?" → if yes, describe)
3. **A conditions checklist table**: 11 medical conditions, each with a Yes checkbox and a Details text field
4. **Multiple info sections** with headings: What is an iron infusion, Preparation, During, Side Effects, Rare Side Effects, After Discharge
5. **Signature + Date** at the end

### Solution

Enhance the system prompt in the Edge Function with detailed UX/layout instructions so the AI produces a well-structured, clinical-quality digital form.

### Changes to `supabase/functions/extract-form-template/index.ts`

**1. Add layout hints to the field type reference:**

Add a new `layout_hint` property to the schema that tells the FormRenderer how to position fields. Values: `"inline"` (pair with next field on same row), `"full"` (take full width). This lets the AI express "Name and Age go side by side."

**2. Expand the system prompt with UX rules:**

```
LAYOUT & UX RULES:
- When the original document places fields on the same line (e.g., "Name: ___ Age: ___"), 
  add "layout_hint": "inline" to signal they should render side-by-side.
- Yes/No questions → use "radio" with options ["Yes", "No"], NOT a checkbox.
- Conditional follow-ups (e.g., "If yes, describe...") → use "textarea" with a 
  "conditional_on" property referencing the parent field and expected value.
- When the document has a table of conditions with Yes/Details columns, use a 
  "checkbox_group" is WRONG. Instead, create individual fields per condition row: 
  a radio (Yes/No) + a text field for details, grouped under a section_header.
  OR better: use "substance_table" field type with rows=conditions and columns=["Yes","Details"].
- Informational headings ("What is an iron infusion?") → section_header, followed by 
  info_text with the FULL content.
- Always end clinical questionnaires with a date field and signature field.
- Group logically: patient demographics first, then clinical questions, then 
  information sections, then consent/signature.
```

**3. Add `layout_hint` and `conditional_on` to the tool schema parameters:**

```json
"layout_hint": { "type": "string", "enum": ["inline", "full"] },
"conditional_on": { 
  "type": "object", 
  "properties": { 
    "field": { "type": "string" }, 
    "value": { "type": "string" } 
  } 
}
```

### Changes to `src/components/forms/FormRenderer.tsx`

**4. Support `layout_hint: "inline"` in the field grouping logic:**

Currently `isShortField` pairs consecutive short fields automatically. Enhance this to also respect explicit `layout_hint: "inline"` — when a field has this hint, always pair it with the next field regardless of type.

**5. Support `conditional_on` for conditional visibility:**

Add logic: if a field has `conditional_on: { field: "x", value: "Yes" }`, only render it when `values["x"] === "Yes"`. This creates the "If yes, describe..." UX pattern naturally.

### Changes to `src/components/forms/FormRenderer.tsx` (FormField interface)

**6. Extend the FormField type:**

```typescript
export interface FormField {
  // ...existing
  layout_hint?: "inline" | "full";
  conditional_on?: { field: string; value: string };
}
```

### Files to Change

| Action | File |
|--------|------|
| Edit | `supabase/functions/extract-form-template/index.ts` — Enhanced prompt with UX rules, layout_hint, conditional_on in tool schema |
| Edit | `src/components/forms/FormRenderer.tsx` — Support layout_hint and conditional_on rendering |
| Deploy | Edge function after edit |

### Result

After these changes, re-uploading the Iron Infusion questionnaire will produce a form where:
- Name/Age/Weight fields sit side-by-side
- Yes/No questions are radio buttons, not checkboxes
- "If yes, describe" fields only appear when "Yes" is selected
- The conditions table renders as structured rows
- Info sections have proper headings and full verbatim content
- Date + Signature appear at the end

