
# Add Completed Forms as Tabs on Patient Detail

## Overview

When a patient completes an onboarding form, the filled-in form data should appear as its own tab on the patient detail page. This gives nurses and admins instant access to the patient's submitted information (consent forms, medical questionnaires, etc.) without having to navigate through the onboarding checklist.

## Current Problem

1. Completed forms are buried inside the Onboarding tab -- you have to scroll through the checklist to find them.
2. The existing "View" button on completed items is actually broken -- it opens the form template with empty values instead of loading the saved submission data.

## What Gets Built

### Dynamic form tabs

The tab bar currently shows: **Profile | Medical History | Documents | Onboarding**

After this change, any completed form submissions will appear as additional tabs after Onboarding:

**Profile | Medical History | Documents | Onboarding | Consent Form | Medical Questionnaire | ...**

Each form tab renders the submitted form in read-only mode using the existing `FormRenderer` component, showing exactly what the patient filled in (including signatures, medication tables, etc.).

### Fix the "View" button

The existing "View" button on completed onboarding items will also be fixed to load the actual submission data instead of showing an empty form.

---

## Technical Details

### Files to modify

| File | Changes |
|---|---|
| `src/pages/admin/PatientDetail.tsx` | Import `useFormSubmissions`, fetch submissions, render dynamic tabs for each completed submission, fix "View" button to load submission data |
| `src/hooks/useFormSubmissions.ts` | No changes needed -- already fetches submissions with template name/category |

### How it works

1. Fetch all form submissions for the patient using the existing `useFormSubmissions(id)` hook (already joins `form_templates(name, category)`).
2. Filter to only `submitted` or `completed` status submissions.
3. For each submission, fetch or cache its form template schema (needed to render the form).
4. Add a `TabsTrigger` for each submission, labelled with the form template name (e.g., "Consent Form").
5. Each `TabsContent` renders `FormRenderer` with `readOnly={true}`, passing the submission's `data` as values and the template's `form_schema` as the schema.
6. If signatures were captured, they display inline (the `SignatureCanvas` component already supports read-only rendering).

### Fix for the "View" button

The onboarding checklist items with `status === 'completed'` have a `form_submission_id` linking to the actual submission. When "View" is clicked, load the submission data from the fetched submissions list and pass it as `formValues` to the `FullScreenFormDialog`.

### Edge cases

- If a patient has no completed forms, no extra tabs appear -- the UI looks identical to today.
- If multiple submissions exist for the same form template (e.g., re-submitted), each gets its own tab with a date suffix to distinguish them.
- Tab labels are truncated if the form name is long, with a tooltip showing the full name.

### Implementation order

1. Add `useFormSubmissions` import and fetch call
2. Add `useFormTemplates` fetch (needed for schemas of all submitted forms)
3. Generate dynamic tabs from completed submissions
4. Render each form tab with `FormRenderer` in read-only mode
5. Fix the "View" button on completed onboarding items to load submission data
