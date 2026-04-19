import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CourseFrequency =
  | "single"
  | "weekly"
  | "twice_weekly"
  | "biweekly"
  | "monthly"
  | "as_needed"
  | "custom_schedule";

export type ServiceCategory = "infusion" | "care_pathway";

export interface CourseTemplate {
  id: string;
  tenant_id: string;
  appointment_type_id: string;
  name: string;
  description: string | null;
  default_sessions: number | null;
  default_frequency: CourseFrequency;
  default_session_duration_mins: number | null;
  medication_name: string | null;
  medication_notes: string | null;
  is_active: boolean;
  display_order: number;
  appointment_type?: { id: string; name: string; color: string; service_category?: ServiceCategory };
  template_forms?: Array<{ id: string; form_template_id: string; form_template?: { id: string; name: string } }>;
}

const KEY = "course-templates";

export function useCourseTemplates(appointmentTypeId?: string) {
  return useQuery({
    queryKey: [KEY, appointmentTypeId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("treatment_course_templates" as any)
        .select(`
          *,
          appointment_type:appointment_types!treatment_course_templates_appointment_type_id_fkey(id, name, color, service_category),
          template_forms:treatment_course_template_forms(id, form_template_id, form_template:form_templates(id, name))
        `)
        .order("display_order", { ascending: true });
      if (appointmentTypeId) q = q.eq("appointment_type_id", appointmentTypeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CourseTemplate[];
    },
  });
}

export function useActiveCourseTemplatesByType(appointmentTypeId?: string) {
  return useQuery({
    queryKey: [KEY, "active", appointmentTypeId],
    enabled: !!appointmentTypeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_course_templates" as any)
        .select("*")
        .eq("appointment_type_id", appointmentTypeId!)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CourseTemplate[];
    },
  });
}

export function useCourseTemplate(id?: string) {
  return useQuery({
    queryKey: [KEY, id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_course_templates" as any)
        .select(`
          *,
          appointment_type:appointment_types!treatment_course_templates_appointment_type_id_fkey(id, name, color, service_category),
          template_forms:treatment_course_template_forms(id, form_template_id, form_template:form_templates(id, name))
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as CourseTemplate;
    },
  });
}

export function useCreateCourseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CourseTemplate> & { appointment_type_id: string; name: string }) => {
      const { data, error } = await supabase
        .from("treatment_course_templates" as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCourseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseTemplate> }) => {
      const { error } = await supabase
        .from("treatment_course_templates" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCourseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treatment_course_templates" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useSetTemplateForms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, formTemplateIds }: { templateId: string; formTemplateIds: string[] }) => {
      // Replace strategy: delete all then insert
      const { error: delErr } = await supabase
        .from("treatment_course_template_forms" as any)
        .delete()
        .eq("template_id", templateId);
      if (delErr) throw delErr;
      if (formTemplateIds.length === 0) return;
      const rows = formTemplateIds.map((fid, i) => ({
        template_id: templateId,
        form_template_id: fid,
        display_order: i,
      }));
      const { error: insErr } = await supabase
        .from("treatment_course_template_forms" as any)
        .insert(rows as any);
      if (insErr) throw insErr;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
