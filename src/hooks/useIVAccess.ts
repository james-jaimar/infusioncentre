import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TreatmentIVAccess, TreatmentSiteCheck } from "@/types/treatment";

export function useIVAccess(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["iv-access", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_iv_access")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("inserted_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentIVAccess[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddIVAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentIVAccess, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("treatment_iv_access")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentIVAccess;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["iv-access", d.treatment_id] }),
  });
}

export function useUpdateIVAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentIVAccess> }) => {
      const { data: result, error } = await supabase
        .from("treatment_iv_access")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result as TreatmentIVAccess;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["iv-access", d.treatment_id] }),
  });
}

// Site Checks
export function useSiteChecks(ivAccessId: string | undefined) {
  return useQuery({
    queryKey: ["site-checks", ivAccessId],
    queryFn: async () => {
      if (!ivAccessId) return [];
      const { data, error } = await supabase
        .from("treatment_site_checks")
        .select("*")
        .eq("iv_access_id", ivAccessId)
        .order("checked_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentSiteCheck[];
    },
    enabled: !!ivAccessId,
  });
}

export function useAddSiteCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentSiteCheck, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("treatment_site_checks")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentSiteCheck;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["site-checks", d.iv_access_id] });
    },
  });
}
