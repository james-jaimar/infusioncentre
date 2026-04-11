import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PatientNote {
  id: string;
  patient_id: string;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePatientNotes(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient_notes", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("patient_notes" as any)
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PatientNote[];
    },
    enabled: !!patientId,
  });
}

export function useCreatePatientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: { patient_id: string; content: string; created_by?: string }) => {
      const { data, error } = await supabase
        .from("patient_notes" as any)
        .insert(note as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["patient_notes", vars.patient_id] });
    },
  });
}

export function useDeletePatientNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patientId }: { id: string; patientId: string }) => {
      const { error } = await supabase
        .from("patient_notes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return patientId;
    },
    onSuccess: (patientId) => {
      qc.invalidateQueries({ queryKey: ["patient_notes", patientId] });
    },
  });
}
