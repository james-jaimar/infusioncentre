
-- Platform admin functions for cross-tenant access (security definer bypasses RLS)

-- Check if user is a super admin (admin on default tenant)
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.role = 'admin'
      AND p.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
$$;

-- Cross-tenant: get all tenants with usage stats
CREATE OR REPLACE FUNCTION public.platform_get_tenant_stats()
RETURNS TABLE(
  tenant_id uuid,
  tenant_name text,
  slug text,
  plan text,
  is_active boolean,
  max_chairs int,
  max_users int,
  patient_count bigint,
  user_count bigint,
  appointment_count bigint,
  active_treatment_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id AS tenant_id,
    t.name AS tenant_name,
    t.slug,
    t.plan,
    t.is_active,
    t.max_chairs,
    t.max_users,
    (SELECT COUNT(*) FROM patients p WHERE p.tenant_id = t.id) AS patient_count,
    (SELECT COUNT(*) FROM profiles pr WHERE pr.tenant_id = t.id) AS user_count,
    (SELECT COUNT(*) FROM appointments a WHERE a.tenant_id = t.id AND a.scheduled_start >= date_trunc('month', now())) AS appointment_count,
    (SELECT COUNT(*) FROM treatment_courses tc WHERE tc.tenant_id = t.id AND tc.status = 'active') AS active_treatment_count
  FROM tenants t
  WHERE is_super_admin(auth.uid())
  ORDER BY t.name
$$;

-- Cross-tenant: get all users across tenants
CREATE OR REPLACE FUNCTION public.platform_get_all_users()
RETURNS TABLE(
  user_id uuid,
  email text,
  first_name text,
  last_name text,
  tenant_id uuid,
  tenant_name text,
  role text,
  is_approved boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    p.user_id,
    u.email::text,
    p.first_name,
    p.last_name,
    p.tenant_id,
    t.name AS tenant_name,
    ur.role::text,
    p.is_approved,
    u.created_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN user_roles ur ON ur.user_id = p.user_id
  LEFT JOIN tenants t ON t.id = p.tenant_id
  WHERE is_super_admin(auth.uid())
  ORDER BY u.created_at DESC
$$;

-- Cross-tenant: get global audit log
CREATE OR REPLACE FUNCTION public.platform_get_audit_log(_limit int DEFAULT 100)
RETURNS TABLE(
  id uuid,
  tenant_id uuid,
  tenant_name text,
  user_id uuid,
  action text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    al.id,
    al.tenant_id,
    t.name AS tenant_name,
    al.user_id,
    al.action,
    al.details,
    al.created_at
  FROM audit_log al
  LEFT JOIN tenants t ON t.id = al.tenant_id
  WHERE is_super_admin(auth.uid())
  ORDER BY al.created_at DESC
  LIMIT _limit
$$;

-- Cross-tenant: get platform-wide metrics
CREATE OR REPLACE FUNCTION public.platform_get_metrics()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'total_tenants', (SELECT COUNT(*) FROM tenants),
    'active_tenants', (SELECT COUNT(*) FROM tenants WHERE is_active = true),
    'total_patients', (SELECT COUNT(*) FROM patients),
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_appointments_this_month', (SELECT COUNT(*) FROM appointments WHERE scheduled_start >= date_trunc('month', now())),
    'total_active_courses', (SELECT COUNT(*) FROM treatment_courses WHERE status = 'active'),
    'total_invoices_this_month', (SELECT COUNT(*) FROM invoices WHERE created_at >= date_trunc('month', now())),
    'total_revenue_this_month', (SELECT COALESCE(SUM(total_amount), 0) FROM invoices WHERE created_at >= date_trunc('month', now()) AND status != 'draft')
  )
  WHERE is_super_admin(auth.uid())
$$;
