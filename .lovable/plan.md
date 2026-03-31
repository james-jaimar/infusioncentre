

## Plan: Make Form Extraction Strictly Verbatim

### Problem

The AI extraction prompt contains instructions that encourage the model to **add content not present in the original document**:
- "Group logically: patient demographics first, then clinical questions..." (reorders content)
- "Always end clinical questionnaires with a date field and signature field" (adds fields)
- "For consent forms: include all terms/conditions as info_text blocks, then a checkbox for acknowledgment, then signature fields" (adds fields)
- The general tone encourages "beautiful, usable digital forms" which the AI interprets as license to embellish

### Fix

**File: `supabase/functions/extract-form-template/index.ts`**

Update the system prompt and field type reference to enforce strict verbatim extraction:

1. **Remove all "add if missing" instructions** — delete the rules about always ending with date/signature, adding acknowledgment checkboxes, and reordering sections
2. **Add explicit prohibition** — "Do NOT add any fields, sections, text, or content that is not explicitly present in the source document. Do NOT reorder sections. Maintain the exact order and structure of the original document."
3. **Change system role description** — from "produce beautiful, usable digital forms" to "produce exact digital replicas of the source document"
4. **Update user prompt text** — reinforce "Extract ONLY what is in the document. Do not add, infer, or supplement any fields or content."

### Specific Prompt Changes

In `FIELD_TYPES_REFERENCE` critical rules section, replace:
- "For consent forms: include all terms/conditions..." → remove
- "Always end clinical questionnaires with a date field and signature field" → remove  
- "Group logically: patient demographics first..." → "Preserve the exact order of sections and fields as they appear in the source document. Do NOT reorder."

Add new rule:
- "NEVER add fields, sections, or content that do not exist in the source document. Extract ONLY what is visually present on the page."

In system prompt, change:
- "convert them into structured JSON form schemas that produce beautiful, usable digital forms" → "convert them into structured JSON form schemas that are exact digital replicas of the source document"

### Deployment

Redeploy the `extract-form-template` edge function after changes. The user will need to re-import the PDF to get a clean extraction.

