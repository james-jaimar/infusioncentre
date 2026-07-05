
CREATE TABLE public.appointment_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  requested_by uuid,
  request_type text NOT NULL DEFAULT 'reschedule',
  preferred_date date,
  preferred_time_window text,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointment_change_requests TO authenticated;
GRANT ALL ON public.appointment_change_requests TO service_role;

ALTER TABLE public.appointment_change_requests ENABLE ROW LEVEL SECURITY;

-- Patients can create/view their own requests
CREATE POLICY "Patients view own change requests"
  ON public.appointment_change_requests FOR SELECT
  TO authenticated
  USING (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
  );

CREATE POLICY "Patients create own change requests"
  ON public.appointment_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE user_id = auth.uid())
    AND tenant_id = public.get_user_tenant_id(auth.uid())
  );

-- Admins & nurses view & manage tenant requests
CREATE POLICY "Staff view tenant change requests"
  ON public.appointment_change_requests FOR SELECT
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'nurse'))
  );

CREATE POLICY "Staff update tenant change requests"
  ON public.appointment_change_requests FOR UPDATE
  TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'nurse'))
  );

CREATE TRIGGER trg_appointment_change_requests_updated
  BEFORE UPDATE ON public.appointment_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_acr_tenant_status ON public.appointment_change_requests(tenant_id, status);
CREATE INDEX idx_acr_appointment ON public.appointment_change_requests(appointment_id);
