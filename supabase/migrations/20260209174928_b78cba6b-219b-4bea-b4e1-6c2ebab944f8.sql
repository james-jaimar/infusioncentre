
-- Add status tracking to contact_submissions
CREATE TYPE public.contact_status AS ENUM ('new', 'in_progress', 'resolved', 'archived');

ALTER TABLE public.contact_submissions
  ADD COLUMN is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN read_at timestamptz,
  ADD COLUMN assigned_to uuid,
  ADD COLUMN status public.contact_status NOT NULL DEFAULT 'new',
  ADD COLUMN response_notes text;

-- Index for filtering
CREATE INDEX idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX idx_contact_submissions_is_read ON public.contact_submissions(is_read);
