
-- Create invite_status enum
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- Create patient_invites table
CREATE TABLE public.patient_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  email text NOT NULL,
  phone text,
  status invite_status NOT NULL DEFAULT 'pending',
  invited_by uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_invites ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY "Admins can manage invites"
  ON public.patient_invites
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Nurses: full CRUD
CREATE POLICY "Nurses can manage invites"
  ON public.patient_invites
  FOR ALL
  USING (has_role(auth.uid(), 'nurse'::app_role));

-- Patients: read own invites
CREATE POLICY "Patients can view own invites"
  ON public.patient_invites
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_invites.patient_id
        AND patients.user_id = auth.uid()
    )
  );

-- Index for token lookups
CREATE INDEX idx_patient_invites_token ON public.patient_invites(token);

-- Index for patient lookups
CREATE INDEX idx_patient_invites_patient_id ON public.patient_invites(patient_id);
