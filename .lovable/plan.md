

## Plan: Refactor AI Extraction Prompt for Clarity and Coherence

### Problem

The `FIELD_TYPES_REFERENCE` prompt has grown organically over many iterations. Rules are scattered, duplicated between the system prompt and user message, and organized by "when they were added" rather than by logical concern. This makes it harder for the AI model to follow consistently.

### Approach

Restructure the entire `FIELD_TYPES_REFERENCE` constant into a clean, logically grouped document. No new rules — just reorganize and deduplicate what exists. The system message and user message will also be tightened to avoid repeating instructions.

### New Prompt Structure

The `FIELD_TYPES_REFERENCE` will be reorganized into these sections, in this order:

```
1. CORE PRINCIPLES (3 bullet points — extract only, preserve order, verbatim text)
2. FIELD TYPE CATALOGUE (the 16 types, unchanged)
3. FIELD NAMING (unique snake_case rule)
4. DIGITAL UPGRADE RULES (paper→digital input conversions, template tokens, date consolidation)
5. LAYOUT RULES (inline pairing, section separation, semantic grouping, density)
6. PATTERN RECOGNITION (Yes/No→radio, conditional follow-ups, checkbox+detail, checkbox grids, condition/checklist tables, info headings)
```

Key deduplication:
- "Extract ONLY what is present" appears 3 times currently (CRITICAL RULES, system message, user message) → once in CORE PRINCIPLES, brief reminder in system message
- "Preserve ALL text verbatim" appears in CRITICAL RULES, info_text description, digital upgrade rules, and user message → once in CORE PRINCIPLES, kept in info_text description since it's field-specific
- Date consolidation rule in prompt + `consolidateDateFields` post-processor both stay (belt and braces)
- User message simplified to just describe the task, not repeat rules

### Changes

**File: `supabase/functions/extract-form-template/index.ts`**

1. Rewrite `FIELD_TYPES_REFERENCE` with the clean structure above
2. Simplify the system message to: role description + "Follow the rules in the reference below" + `${FIELD_TYPES_REFERENCE}` + "Use the extract_form_schema tool"
3. Simplify user message text to just describe what the document is and the task — remove duplicated rule reminders
4. No changes to `TOOL_SCHEMA`, `consolidateDateFields`, error handling, or any other logic

### Redeploy

Redeploy the `extract-form-template` edge function. Re-import a PDF to verify results are equal or better.

