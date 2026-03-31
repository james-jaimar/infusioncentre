
-- Add slug column to form_templates
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS form_templates_slug_tenant_unique ON form_templates(slug, tenant_id);

-- Auto-generate slugs for existing templates
UPDATE form_templates SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE slug IS NULL;

-- Allow anonymous users to read active templates by slug (for public form page)
CREATE POLICY "Anon can view active templates by slug"
  ON form_templates FOR SELECT TO anon
  USING (is_active = true);

-- Public form submissions (anon insert only)
CREATE POLICY "Anon can insert form submissions"
  ON form_submissions FOR INSERT TO anon
  WITH CHECK (true);

-- Allow service role handles patient lookup/create, but we need anon SELECT on patients by email for the edge function
-- Actually edge function uses service role so no anon policies needed on patients
