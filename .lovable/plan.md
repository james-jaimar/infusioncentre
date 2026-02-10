

# Phase 2: Dynamic Onboarding Form System

## Overview

Build a form template engine that lets admin define, manage, and assign clinical forms. Patients (or staff on their behalf) fill them in digitally. The system is driven by Gayle's actual forms, which I've analysed in detail below.

---

## Forms Inventory (from uploaded documents)

Based on the documents provided, here is the complete catalogue of forms to pre-seed into the system:

### Universal (All Patients)
1. **Patient Information and Agreement for Care** - patient details, medical aid info, terms/consent, cancellation policy, signatures
2. **POPI Consent** - data processing consent with signature

### Ketamine-Specific
3. **Ketamine Consent (General)** - 6-page information and consent document with signature on each page
4. **Ketamine Consent (Dr Rodseth)** - variant tied to a specific prescribing doctor
5. **Ketamine Pre-Infusion Questionnaire (General 2025)** - 5-page detailed questionnaire: patient history, current medications (table), past medical history (checklist of ~28 conditions), personal history, family history, systems review (multi-category checklist), women's reproductive history, substance use table, signature
6. **Ketamine Pre-Infusion Questionnaire (Dr Rodseth)** - similar but tied to Dr Rodseth

### Iron-Specific
7. **Patient Information for Iron Infusions** - informational document (read-and-acknowledge, no data capture needed beyond signature)
8. **Iron Infusion Pre-Questionnaire** - allergies, weight, prior infusion history, condition checklist (11 items: asthma, eczema, skin allergies, RA, kidney failure, infections, liver disease, lupus, beta-blockers, mastocytosis, pregnancy), emergency contact, medical history, surgical history, signature

### Monitoring Forms (tied to active treatments, not onboarding)
9. **IV Infusion Monitoring (Short)** - baseline vitals, test dose, pre-medication, hourly vitals table (15-min intervals), post-infusion vitals, discharge comments, cleaning record
10. **Revellex/Remsima Infusion Monitoring** - pre-infusion assessment, pre-medication (paracetamol/cortisone/antihistamine with lot numbers), REMSIMA lot tracking, baseline vitals, standard vs accelerated protocol rates, continual monitoring table (15-min), reactions/adverse events, post-infusion vitals, discharge, cleaning record

### Still Needed (not yet provided by Gayle)
- Monofer consent
- Cosmofer consent
- Ferinject consent
- Biological medical history form
- Polygam long infusion monitoring
- Cosmofer long infusion monitoring
- D.I.S Feedback form
- Scriptwise integration details

---

## Field Types Needed

From analysing all forms, the form builder must support these field types:

| Type | Example from forms |
|---|---|
| text | Name, address, occupation |
| textarea | Symptom description, notes |
| number | Age, weight, dosage |
| date | Date of birth, date signed |
| select | Gender (Male/Female), marital status, education level |
| radio | Yes/No questions (ECT, psychotherapy, working) |
| checkbox | Medical condition checklists (28+ items), systems review |
| checkbox_group | Multi-select condition lists with "other" option |
| medication_table | Repeating rows: drug name, strength, dosage, duration |
| substance_table | Repeating rows: drug category, age first used, frequency, etc. |
| vitals_row | BP, pulse, temp, sats, RR at a point in time |
| vitals_table | Repeating timed vitals (monitoring forms) |
| signature | Patient signature, witness signature, RN signature |
| section_header | Section dividers with titles |
| info_text | Read-only informational paragraphs (consent documents) |
| family_table | Father/Mother/Siblings - living/deceased status |
| file_upload | Referral documents, prescriptions |

---

## Database Changes (Migration)

### New Tables

**form_templates**
- id (uuid, PK)
- name (text) - e.g. "POPI Consent"
- description (text, nullable)
- category (enum: consent, medical_questionnaire, administrative, monitoring)
- form_schema (jsonb) - array of field definitions
- is_active (boolean, default true)
- display_order (integer, default 0)
- version (integer, default 1)
- required_for_treatment_types (uuid[], nullable) - links to appointment_types; null means universal
- created_by (uuid, nullable)
- created_at, updated_at (timestamptz)

**form_submissions**
- id (uuid, PK)
- form_template_id (uuid, FK)
- patient_id (uuid, FK)
- submitted_by (uuid, nullable) - who filled it in (could be patient, nurse, or admin)
- data (jsonb) - the answers keyed by field_name
- status (enum: draft, submitted, reviewed, approved)
- signature_data (text, nullable) - base64 signature image
- witness_signature_data (text, nullable)
- reviewed_by (uuid, nullable)
- reviewed_at (timestamptz, nullable)
- created_at (timestamptz)

