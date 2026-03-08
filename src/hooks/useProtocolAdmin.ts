import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TreatmentProtocol, TreatmentProtocolStep, DischargeCriterion } from "@/types/protocol";

export function useAllProtocols() {
  return useQuery({
    queryKey: ["all-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_protocols")
        .select("*, treatment_protocol_steps(*), discharge_criteria(*)")
        .order("name");
      if (error) throw error;
      return data as (TreatmentProtocol & {
        treatment_protocol_steps: TreatmentProtocolStep[];
        discharge_criteria: DischargeCriterion[];
      })[];
    },
  });
}

export function useUpdateProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentProtocol> }) => {
      const { error } = await supabase
        .from("treatment_protocols")
        .update(data as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useCreateProtocol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TreatmentProtocol>) => {
      const { error } = await supabase
        .from("treatment_protocols")
        .insert(data as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useCreateProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<TreatmentProtocolStep>) => {
      const { error } = await supabase
        .from("treatment_protocol_steps")
        .insert(data as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useUpdateProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TreatmentProtocolStep> }) => {
      const { error } = await supabase
        .from("treatment_protocol_steps")
        .update(data as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useDeleteProtocolStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treatment_protocol_steps")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useCreateDischargeCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<DischargeCriterion>) => {
      const { error } = await supabase
        .from("discharge_criteria")
        .insert(data as never);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}

export function useDeleteDischargeCriterion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("discharge_criteria")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["all-protocols"] }),
  });
}
