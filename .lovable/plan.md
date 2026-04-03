

## Plan: Auto-Generate Slug for New Form Templates

### Problem

When a new form template is created, no `slug` is set. The slug was only backfilled once via a migration for existing templates. There is no database trigger or application code that generates a slug on insert, so new templates always have `slug = null` and no public link appears.

### Solution

Add a database trigger that auto-generates a slug from the template name on INSERT (when slug is null). This is more reliable than doing it in the frontend since it catches all creation paths (editor, AI import, etc.).

### Changes

**1. Database migration — auto-slug trigger**

Create a trigger function that runs BEFORE INSERT on `form_templates`. When `slug` is null, it generates one from the name using `lower(regexp_replace(...))` and appends a short random suffix to avoid collisions.

```sql
CREATE OR REPLACE FUNCTION generate_form_template_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(
      regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    -- Append short unique suffix to prevent collisions
    NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_form_template_slug
  BEFORE INSERT ON form_templates
  FOR EACH ROW
  EXECUTE FUNCTION generate_form_template_slug();
```

**2. Backfill existing templates missing slugs**

The same migration will update any existing rows that still have null slugs (in case the original backfill missed some).

No frontend changes needed — the link button already checks `t.slug` and shows it when present.

