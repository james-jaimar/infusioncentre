

## Pre-populate Form Fields from Patient Data

### Overview
When a patient opens a form, common fields (name, ID number, email, phone, medical aid details, emergency contact, etc.) will be automatically filled in from their existing patient record and medical history. This saves time and reduces errors.

### How It Works

The form field schema already has a `field_name` property (e.g., `patient_name_surname`, `patient_email`). We will:

1. Add an optional `prefill_key` property to form fields that maps to a known patient data source
2. Build a prefill utility that reads the patient record + medical history and returns values for matching keys
3. When a patient opens a form, merge prefilled values (without overwriting any existing answers)
4. Update all existing form templates in the database to tag common fields with their `prefill_key`

### Changes

**1. New utility: `src/lib/prefillFormData.ts`**

A mapping function that takes a patient record (+ medical history) and a form schema, and returns pre-filled values.

Supported prefill keys and their data sources:

| prefill_key | Source |
|---|---|
| `patient_first_name` | patients.first_name |
| `patient_last_name` | patients.last_name |
| `patient_full_name` | patients.first_name + last_name |
| `patient_id_number` | patients.id_number |
| `patient_email` | patients.email |
| `patient_phone` | patients.phone |
| `patient_date_of_birth` | patients.date_of_birth |
| `patient_gender` | patients.gender |
| `patient_address` | patients.address_line_1 + address_line_2 |
| `patient_city` | patients.city |
| `patient_postal_code` | patients.postal_code |
| `emergency_contact_name` | patients.emergency_contact_name |
| `emergency_contact_phone` | patients.emergency_contact_phone |
| `emergency_contact_relationship` | patients.emergency_contact_relationship |
| `medical_aid_name` | patients.medical_aid_name |
| `medical_aid_number` | patients.medical_aid_number |
| `medical_aid_plan` | patients.medical_aid_plan |
| `medical_aid_main_member` | patients.medical_aid_main_member |
| `referring_doctor_name` | patients.referring_doctor_name |
| `allergies` | patient_medical_history.allergies (joined) |

**2. Update `FormField` interface in `FormRenderer.tsx`**

Add optional `prefill_key?: string` to the `FormField` type so the schema can declare which patient data field to use.

**3. Update `PatientDashboard.tsx`**

- Fetch the full patient record (not just `id`) from the `patients` table
- Fetch patient medical history
- In `handleOpenForm`, call the prefill utility to generate initial values instead of starting with `{}`

**4. Database: Update existing form template schemas**

Run a SQL update to add `prefill_key` to matching fields in the existing 8 form templates. For example, in the "Patient Information & Agreement for Care" form:
- `patient_name_surname` gets `prefill_key: "patient_full_name"`
- `patient_id_no` gets `prefill_key: "patient_id_number"`
- `patient_email` gets `prefill_key: "patient_email"`
- `patient_mobile_no` gets `prefill_key: "patient_phone"`
- `patient_next_of_kin_name` gets `prefill_key: "emergency_contact_name"`
- `patient_next_of_kin_contact_no` gets `prefill_key: "emergency_contact_phone"`
- `medical_aid_main_member` gets `prefill_key: "medical_aid_main_member"`
- `medical_aid_name` gets `prefill_key: "medical_aid_name"`
- `medical_aid_no` gets `prefill_key: "medical_aid_number"`
- `patient_street_address` gets `prefill_key: "patient_address"`

Similar mappings will be applied to the other forms that share these common fields (Iron Infusion Pre-Questionnaire, Ketamine Pre-Infusion Questionnaire, etc.).

**5. Update Form Template Editor / AI Import**

When creating or editing form templates, the `prefill_key` dropdown will be available in the field editor so admins can tag new fields for auto-population.

### Files to modify

| File | Change |
|---|---|
| `src/lib/prefillFormData.ts` | New utility with prefill mapping logic |
| `src/components/forms/FormRenderer.tsx` | Add `prefill_key` to `FormField` interface |
| `src/pages/patient/PatientDashboard.tsx` | Fetch full patient data, call prefill on form open |
| `src/components/forms/FieldEditor.tsx` | Add prefill_key selector for admins |
| Database migration | Update existing form_templates to add prefill_key to matching fields |

