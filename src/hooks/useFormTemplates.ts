import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FormCategory = Database["public"]["Enums"]["form_category"];

export interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  form_schema: any[];
  is_active: boolean;
  display_order: number;
  version: number;
  required_for_treatment_types: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  slug: string | null;
}

export function useFormTemplates(category?: FormCategory) {
  return useQuery({
    queryKey: ["form_templates", category],
    queryFn: async () => {
      let query = supabase
        .from("form_templates")
        .select("*")
        .order("display_order");

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FormTemplate[];
    },
  });
}

export function useFormTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["form_template", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as FormTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Partial<FormTemplate>) => {
      const { data, error } = await supabase
        .from("form_templates")
        .insert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form_templates"] }),
  });
}

export function useUpdateFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("form_templates")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form_templates"] }),
  });
}

export function useDeleteFormTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("form_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["form_templates"] }),
  });
}
