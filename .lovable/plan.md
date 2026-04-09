

## Plan: Fix Facsimile Form Validation and Identity Resolution

### Problem
Two issues with facsimile form submission:

1. **"Missing: Service Consent" error**: The required-field validation (lines 168-179 of `PublicForm.tsx`) scans `template.form_schema` for required fields. For facsimile forms, this schema contains legacy extracted fields (like "Service Consent") that the facsimile React component doesn't use. These will never be populated, so validation always fails.

2. **Identity resolution uses wrong field names**: The facsimile handler looks for `pt_tel` and `patient_phone` for phone, but the Monofer form actually uses `patient_contact` (line 197). Similarly, the form has both `patient_full_name` (consent page) AND `pt_name`/`pt_surname` (motivation page) — both should be checked.

### Changes

**File: `src/pages/PublicForm.tsx`**

1. **Skip schema-based required-field validation for facsimile forms**: When `isFacsimile` is true, skip the `missingRequired` check entirely — facsimile forms manage their own layout and required fields are implicit in the document structure.

2. **Fix identity field name resolution for facsimile**:
   - Phone: add `patient_contact` to the lookup chain: `values.patient_contact || values.pt_tel || values.patient_phone`
   - ID: already correct (`patient_id_number`, `pt_id`)
   - Name: already correct (checks `pt_name`/`pt_surname` first, falls back to `patient_full_name`)

### Result
Facsimile forms submit without false required-field errors. Phone number is correctly extracted from the consent page's `patient_contact` field.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/PublicForm.tsx` | Skip schema required-field check for facsimile; fix phone field name |

