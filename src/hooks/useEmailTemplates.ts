import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  subject: string;
  html_body: string;
  text_body: string | null;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as EmailTemplate[];
    },
  });
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["email_template", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    enabled: !!id,
  });
}

export function useUpdateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmailTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from("email_templates")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}

export function useCreateEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("email_templates")
        .insert(template as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}
