

## Plan: Fix Three UI Issues in Form Rendering

### Issues Identified

1. **"List three things" — label runs into numbered inputs**: The question text and the "1." label are combined, so it renders as a long label next to the first text box. The AI prompt needs a rule to handle "List N things" patterns as a numbered list of text fields with a separate question label above them.

2. **Substance table missing a "tick" column**: The original PDF has a tick/checkmark column (implied by the instruction "Tick each substance used") that wasn't captured by the AI. The SubstanceTable columns likely don't include a Yes/No first column. The AI prompt needs reinforcement that substance use tables with "tick" instructions should always include a "Yes/No" column first.

3. **Systems review section merging**: Small sub-sections (like "Other problems") get absorbed into the wrong section (e.g., "Heart and Lungs"). This is the existing section separation problem — the AI needs stronger instruction to treat every distinct label/heading as its own section, even when items appear close together on the page.

### Changes

**1. AI Prompt — `extract-form-template/index.ts`**

Add three new rules to `FIELD_TYPES_REFERENCE`:

In **PATTERN RECOGNITION** (section 6):

```
- NUMBERED LIST QUESTIONS: When a question asks the respondent to "list N things" 
  or provides numbered blanks (1. ___ 2. ___ 3. ___), create a SEPARATE "info_text" 
  or label field for the question text, then N individual "text" fields labelled 
  "1.", "2.", "3." etc. with layout_hint "inline" so they can pair up. Do NOT embed 
  the question text in the label of the first text field.
```

In **PATTERN RECOGNITION** (section 6), strengthen the substance table tick rule:

```
- SUBSTANCE USE TABLES: When a substance/drug table has instructions like "Tick each 
  substance used" or has a column for ticking/marking, ALWAYS include "Yes/No" as the 
  FIRST column in the columns array. The remaining columns follow (e.g. "Age when first 
  used?", "How much?", etc.). The "Yes/No" column renders as a dropdown, not free text.
```

In **LAYOUT RULES** (section 5), reinforce section separation:

```
- MICRO-SECTION AWARENESS: Standalone items like "Other problems:", "Additional notes:", 
  or "Comments:" that appear between or after larger sections are their OWN fields — do 
  NOT merge them into the preceding section_header. If a line appears as a distinct 
  labelled area with its own input space, it is a separate field, not part of the 
  section above it.
```

**2. Redeploy edge function**

Required after prompt changes.

**3. Re-import the PDF**

To get the improved extraction with the new rules.

### Files Changed

| File | Change |
|------|--------|
| `supabase/functions/extract-form-template/index.ts` | Add 3 new rules to FIELD_TYPES_REFERENCE |

### No renderer changes needed

The `FormRenderer` and `SubstanceTable` already support all the required rendering — the issues are purely in the AI extraction prompt not producing the right schema.

