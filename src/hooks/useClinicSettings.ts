import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClinicSetting {
  id: string;
  key: string;
  value: unknown;
  label: string;
  category: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface FeatureFlag {
  id: string;
  key: string;
  label: string;
  description: string | null;
  is_enabled: boolean;
  category: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useClinicSettings() {
  return useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("*")
        .order("category");
      if (error) throw error;
      return data as ClinicSetting[];
    },
  });
}

export function useUpdateClinicSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("clinic_settings")
        .update({ value: value as never })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic-settings"] }),
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_flags")
        .update({ is_enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature-flags"] }),
  });
}
