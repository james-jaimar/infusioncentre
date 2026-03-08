import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformMetrics() {
  return useQuery({
    queryKey: ["platform-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("platform_get_metrics");
      if (error) throw error;
      return data as {
        total_tenants: number;
        active_tenants: number;
        total_patients: number;
        total_users: number;
        total_appointments_this_month: number;
        total_active_courses: number;
        total_invoices_this_month: number;
        total_revenue_this_month: number;
      };
    },
  });
}

export interface TenantStats {
  tenant_id: string;
  tenant_name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  max_chairs: number;
  max_users: number;
  patient_count: number;
  user_count: number;
  appointment_count: number;
  active_treatment_count: number;
}

export function usePlatformTenantStats() {
  return useQuery({
    queryKey: ["platform-tenant-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("platform_get_tenant_stats");
      if (error) throw error;
      return (data ?? []) as TenantStats[];
    },
  });
}

export interface PlatformUser {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  tenant_id: string;
  tenant_name: string | null;
  role: string | null;
  is_approved: boolean;
  created_at: string;
}

export function usePlatformUsers() {
  return useQuery({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("platform_get_all_users");
      if (error) throw error;
      return (data ?? []) as PlatformUser[];
    },
  });
}

export interface PlatformAuditEntry {
  id: string;
  tenant_id: string;
  tenant_name: string | null;
  user_id: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function usePlatformAuditLog(limit = 100) {
  return useQuery({
    queryKey: ["platform-audit-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("platform_get_audit_log", { _limit: limit });
      if (error) throw error;
      return (data ?? []) as PlatformAuditEntry[];
    },
  });
}

export function useImpersonateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tenantId: string) => {
      // Store the impersonated tenant ID in session storage
      sessionStorage.setItem("impersonated_tenant_id", tenantId);
      return tenantId;
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function useStopImpersonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      sessionStorage.removeItem("impersonated_tenant_id");
    },
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}

export function getImpersonatedTenantId(): string | null {
  return sessionStorage.getItem("impersonated_tenant_id");
}
