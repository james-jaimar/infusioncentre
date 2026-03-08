
-- Invoices table
CREATE TYPE public.invoice_status AS ENUM ('draft', 'finalized', 'submitted', 'partially_paid', 'paid', 'void');

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  treatment_course_id uuid REFERENCES public.treatment_courses(id),
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  amount_paid numeric NOT NULL DEFAULT 0,
  amount_outstanding numeric GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
  payer_name text,
  payer_type text DEFAULT 'patient', -- 'patient', 'medical_aid', 'corporate'
  medical_aid_name text,
  medical_aid_number text,
  notes text,
  issued_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Invoice line items
CREATE TABLE public.invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  billable_item_id uuid REFERENCES public.billable_items(id),
  treatment_billable_item_id uuid REFERENCES public.treatment_billable_items(id),
  description text NOT NULL,
  code text,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  line_total numeric GENERATED ALWAYS AS (quantity * unit_price) STORED,
  tariff_code text,
  icd10_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payer rate mappings (medical aid contracted rates)
CREATE TABLE public.payer_rate_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_name text NOT NULL,
  billable_item_id uuid NOT NULL REFERENCES public.billable_items(id),
  contracted_rate numeric NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  is_claimable boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Billing claims lifecycle
CREATE TYPE public.billing_claim_status AS ENUM ('draft', 'submitted', 'accepted', 'rejected', 'appealed', 'partially_paid', 'paid', 'written_off');

CREATE TABLE public.billing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  claim_reference text,
  payer_name text NOT NULL,
  status public.billing_claim_status NOT NULL DEFAULT 'draft',
  submitted_amount numeric NOT NULL DEFAULT 0,
  approved_amount numeric,
  paid_amount numeric NOT NULL DEFAULT 0,
  rejection_reason text,
  rejection_code text,
  submitted_at timestamptz,
  response_at timestamptz,
  paid_at timestamptz,
  appeal_notes text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view invoices" ON public.invoices FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- RLS: invoice_line_items
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage invoice lines" ON public.invoice_line_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Nurses can view invoice lines" ON public.invoice_line_items FOR SELECT USING (public.has_role(auth.uid(), 'nurse'));

-- RLS: payer_rate_mappings
ALTER TABLE public.payer_rate_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage payer rates" ON public.payer_rate_mappings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS: billing_claims
ALTER TABLE public.billing_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage billing claims" ON public.billing_claims FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Audit triggers
CREATE TRIGGER invoices_status_audit BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.log_status_change('invoice');
CREATE TRIGGER billing_claims_status_audit BEFORE UPDATE ON public.billing_claims FOR EACH ROW EXECUTE FUNCTION public.log_status_change('billing_claim');
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_billing_claims_updated_at BEFORE UPDATE ON public.billing_claims FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payer_rate_mappings_updated_at BEFORE UPDATE ON public.payer_rate_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice number sequence helper
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT 'INV-' || TO_CHAR(now(), 'YYYYMM') || '-' || LPAD((COALESCE(
    (SELECT COUNT(*)::int + 1 FROM public.invoices WHERE created_at >= date_trunc('month', now())),
    1
  ))::text, 4, '0')
$$;
