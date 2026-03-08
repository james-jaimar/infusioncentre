import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  domain: string | null;
  plan: string;
  max_chairs: number;
  max_users: number;
  is_active: boolean;
  settings: Record<string, unknown>;
  billing_email: string | null;
}

interface TenantContextType {
  tenant: Tenant | null;
  tenantId: string | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

const DEFAULT_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export function TenantProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin } = useAuth();

  // Get tenant_id from profile
  const tenantId = (profile as any)?.tenant_id ?? null;

  const { data: tenant = null, isLoading } = useQuery({
    queryKey: ["tenant", tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", tenantId)
        .single();
      if (error) throw error;
      return data as Tenant;
    },
    enabled: !!tenantId && !!user,
  });

  // Apply branding CSS variables when tenant loads
  useEffect(() => {
    if (!tenant) return;
    const root = document.documentElement;
    
    // Only apply custom branding if not the default tenant (or if they've customized)
    if (tenant.primary_color && tenant.primary_color !== '#3E5B84') {
      root.style.setProperty('--tenant-primary', tenant.primary_color);
    }
    if (tenant.secondary_color && tenant.secondary_color !== '#6B8EB2') {
      root.style.setProperty('--tenant-secondary', tenant.secondary_color);
    }
    if (tenant.accent_color && tenant.accent_color !== '#E8A87C') {
      root.style.setProperty('--tenant-accent', tenant.accent_color);
    }
    
    return () => {
      root.style.removeProperty('--tenant-primary');
      root.style.removeProperty('--tenant-secondary');
      root.style.removeProperty('--tenant-accent');
    };
  }, [tenant]);

  const isSuperAdmin = isAdmin && tenantId === DEFAULT_TENANT_ID;

  return (
    <TenantContext.Provider value={{ tenant, tenantId, isLoading, isSuperAdmin }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
