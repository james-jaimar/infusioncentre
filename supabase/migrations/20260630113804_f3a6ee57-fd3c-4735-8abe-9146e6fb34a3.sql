-- Restore EXECUTE on RLS helper functions to authenticated.
-- These are SECURITY DEFINER and only return boolean/uuid for the caller's own context;
-- revoking them broke every policy that referenced them (all data appeared "gone").

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_tenant_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.doctor_has_patient_referral(uuid) TO authenticated;