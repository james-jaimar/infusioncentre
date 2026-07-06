
ALTER TABLE public.message_action_flags
  DROP CONSTRAINT IF EXISTS message_action_flags_message_id_flag_type_key;

CREATE UNIQUE INDEX IF NOT EXISTS message_action_flags_unresolved_unique
  ON public.message_action_flags (message_id, flag_type)
  WHERE resolved_at IS NULL;
