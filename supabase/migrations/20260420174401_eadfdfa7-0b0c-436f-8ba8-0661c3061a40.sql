-- Seed "Other / Custom" appointment type for doctor referrals
-- Idempotent: skips if a row with this name already exists for the tenant
INSERT INTO public.appointment_types (
  name,
  service_category,
  default_duration_minutes,
  color,
  display_order,
  is_active,
  requires_consent,
  tenant_id
)
SELECT
  'Other / Custom',
  'care_pathway'::service_category,
  60,
  '#6B7280',
  999,
  true,
  false,
  '00000000-0000-0000-0000-000000000001'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.appointment_types
  WHERE name = 'Other / Custom'
    AND tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
);