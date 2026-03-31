

## Plan: Public Digital Forms with PDF Email to Gayle

### What This Does

Creates a public `/forms/:slug` page where patients fill in existing form templates (no login). On submit: saves to DB linked to patient by email/ID number, generates a PDF, and emails it to Gayle's fixed address via the existing SMTP edge function.

### Architecture

```text
Gayle sends link → Patient opens /forms/iron-infusion-pre-questionnaire
                 → Fills form (name/email/ID auto-injected if missing)
                 → Submits
                 → Edge function:
                    1. Matches or creates patient by email/ID
                    2. Inserts into form_submissions
                    3. Renders PDF from form data
                    4. Emails PDF to Gayle via SMTP
                 → Patient sees "Thank you" screen
```

### Database Changes

**Migration 1: Add `slug` column to `form_templates` + new RLS for anon SELECT**

```sql
-- Add slug column
ALTER TABLE form_templates ADD COLUMN slug text;
CREATE UNIQUE INDEX form_templates_slug_tenant_unique ON form_templates(slug, tenant_id);

-- Auto-generate slugs for existing templates
UPDATE form_templates SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Allow anonymous users to read active templates by slug (for public form page)
CREATE POLICY "Anon can view active templates by slug"
  ON form_templates FOR SELECT TO anon
  USING (is_active = true);
```

**Migration 2: Allow anon INSERT on `form_submissions` + `patients`**

```sql
-- Public form submissions (anon insert)
CREATE POLICY "Anon can insert form submissions"
  ON form_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Allow anon to look up / create patients by email
CREATE POLICY "Anon can insert patients"
  ON patients FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can select patients by email"
  ON patients FOR SELECT TO anon
  USING (true);
```

*Note: These anon policies are intentionally broad for the public form use case. They can be tightened later when the full system is live.*

### New Edge Function: `submit-public-form`

Handles the heavy lifting server-side with the service role:

1. Receives: `slug`, `respondent_name`, `respondent_email`, `respondent_id_number`, `respondent_phone`, `data`, `signature_data`
2. Looks up form template by slug
3. Finds or creates patient record by email (and/or ID number)
4. Inserts `form_submissions` row linked to patient
5. Renders a simple HTML-to-PDF of the completed form using the template schema + submitted data (using jsPDF or similar available in Deno)
6. Sends PDF as email attachment to Gayle's configured email via SMTP (reusing the existing SMTP pattern with denomailer)
7. Returns success

### New Page: `src/pages/PublicForm.tsx`

- Route: `/forms/:slug` (public, no auth)
- Fetches template by slug from Supabase (anon key)
- Shows clinic branding header
- **Auto-injects respondent fields** at the top if the form schema doesn't already contain name/email/ID fields:
  - Full Name (required)
  - Email Address (required)
  - SA ID Number (optional)
  - Phone (optional)
- Renders form using existing `FormRenderer` component
- Submit button calls the `submit-public-form` edge function
- Success: "Thank you" confirmation screen with clinic branding

### Admin: Slug Management + Shareable Link

- Update `AdminFormTemplates.tsx` to show a "Copy Link" button per template that copies the public URL
- Auto-generate slug when saving a template (if not set)
- Add slug to `FormTemplate` type in `useFormTemplates.ts`

### Files

| File | Change |
|------|--------|
| Migration | Add `slug` to `form_templates`, anon RLS policies |
| `supabase/functions/submit-public-form/index.ts` | New: find/create patient, save submission, generate PDF, email to Gayle |
| `src/pages/PublicForm.tsx` | New: public form page |
| `src/App.tsx` | Add `/forms/:slug` route |
| `src/pages/admin/AdminFormTemplates.tsx` | Add "Copy Link" button, slug display |
| `src/hooks/useFormTemplates.ts` | Add `slug` to FormTemplate type |

### PDF Generation Approach

The edge function will render the form data into a structured HTML document, convert to PDF using a Deno-compatible PDF library, and attach it to the SMTP email. The PDF will mirror the form layout: clinic header, form title, sections, field labels with answers, tables, signatures.

### Email

Uses the existing SMTP infrastructure (denomailer) already configured in the project. Gayle's email will be hard-coded initially as a constant in the edge function, easily changeable later.

