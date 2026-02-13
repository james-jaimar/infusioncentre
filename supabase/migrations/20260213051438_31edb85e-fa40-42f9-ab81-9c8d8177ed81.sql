
CREATE OR REPLACE FUNCTION public.validate_invite_token(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'id', pi.id,
    'patient_id', pi.patient_id,
    'token', pi.token,
    'email', pi.email,
    'status', pi.status,
    'expires_at', pi.expires_at,
    'accepted_at', pi.accepted_at,
    'patient', json_build_object(
      'first_name', p.first_name,
      'last_name', p.last_name,
      'user_id', p.user_id
    )
  ) INTO result
  FROM patient_invites pi
  JOIN patients p ON p.id = pi.patient_id
  WHERE pi.token = invite_token;

  RETURN result;
END;
$$;
