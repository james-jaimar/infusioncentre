import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentWithRelations, AppointmentFormData } from "@/types/appointment";
import { addMinutes } from "date-fns";

export function useAppointments(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["appointments", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients!inner(id, first_name, last_name, phone),
          appointment_type:appointment_types!inner(*),
          chair:treatment_chairs(*)
        `)
        .order("scheduled_start", { ascending: true });

      if (startDate) {
        query = query.gte("scheduled_start", startDate.toISOString());
      }
      if (endDate) {
        query = query.lte("scheduled_start", endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as AppointmentWithRelations[];
    },
  });
}

export function useAppointment(id: string | undefined) {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          patient:patients!inner(id, first_name, last_name, phone),
          appointment_type:appointment_types!inner(*),
          chair:treatment_chairs(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as unknown as AppointmentWithRelations;
    },
    enabled: !!id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: AppointmentFormData) => {
      const scheduledEnd = addMinutes(formData.scheduled_start, formData.duration_minutes);

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          patient_id: formData.patient_id,
          appointment_type_id: formData.appointment_type_id,
          chair_id: formData.chair_id,
          assigned_nurse_id: formData.assigned_nurse_id,
          scheduled_start: formData.scheduled_start.toISOString(),
          scheduled_end: scheduledEnd.toISOString(),
          notes: formData.notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Appointment>;
    }) => {
      const { data: result, error } = await supabase
        .from("appointments")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function useCheckConflicts() {
  return useMutation({
    mutationFn: async ({
      chairId,
      scheduledStart,
      scheduledEnd,
      excludeAppointmentId,
    }: {
      chairId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      excludeAppointmentId?: string;
    }) => {
      let query = supabase
        .from("appointments")
        .select("id")
        .eq("chair_id", chairId)
        .neq("status", "cancelled")
        .neq("status", "no_show")
        .lt("scheduled_start", scheduledEnd.toISOString())
        .gt("scheduled_end", scheduledStart.toISOString());

      if (excludeAppointmentId) {
        query = query.neq("id", excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.length > 0;
    },
  });
}
