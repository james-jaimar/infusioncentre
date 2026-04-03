

## Plan: Smart Identity Section — Skip Fields Already in the Form

### Problem

`PublicForm.tsx` always renders a hardcoded "Your Details" block (First Name, Last Name, Email, Phone, SA ID) above the form. When the form schema already contains equivalent fields (e.g., "Name in full", "ID Number"), the patient sees duplicate inputs.

### Solution

Make the identity section **adaptive**: detect which identity-like fields the form schema already contains and only show the ones it doesn't. Email is always shown since it's the primary key for patient matching and forms rarely include it.

### Changes

**1. `src/pages/PublicForm.tsx` — Adaptive identity section**

Add a detection function that scans the form schema for fields whose `field_name` or `label` matches common identity patterns:

```typescript
const detectIdentityFields = (schema: FormField[]) => {
  const names = schema.map(f => f.field_name?.toLowerCase() || "");
  const labels = schema.map(f => f.label?.toLowerCase() || "");
  const has = (patterns: string[]) => patterns.some(p => 
    names.some(n => n.includes(p)) || labels.some(l => l.includes(p))
  );
  return {
    hasName: has(["name_in_full", "full_name", "first_name", "patient_name"]),
    hasEmail: has(["email"]),
    hasPhone: has(["phone", "cell", "mobile", "contact_number"]),
    hasIdNumber: has(["id_number", "identity", "sa_id"]),
  };
};
```

Based on this detection:
- **Email**: Always shown (required for patient matching — forms rarely include email)
- **First/Last Name**: Hidden if form has a name field; extract from form values on submit
- **Phone**: Hidden if form has a phone field
- **SA ID**: Hidden if form has an ID number field

If ALL identity fields are already in the form, the entire "Your Details" card is hidden (only email remains as a small inline field above the form).

**2. `src/pages/PublicForm.tsx` — Submit logic adaptation**

When identity fields are sourced from the form schema instead of the hardcoded inputs, the submit handler extracts them from `values` before calling the edge function:

- If name is in the form: split `values.name_in_full` into first/last, or use `values.first_name` / `values.last_name` directly
- If ID is in the form: use `values.id_number`
- If phone is in the form: use `values.phone` or similar

The edge function payload stays the same — only the source of the data changes.

**3. Minimal email-only mode**

When the form already has name, phone, and ID fields, show just a small email input at the top (not a full card), with a note like "We need your email to link this form to your records."

### Files Changed

| File | Change |
|------|--------|
| `src/pages/PublicForm.tsx` | Add schema detection, conditional rendering of identity fields, adapt submit logic |

No backend changes needed — the edge function interface stays identical.

