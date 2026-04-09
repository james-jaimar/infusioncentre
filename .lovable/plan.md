

## Plan: Fix Email Rendering for Facsimile Form Submissions

### Problem
The `submit-public-form` Edge Function builds its email HTML by iterating over `template.form_schema` — the JSON field definitions. For facsimile templates, this schema is empty or minimal because all fields are defined in the React component code. The result: the notification email either shows nothing or dumps raw key names like `pt_name`, `icd_d508`, `consent_yes`.

### Solution
Add a **facsimile field map** to the Edge Function that provides human-readable labels for each field key used by facsimile forms. When `render_mode === "facsimile"`, skip the schema-based rendering and instead use this map to produce a well-structured email.

### Changes

**File: `supabase/functions/submit-public-form/index.ts`**

1. Add a `FACSIMILE_FIELD_LABELS` constant — a record mapping every field name from MonoferMotivationForm to its display label, grouped by section:
   - Consent section: `patient_full_name` → "Patient Full Name", `consent_yes` → "Consents to Service", etc.
   - Nurse Educator: `nurse_name` → "Nurse Educator Name", etc.
   - HCP Consent: `hcp_consent_name` → "HCP Name", etc.
   - Prescribing Practitioner: `dr_name` → "Doctor Name & Surname", etc.
   - Patient Details: `pt_name` → "Patient Name", `pt_dob` → "Date of Birth", etc.
   - Prescription checkboxes: `rx_monofer_1000` → "Monofer 1000mg", etc.
   - ICD codes: `icd_d508` → "D50.8 — Iron deficiency anaemia", etc.
   - Procedure codes, signatures, dates

2. Add a new function `renderFacsimileToHtml(formName, data, respondent, fieldLabels)` that:
   - Groups fields by section prefix (consent, nurse, hcp, dr, pt, rx, icd, proc)
   - Renders checkboxes as "Yes/No" instead of "true/false"
   - Renders signature fields as embedded `<img>` tags (base64 data URIs)
   - Skips empty/null fields
   - Uses the same branded HTML wrapper (header, footer) as the existing renderer

3. In the main handler, check `template.render_mode`:
   - If `"facsimile"`: call `renderFacsimileToHtml` instead of `renderFormToPdfHtml`
   - Otherwise: use existing `renderFormToPdfHtml` (no change to schema-based forms)

### No other files change
The React components and database are untouched — this is purely an Edge Function improvement for email output quality.

### Result
When a Monofer facsimile form is submitted, Gayle receives a properly formatted email with section headers, human-readable field labels, checkbox values shown as Yes/No, and signature images embedded inline.

