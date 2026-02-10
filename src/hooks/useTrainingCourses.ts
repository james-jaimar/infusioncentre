import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTrainingCourses = (includeInactive = false) => {
  return useQuery({
    queryKey: ["training-courses", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("training_courses")
        .select("*")
        .order("created_at");
      if (!includeInactive) {
        query = query.eq("is_active", true);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export function useCreateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (course: {
      name: string;
      description?: string;
      duration_hours?: number;
      price?: number;
      max_participants?: number;
      includes?: string[];
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("training_courses")
        .insert([course])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
    },
  });
}

export function useUpdateTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { data: result, error } = await supabase
        .from("training_courses")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
    },
  });
}

export function useDeleteTrainingCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-courses"] });
    },
  });
}
