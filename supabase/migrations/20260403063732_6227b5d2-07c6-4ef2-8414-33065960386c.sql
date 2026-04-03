
CREATE OR REPLACE FUNCTION public.generate_form_template_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(
      regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '\s+', '-', 'g'
    ));
    NEW.slug := NEW.slug || '-' || substr(gen_random_uuid()::text, 1, 4);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_form_template_slug
  BEFORE INSERT ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_form_template_slug();

-- Backfill any existing templates missing slugs
UPDATE public.form_templates
SET slug = lower(regexp_replace(
  regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'),
  '\s+', '-', 'g'
)) || '-' || substr(gen_random_uuid()::text, 1, 4)
WHERE slug IS NULL OR slug = '';
