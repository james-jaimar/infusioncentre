
-- Enum for billable item categories
CREATE TYPE public.billable_item_category AS ENUM (
  'drug', 'consumable', 'procedure', 'nursing_fee', 'facility_fee', 'other'
);

-- Billable items catalogue (SKU system)
CREATE TABLE public.billable_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category public.billable_item_category NOT NULL DEFAULT 'other',
  code text,
  unit text NOT NULL DEFAULT 'per unit',
  default_price decimal(10,2) NOT NULL DEFAULT 0,
  cost_price decimal(10,2),
  track_stock boolean NOT NULL DEFAULT false,
  stock_quantity integer NOT NULL DEFAULT 0,
  reorder_level integer,
  appointment_type_id uuid REFERENCES public.appointment_types(id),
  icd10_code text,
  tariff_code text,
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Treatment billable line items
CREATE TABLE public.treatment_billable_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_id uuid NOT NULL REFERENCES public.treatments(id) ON DELETE CASCADE,
  billable_item_id uuid NOT NULL REFERENCES public.billable_items(id),
  quantity decimal(10,2) NOT NULL DEFAULT 1,
  unit_price decimal(10,2) NOT NULL DEFAULT 0,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_billable_items_category ON public.billable_items(category);
CREATE INDEX idx_billable_items_appointment_type ON public.billable_items(appointment_type_id);
CREATE INDEX idx_billable_items_active ON public.billable_items(is_active);
CREATE INDEX idx_treatment_billable_items_treatment ON public.treatment_billable_items(treatment_id);
CREATE INDEX idx_treatment_billable_items_item ON public.treatment_billable_items(billable_item_id);

-- Updated_at trigger for billable_items
CREATE TRIGGER update_billable_items_updated_at
  BEFORE UPDATE ON public.billable_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS on billable_items
ALTER TABLE public.billable_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage billable items"
  ON public.billable_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can view billable items"
  ON public.billable_items FOR SELECT
  USING (has_role(auth.uid(), 'nurse'::app_role));

-- RLS on treatment_billable_items
ALTER TABLE public.treatment_billable_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage treatment billable items"
  ON public.treatment_billable_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Nurses can view treatment billable items"
  ON public.treatment_billable_items FOR SELECT
  USING (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Nurses can insert treatment billable items"
  ON public.treatment_billable_items FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Doctors can view referred patient billable items"
  ON public.treatment_billable_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM treatments t
    JOIN referrals r ON r.patient_id = t.patient_id
    JOIN doctors d ON d.id = r.doctor_id
    WHERE t.id = treatment_billable_items.treatment_id
    AND d.user_id = auth.uid()
  ));
