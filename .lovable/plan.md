

## Plan: Print-Optimized Form Viewer + Notification Email

### What we are building

1. **A "Print Form" button and print-optimized modal** in the patient detail view so Gail can open any completed form submission, see a clean preview, and print it directly from the browser.

2. **Replace the broken HTML email** with a short notification email containing a link to the patient's form in the admin portal.

### Changes

#### 1. Create a `PrintableFormView` component

New file: `src/components/forms/PrintableFormView.tsx`

- Renders the form data in a clean, structured layout optimized for `@media print`
- Header with clinic branding (D.I.S Infusion Centre logo/name), form title, submission date
- Patient identity block (name, email, ID, phone)
- Form fields rendered as a clean label/value table grouped by sections
- Signature rendered as an image if present
- Footer with submission metadata
- Print styles: hide browser chrome, use serif/readable fonts, proper page breaks, no background colours

#### 2. Add print preview to `FullScreenFormDialog`

- Add a `Printer` icon button in the header bar (next to the close button) when `readOnly` is true
- Clicking it opens a new browser window with the `PrintableFormView` content and auto-triggers `window.print()`
- Alternative: render a print-only overlay within the dialog using `@media print` CSS to hide the dialog chrome and show only the form content

#### 3. Add a "Print" button on the completed form tabs in `PatientDetail.tsx`

- On each dynamic form submission tab (lines 1127-1163), add a "Print" button in the card header
- Clicking it renders `PrintableFormView` in a print window

#### 4. Rewrite the notification email in `submit-public-form` edge function

Replace the 200+ line HTML renderers with a simple notification:
- Subject: `New Form Submission: {form name} — {patient name}`
- Body: Patient name, email, ID number, form name, submission timestamp
- A direct link to the patient in the admin portal: `https://infusioncentre.lovable.app/admin/patients/{patientId}?tab=onboarding`
- Clean, short HTML that will not break denomailer's encoding
- Remove `renderFacsimileToHtml` and `renderFormToPdfHtml` functions entirely

#### 5. Print CSS in `index.css`

Add global `@media print` rules:
- Hide nav, sidebar, header, footer, toast overlays
- Clean white background, black text
- Proper margins and page-break rules

### Technical detail

**PrintableFormView props:**
```
{ title, schema, values, patientInfo, submittedAt, signatureData }
```

**Email template (simplified):**
```html
<h2>New Form Submission</h2>
<p><strong>Form:</strong> Ketamine Questionnaire</p>
<p><strong>Patient:</strong> John Smith (john@example.com)</p>
<p><strong>Submitted:</strong> 2026-04-10</p>
<p><a href="https://infusioncentre.lovable.app/admin/patients/abc123?tab=onboarding">
  View in Admin Portal
</a></p>
```

**Files touched:**
- New: `src/components/forms/PrintableFormView.tsx`
- Edit: `src/components/forms/FullScreenFormDialog.tsx` (add print button)
- Edit: `src/pages/admin/PatientDetail.tsx` (add print button on form tabs)
- Edit: `src/index.css` (add `@media print` rules)
- Edit: `supabase/functions/submit-public-form/index.ts` (replace email with notification)

