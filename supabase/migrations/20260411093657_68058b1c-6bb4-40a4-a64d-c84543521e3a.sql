
-- 1. Add admin_amendments column to form_submissions
ALTER TABLE public.form_submissions
  ADD COLUMN admin_amendments jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Create patient_notes table
CREATE TABLE public.patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid REFERENCES public.tenants(id),
  content text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage patient notes"
  ON public.patient_notes FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Nurses can view patient notes"
  ON public.patient_notes FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'nurse'::app_role) AND tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_patient_notes_updated_at
  BEFORE UPDATE ON public.patient_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
