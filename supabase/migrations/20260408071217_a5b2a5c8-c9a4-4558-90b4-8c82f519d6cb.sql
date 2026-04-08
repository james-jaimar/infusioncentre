ALTER TABLE form_templates DROP CONSTRAINT form_templates_render_mode_check;
ALTER TABLE form_templates ADD CONSTRAINT form_templates_render_mode_check
  CHECK (render_mode = ANY (ARRAY['schema', 'pdf_overlay', 'facsimile']));