import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TreatmentChair } from "@/types/appointment";

export function useTreatmentChairs(includeInactive = false) {
  return useQuery({
    queryKey: ["treatment-chairs", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("treatment_chairs")
        .select("*")
        .order("display_order", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as TreatmentChair[];
    },
  });
}

export function useCreateChair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chair: { name: string; notes?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from("treatment_chairs")
        .insert([chair])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-chairs"] });
    },
  });
}

export function useUpdateChair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TreatmentChair>;
    }) => {
      const { data: result, error } = await supabase
        .from("treatment_chairs")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-chairs"] });
    },
  });
}

export function useDeleteChair() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("treatment_chairs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treatment-chairs"] });
    },
  });
}
