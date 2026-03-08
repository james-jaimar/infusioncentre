
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 'INV-' || TO_CHAR(now(), 'YYYYMM') || '-' || LPAD((COALESCE(
    (SELECT COUNT(*)::int + 1 FROM public.invoices WHERE created_at >= date_trunc('month', now())),
    1
  ))::text, 4, '0')
$$;
