

## Plan: Consolidate to Single Date Field with Dynamic References

### Problem

The AI extraction creates multiple redundant date fields ("Agreement Effective Date", "Date", "Dated at") when the document only needs one date. The inline text "This agreement will be effective from this ___ day of ___" should dynamically display that single date via a `{{field_name}}` token.

### Changes

**File: `supabase/functions/extract-form-template/index.ts`**

Update the DIGITAL UPGRADE RULES section (around line 36-42) to add a consolidation rule:

- Add: "When a document contains multiple date-related blanks that all refer to the same event (signing date, agreement date, etc.), consolidate them into a SINGLE date field. Use `{{field_name}}` tokens in any info_text blocks that reference that date. Do NOT create separate 'Agreement Effective Date', 'Date', and 'Dated at' fields — one date field is sufficient. Place it near the signature at the bottom of the form."
- Clarify: "For forms with a signature section, provide exactly ONE date field alongside the signature. Any inline references to that date in the body text should use `{{date}}` or `{{agreement_date}}` tokens."

### Deployment

Redeploy the `extract-form-template` edge function. User will need to re-import the PDF.

