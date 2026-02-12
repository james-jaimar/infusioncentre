
-- Create password_reset_tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS but no public policies (service role only)
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Index for token lookups
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens (token);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens (email);
