import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TreatmentReaction } from "@/types/treatment";

export function useTreatmentReactions(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-reactions", treatmentId],
    queryFn: async () => {
      if (!treatmentId) return [];
      const { data, error } = await supabase
        .from("treatment_reactions")
        .select("*")
        .eq("treatment_id", treatmentId)
        .order("onset_at", { ascending: true });
      if (error) throw error;
      return data as TreatmentReaction[];
    },
    enabled: !!treatmentId,
  });
}

export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TreatmentReaction, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("treatment_reactions")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data as TreatmentReaction;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["treatment-reactions", d.treatment_id] }),
  });
}

export function useUpdateReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentReaction> }) => {
      const { data: result, error } = await supabase
        .from("treatment_reactions")
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result as TreatmentReaction;
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["treatment-reactions", d.treatment_id] }),
  });
}