**onboarding_checklists**
- id (uuid, PK)
- patient_id (uuid, FK)
- form_template_id (uuid, FK)
- form_submission_id (uuid, nullable, FK) - linked when completed
- status (enum: pending, in_progress, completed, waived)
- due_date (date, nullable)
- completed_at (timestamptz, nullable)
- notes (text, nullable)
- created_at (timestamptz)

### New Enums
- form_category: consent, medical_questionnaire, administrative, monitoring
- form_submission_status: draft, submitted, reviewed, approved
- checklist_item_status: pending, in_progress, completed, waived

### RLS Policies
- Admins: full access to all three tables
- Nurses: can read templates, read/insert/update submissions and checklists
- Patients: can read own checklist items, read templates linked to their checklist, insert/update own submissions (draft/submitted only)

---

## JSONB Schema Format

Each form template's `form_schema` is an array of field definitions:

```text
[
  {
    "field_name": "patient_name",
    "field_type": "text",
    "label": "Name & Surname",
    "required": true,
    "section": "Patient Details",
    "placeholder": "Mr./Mrs./Ms./Miss./Child",
    "max_length": 200
  },
  {
    "field_name": "has_diabetes",
    "field_type": "radio",
    "label": "Diabetes",
    "required": true,
    "section": "Past Medical History",
    "options": ["Yes", "No"]
  },
  {
    "field_name": "current_medications",
    "field_type": "medication_table",
    "label": "Current Medications",
    "section": "Current Medication",
    "columns": ["Name of drug", "Strength & Dosage", "Number per day", "How long"],
    "max_rows": 12
  },
  {
    "field_name": "consent_info",
    "field_type": "info_text",
    "label": "",
    "content": "Ketamine is a medication that has been used for more than 40 years..."
  },
  {
    "field_name": "patient_signature",
    "field_type": "signature",
    "label": "Patient Signature",
    "required": true
  }
]
```

---

## Frontend Components

### 1. Form Builder (Admin)
**New page: `/admin/form-templates`**

- List all form templates with search/filter by category
- Create/Edit form template:
  - Name, description, category, active toggle
  - Link to treatment types (multi-select from appointment_types)
  - Visual field list with drag-to-reorder (or up/down buttons)
  - "Add Field" button opens a field configuration panel
  - Field config: label, field_name (auto-generated from label), type selector, required toggle, options (for select/radio/checkbox), placeholder, section header
  - Live preview panel showing what the form looks like
- Pre-seed button or migration to create templates matching Gayle's forms

### 2. Form Renderer Component
**New component: `src/components/forms/FormRenderer.tsx`**

A generic component that takes a `form_schema` JSON array and renders the appropriate UI:
- Renders each field type with the correct input component
- Groups fields by `section` with section headers
- Handles validation (required fields, max lengths)
- Supports read-only mode (for reviewing submitted forms)
- Supports draft saving (auto-save or manual)

Sub-components:
- `SignatureCanvas.tsx` - HTML5 canvas for drawing signatures with clear/undo
- `MedicationTable.tsx` - dynamic rows for medication entry
- `SubstanceUseTable.tsx` - drug use tracking table
- `VitalsTable.tsx` - timed vitals recording (for monitoring forms)
- `ConditionChecklist.tsx` - renders a list of conditions with Yes/No toggles

### 3. Onboarding Checklist (Admin + Patient)
**Updates to `PatientDetail.tsx`:**

- New "Onboarding" tab showing:
  - Progress bar (e.g. 3/7 forms completed)
  - List of required forms with status badges (Pending/In Progress/Completed/Waived)
  - "Fill Form" button opens FormRenderer in a dialog or full-page view
  - "Waive" option for admin to skip a form with a note
  - "Auto-generate checklist" button that creates checklist items based on the patient's treatment type

**Patient portal updates:**
- "My Forms" section on PatientDashboard showing outstanding forms
- Click to open FormRenderer and fill in
- Submit button changes status from draft to submitted

### 4. Admin Form Templates Page
**New file: `src/pages/admin/AdminFormTemplates.tsx`**

- Route: `/admin/form-templates`
- Add to AdminLayout sidebar navigation
- Table listing all templates with category badges, version, active status
- CRUD operations

---

## Pre-seeded Form Templates

The migration will create the following templates with full JSONB schemas based on the uploaded documents:

1. **Patient Information & Agreement for Care** (category: administrative)
   - Fields: name, title, ID, age, email, mobile, address, next of kin, representative details, medical aid info, agreement date, signatures

