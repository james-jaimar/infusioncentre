
-- Tighten insert/update policies to admin-only (edge functions use service role which bypasses RLS)
DROP POLICY "Service role can insert communication logs" ON public.communication_log;
DROP POLICY "Service role can update communication logs" ON public.communication_log;

CREATE POLICY "Admins can insert communication logs"
  ON public.communication_log
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update communication logs"
  ON public.communication_log
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
