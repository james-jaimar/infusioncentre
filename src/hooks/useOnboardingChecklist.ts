import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChecklistItem {
  id: string;
  patient_id: string;
  form_template_id: string;
  form_submission_id: string | null;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  form_templates?: {
    name: string;
    category: string;
    description: string | null;
  };
}

export function useOnboardingChecklist(patientId: string | undefined) {
  return useQuery({
    queryKey: ["onboarding_checklists", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("onboarding_checklists")
        .select("*, form_templates(name, category, description)")
        .eq("patient_id", patientId)
        .order("created_at");
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!patientId,
  });
}

export function useGenerateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ patientId, treatmentTypeIds }: { patientId: string; treatmentTypeIds?: string[] }) => {
      // Get all active templates
      const { data: templates, error: tErr } = await supabase
        .from("form_templates")
        .select("id, required_for_treatment_types")
        .eq("is_active", true);
      if (tErr) throw tErr;

      // Filter templates: universal (null) or matching treatment types
      const applicable = templates?.filter((t) => {
        if (!t.required_for_treatment_types) return true; // universal
        if (!treatmentTypeIds?.length) return false;
        return t.required_for_treatment_types.some((id: string) => treatmentTypeIds.includes(id));
      }) || [];

      // Check existing checklist items
      const { data: existing } = await supabase
        .from("onboarding_checklists")
        .select("form_template_id")
        .eq("patient_id", patientId);

      const existingIds = new Set(existing?.map((e) => e.form_template_id) || []);
      const newItems = applicable
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({ patient_id: patientId, form_template_id: t.id }));

      if (newItems.length === 0) return [];

      const { data, error } = await supabase
        .from("onboarding_checklists")
        .insert(newItems as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["onboarding_checklists", vars.patientId] });
    },
  });
}

export function useUpdateChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; form_submission_id?: string; completed_at?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("onboarding_checklists")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding_checklists"] });
    },
  });
}