2. **POPI Consent** (category: consent)
   - Fields: consent checkboxes for each processing activity, full name, ID number, signature, date

3. **Ketamine Consent** (category: consent, linked to ketamine appointment type)
   - Fields: mostly info_text blocks (the educational content), signature fields on each logical page

4. **Ketamine Pre-Infusion Questionnaire** (category: medical_questionnaire, linked to ketamine)
   - Fields: date, full name, age, sex, DOB, ID, guardian info, symptoms (textarea), practitioners seen, hospitalisations, ECT (yes/no), psychotherapy (yes/no), treatment goals, medication table (12 rows), drug allergies, medical history checklist (~28 conditions), personal history fields, family history table, systems review checklist, women's health section (conditional), substance use table, consent to drug testing, signatures

5. **Iron Information** (category: consent, linked to iron appointment types)
   - Fields: info_text blocks, acknowledgement checkbox, signature

6. **Iron Pre-Infusion Questionnaire** (category: medical_questionnaire, linked to iron)
   - Fields: name, allergies, age, weight, prior infusion (yes/no + details), current medications, condition checklist (11 items), details textarea, emergency contact, signature, RN signature, referring doctor, diagnosis, medical history, surgical history

7. **IV Infusion Monitoring (Short)** (category: monitoring)
   - Fields: date, infusion number, IV site, patient name, allergies, drug/dosage, batch/expiry, prescribing doctor, baseline vitals, test dose, pre-medication, vitals table (15-min intervals), post-infusion vitals, RN signatures, discharge comments, cleaning checklist

8. **Revellex/Remsima Monitoring** (category: monitoring)
   - Fields: patient name, date, infusion number, weight, nurse/mask checkboxes, time in/out, dosage, prescribing doctor, pre-infusion assessment, pre-medication table (paracetamol/cortisone/antihistamine with lot numbers), REMSIMA lot tracking (6 entries), baseline vitals, protocol selection (standard/accelerated), vitals monitoring table, reactions, post-infusion vitals, discharge, cleaning

---

## New Files

| File | Purpose |
|---|---|
| `supabase/migrations/XXXX_form_system.sql` | Tables, enums, RLS, pre-seeded templates |
| `src/pages/admin/AdminFormTemplates.tsx` | Admin form template management page |
| `src/components/forms/FormRenderer.tsx` | Generic form renderer from JSONB schema |
| `src/components/forms/FormBuilder.tsx` | Admin form template builder |
| `src/components/forms/SignatureCanvas.tsx` | Signature capture component |
| `src/components/forms/MedicationTable.tsx` | Dynamic medication entry table |
| `src/components/forms/ConditionChecklist.tsx` | Yes/No condition checklist |
| `src/components/forms/InfoText.tsx` | Read-only informational text block |
| `src/hooks/useFormTemplates.ts` | CRUD hooks for form_templates |
| `src/hooks/useFormSubmissions.ts` | CRUD hooks for form_submissions |
| `src/hooks/useOnboardingChecklist.ts` | Hooks for onboarding_checklists |

## Modified Files

| File | Change |
|---|---|
| `src/integrations/supabase/types.ts` | Add new table types (auto-generated after migration) |
| `src/pages/admin/PatientDetail.tsx` | Add "Onboarding" tab with checklist |
| `src/pages/patient/PatientDashboard.tsx` | Add "My Forms" section |
| `src/components/layout/AdminLayout.tsx` | Add "Form Templates" nav item |
| `src/App.tsx` | Add `/admin/form-templates` route |

---

## Implementation Order

Given the size, this will be built in sub-steps:

1. **Database migration** - tables, enums, RLS policies, and pre-seeded templates for the 8 forms above
2. **Form renderer** - the core component that renders any JSONB schema into a fillable form (with signature canvas, medication table, condition checklist)
3. **Admin form templates page** - list/create/edit/delete templates with the visual builder
4. **Onboarding checklist** - integration into PatientDetail + auto-generation logic
5. **Patient portal forms** - "My Forms" on PatientDashboard using FormRenderer

---

## Notes on Forms Still Needed

The following forms were mentioned in Gayle's process map but not uploaded. They're tracked as placeholders and can be added later via the form builder:

- Monofer consent
- Cosmofer consent  
- Ferinject consent
- Biological medical history
- Polygam long infusion monitoring
- Cosmofer long infusion monitoring
- D.I.S Feedback form

These will appear in the admin form templates page as "Draft" or can be created from scratch using the builder once Gayle provides the content.

