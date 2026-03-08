import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tenant } from "@/contexts/TenantContext";

export function useTenants() {
  return useQuery({
    queryKey: ["tenants-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Tenant[];
    },
  });
}

export function useTenantById(id: string | undefined) {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!id,
  });
}

interface CreateTenantInput {
  name: string;
  slug: string;
  plan: string;
  billing_email?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  max_chairs?: number;
  max_users?: number;
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTenantInput) => {
      const { data, error } = await supabase
        .from("tenants")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tenants-all"] }),
  });
}

export function useUpdateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Tenant> & { id: string }) => {
      const { data, error } = await supabase
        .from("tenants")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tenants-all"] });
      qc.invalidateQueries({ queryKey: ["tenant", data.id] });
    },
  });
}

export function useSubscriptionUsage(tenantId: string | null) {
  return useQuery({
    queryKey: ["subscription-usage", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from("subscription_usage")
        .select("*")
        .eq("tenant_id", tenantId);
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
}
