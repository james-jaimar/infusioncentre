

## Plan: Allow Smart UX Upgrades While Keeping Text Verbatim

### Problem

The extraction prompt is now too restrictive. It faithfully reproduces paper-form artifacts (like "dated at ___ this ___ day of ___ 20___" as four separate text boxes) instead of recognising these as a date and using a proper date picker. The text content is correct, but the **input method** should be modernised.

### Approach

Add a new "DIGITAL UPGRADE RULES" section to the system prompt that explicitly grants permission to convert paper-form input patterns into their proper digital equivalents, while keeping all informational/legal text verbatim.

### Changes

**File: `supabase/functions/extract-form-template/index.ts`**

Update the system prompt and FIELD_TYPES_REFERENCE to add these rules:

**Add after the CRITICAL RULES block (around line 34):**

```
DIGITAL UPGRADE RULES (input methods only — never alter text content):
- When the document uses blank lines, underscores, or split fields to collect a DATE (e.g. "this ___ day of ___ 20___", "Dated at ___ this ___"), replace them with a SINGLE "date" field. Do NOT reproduce the paper layout with multiple text boxes.
- When the document uses blank lines or underscores for a SIGNATURE, use a single "signature" field.
- When the document uses blank lines for a NAME, ADDRESS, or other obvious single value, use a single "text" field — not multiple text boxes replicating the paper underscores.
- When inline text contains fill-in-the-blank slots (e.g. "This agreement will be effective from this ___ day of ___ 20___"), convert the surrounding text to an "info_text" block and place the appropriate input field(s) immediately after it. Do NOT embed blanks as literal text boxes within a sentence.
- These upgrades apply ONLY to input collection methods. All informational text, legal clauses, terms, bullet points, and clinical content MUST remain verbatim and unmodified.
```

**Update user prompt text (lines 176 and 182)** to add: "You MAY upgrade paper-form input patterns (blank lines, underscores, split date fields) into proper digital inputs (date pickers, single text fields, signatures), but all informational and legal text must remain verbatim."

### Deployment

Redeploy the `extract-form-template` edge function. User will need to re-import the PDF to see the improved extraction.

