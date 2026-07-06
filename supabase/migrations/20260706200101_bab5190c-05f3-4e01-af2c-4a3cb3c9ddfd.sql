
CREATE TABLE public.message_action_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
  flag_type text NOT NULL CHECK (flag_type IN ('message_patient','create_appointment','complete_onboarding')),
  tenant_id uuid NOT NULL,
  created_by uuid NOT NULL,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, flag_type)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_action_flags TO authenticated;
GRANT ALL ON public.message_action_flags TO service_role;

ALTER TABLE public.message_action_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view flags in tenant"
  ON public.message_action_flags FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'))
  );

CREATE POLICY "Staff can create flags in tenant"
  ON public.message_action_flags FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND created_by = auth.uid()
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'))
  );

CREATE POLICY "Staff can update flags in tenant"
  ON public.message_action_flags FOR UPDATE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'))
  );

CREATE POLICY "Staff can delete flags in tenant"
  ON public.message_action_flags FOR DELETE TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'nurse'))
  );

CREATE TRIGGER trg_message_action_flags_updated
BEFORE UPDATE ON public.message_action_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_maf_unresolved ON public.message_action_flags (tenant_id, resolved_at) WHERE resolved_at IS NULL;
