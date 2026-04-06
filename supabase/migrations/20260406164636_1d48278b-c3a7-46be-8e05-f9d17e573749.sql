-- Add render_mode column
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS render_mode text NOT NULL DEFAULT 'schema'
CHECK (render_mode IN ('schema', 'pdf_overlay'));

-- Add pdf_pages column (array of image URLs)
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS pdf_pages jsonb DEFAULT '[]'::jsonb;

-- Add overlay_fields column (positioned field definitions)
ALTER TABLE public.form_templates 
ADD COLUMN IF NOT EXISTS overlay_fields jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for PDF page images
INSERT INTO storage.buckets (id, name, public)
VALUES ('form-pdf-pages', 'form-pdf-pages', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view form PDF page images (public bucket)
CREATE POLICY "Anyone can view form pdf pages"
ON storage.objects FOR SELECT
USING (bucket_id = 'form-pdf-pages');

-- Authenticated admins can upload form pdf pages
CREATE POLICY "Admins can upload form pdf pages"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'form-pdf-pages' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Authenticated admins can update form pdf pages
CREATE POLICY "Admins can update form pdf pages"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'form-pdf-pages' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Authenticated admins can delete form pdf pages
CREATE POLICY "Admins can delete form pdf pages"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'form-pdf-pages' 
  AND has_role(auth.uid(), 'admin'::app_role)
);