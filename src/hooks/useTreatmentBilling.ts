import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TreatmentBillableItem } from "@/types/billing";

export function useTreatmentBillableItems(treatmentId: string | undefined) {
  return useQuery({
    queryKey: ["treatment-billable-items", treatmentId],
    enabled: !!treatmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_billable_items")
        .select("*, billable_item:billable_items(*)")
        .eq("treatment_id", treatmentId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        billable_item: row.billable_item || undefined,
      })) as TreatmentBillableItem[];
    },
  });
}

export function useAddTreatmentBillableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: {
      treatment_id: string;
      billable_item_id: string;
      quantity: number;
      unit_price: number;
      notes?: string | null;
      recorded_by?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("treatment_billable_items")
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["treatment-billable-items", variables.treatment_id] });
    },
  });
}

export function useDeleteTreatmentBillableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, treatmentId }: { id: string; treatmentId: string }) => {
      const { error } = await supabase.from("treatment_billable_items").delete().eq("id", id);
      if (error) throw error;
      return treatmentId;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["treatment-billable-items", variables.treatmentId] });
    },
  });
}
