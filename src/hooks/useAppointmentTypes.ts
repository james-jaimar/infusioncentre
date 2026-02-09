import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentType } from "@/types/appointment";

export function useAppointmentTypes(includeInactive = false) {
  return useQuery({
    queryKey: ["appointment-types", includeInactive],
    queryFn: async () => {
      let query = supabase
        .from("appointment_types")
        .select("*")
        .order("display_order", { ascending: true });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AppointmentType[];
    },
  });
}

export function useCreateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentType: {
      name: string;
      default_duration_minutes?: number;
      color?: string;
      requires_consent?: boolean;
      preparation_instructions?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("appointment_types")
        .insert([appointmentType])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}

export function useUpdateAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<AppointmentType>;
    }) => {
      const { data: result, error } = await supabase
        .from("appointment_types")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}

export function useDeleteAppointmentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointment_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-types"] });
    },
  });
}
