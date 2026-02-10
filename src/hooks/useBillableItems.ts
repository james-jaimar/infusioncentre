import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BillableItem, BillableItemCategory } from "@/types/billing";

export function useBillableItems(includeInactive = false) {
  return useQuery({
    queryKey: ["billable-items", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("billable_items")
        .select("*")
        .order("display_order", { ascending: true })
        .order("name", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BillableItem[];
    },
  });
}

export function useBillableItemsByType(appointmentTypeId: string | undefined) {
  return useQuery({
    queryKey: ["billable-items", "by-type", appointmentTypeId],
    enabled: !!appointmentTypeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("billable_items")
        .select("*")
        .eq("is_active", true)
        .eq("appointment_type_id", appointmentTypeId!)
        .order("display_order");

      if (error) throw error;
      return data as BillableItem[];
    },
  });
}

export function useCreateBillableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<BillableItem>) => {
      const { data, error } = await supabase
        .from("billable_items")
        .insert(item as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billable-items"] }),
  });
}

export function useUpdateBillableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BillableItem> }) => {
      const { error } = await supabase.from("billable_items").update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billable-items"] }),
  });
}

export function useDeleteBillableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("billable_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["billable-items"] }),
  });
}
