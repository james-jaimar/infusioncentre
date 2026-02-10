
-- Create enums for communication tracking
CREATE TYPE public.communication_type AS ENUM ('email', 'whatsapp', 'sms');
CREATE TYPE public.communication_status AS ENUM ('pending', 'sent', 'failed');

-- Create communication_log table
CREATE TABLE public.communication_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type communication_type NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  template TEXT,
  status communication_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communication_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can view communication logs"
  ON public.communication_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge functions (service role) to insert/update
CREATE POLICY "Service role can insert communication logs"
  ON public.communication_log
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update communication logs"
  ON public.communication_log
  FOR UPDATE
  USING (true);

-- Create index for common queries
CREATE INDEX idx_communication_log_type_status ON public.communication_log (type, status);
CREATE INDEX idx_communication_log_created_at ON public.communication_log (created_at DESC);
CREATE INDEX idx_communication_log_related ON public.communication_log (related_entity_type, related_entity_id);
