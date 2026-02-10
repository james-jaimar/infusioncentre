import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FormSubmission {
  id: string;
  form_template_id: string;
  patient_id: string;
  submitted_by: string | null;
  data: Record<string, any>;
  status: string;
  signature_data: string | null;
  witness_signature_data: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function useFormSubmissions(patientId: string | undefined) {
  return useQuery({
    queryKey: ["form_submissions", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("form_submissions")
        .select("*, form_templates(name, category)")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });
}

export function useCreateFormSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (submission: {
      form_template_id: string;
      patient_id: string;
      data: Record<string, any>;
      status?: string;
      signature_data?: string;
      witness_signature_data?: string;
      submitted_by?: string;
    }) => {
      const { data, error } = await supabase
        .from("form_submissions")
        .insert(submission as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["form_submissions", vars.patient_id] });
      qc.invalidateQueries({ queryKey: ["onboarding_checklists"] });
    },
  });
}

export function useUpdateFormSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormSubmission> & { id: string }) => {
      const { data, error } = await supabase
        .from("form_submissions")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["form_submissions"] });
      qc.invalidateQueries({ queryKey: ["onboarding_checklists"] });
    },
  });
}
