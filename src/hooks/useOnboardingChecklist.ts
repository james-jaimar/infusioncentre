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

export interface OnboardingReadiness {
  required: { id: string; name: string; description: string | null; category: string }[];
  completed: { id: string; name: string; completedAt: string }[];
  pending: { id: string; name: string; description: string | null }[];
  isReady: boolean;
  completionPercent: number;
  isLoading: boolean;
}

export function useOnboardingReadiness(
  patientId: string | undefined,
  appointmentTypeId: string | undefined
): OnboardingReadiness {
  // Get form templates required for this appointment type
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["form_templates_for_type", appointmentTypeId],
    queryFn: async () => {
      if (!appointmentTypeId) return [];
      const { data, error } = await supabase
        .from("form_templates")
        .select("id, name, description, category, required_for_treatment_types")
        .eq("is_active", true);
      if (error) throw error;
      // Filter to templates required for this appointment type (or universal)
      return (data || []).filter((t: any) => {
        if (!t.required_for_treatment_types || t.required_for_treatment_types.length === 0) return false;
        return t.required_for_treatment_types.includes(appointmentTypeId);
      });
    },
    enabled: !!appointmentTypeId,
  });

  // Get patient's form submissions
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["form_submissions_readiness", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("form_submissions")
        .select("id, form_template_id, created_at, status")
        .eq("patient_id", patientId)
        .in("status", ["submitted", "reviewed", "approved"]);
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  const required = (templates || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
  }));

  const submittedTemplateIds = new Set(
    (submissions || []).map((s: any) => s.form_template_id)
  );

  const completed = required
    .filter((t) => submittedTemplateIds.has(t.id))
    .map((t) => {
      const sub = (submissions || []).find((s: any) => s.form_template_id === t.id);
      return { id: t.id, name: t.name, completedAt: sub?.created_at || "" };
    });

  const pending = required.filter((t) => !submittedTemplateIds.has(t.id));

  return {
    required,
    completed,
    pending,
    isReady: required.length > 0 && pending.length === 0,
    completionPercent: required.length > 0 ? Math.round((completed.length / required.length) * 100) : 100,
    isLoading: loadingTemplates || loadingSubmissions,
  };
}
