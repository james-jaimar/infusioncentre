

## Plan: Fix Name Resolution for Facsimile Form Submissions

### Problem
When submitting the Monofer facsimile form, it always errors with "Please fill in your name" because:

1. The template's `form_schema` is empty (facsimile fields live in React code, not JSON schema)
2. `detectIdentityFields` scans the empty schema, finds nothing, so it shows the hardcoded First/Last name inputs at the top
3. Users fill in the facsimile form fields (`patient_full_name`, `pt_name`, `pt_surname`) but skip or miss the separate identity card
4. Even if users do fill the identity card, the `extractFromValues` function also searches the empty schema and finds nothing

### Solution
For facsimile templates, bypass the schema-based identity detection entirely. Instead, extract name/phone/ID directly from `values` using known facsimile field keys.

### Changes

**File: `src/pages/PublicForm.tsx`**

1. Detect when the template is facsimile mode: `template.render_mode === "facsimile"`
2. When facsimile:
   - Hide the identity card entirely (no duplicate name/phone/ID fields) — only show the email input since the form itself captures everything else
   - In `handleSubmit`, resolve name from `values.patient_full_name` or `values.pt_name` + `values.pt_surname` directly (not via schema scanning)
   - Resolve phone from `values.pt_tel` and ID from `values.patient_id_number` or `values.pt_id`
3. Keep the email field always visible since no facsimile form captures email

### Result
Users fill in just the email and the facsimile form itself. The submit handler pulls name, phone, and ID directly from the facsimile field values. No more false "Please fill in your name" error.

### Files Changed

| File | Change |
|------|--------|
| `src/pages/PublicForm.tsx` | Add facsimile-aware identity resolution; hide identity card for facsimile forms |

