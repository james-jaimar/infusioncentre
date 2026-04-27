import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentWithRelations, AppointmentFormData } from "@/types/appointment";
import { addMinutes, endOfDay } from "date-fns";

interface BulkAppointmentData {
  patient_id: string;
  appointment_type_id: string;
  treatment_course_id: string | null;
  chair_id: string | null;
  assigned_nurse_id: string | null;
  scheduled_start: Date;
  duration_minutes: number;
  session_number: number;
  notes: string;
}

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
        // Use end-of-day so events on the last day of the range are included
        query = query.lte("scheduled_start", endOfDay(endDate).toISOString());
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments"] });
      const previous = queryClient.getQueriesData({ queryKey: ["appointments"] });
      queryClient.setQueriesData<AppointmentWithRelations[]>(
        { queryKey: ["appointments"] },
        (old) => {
          if (!old) return old;
          return old.map((a) => (a.id === id ? { ...a, ...data } as AppointmentWithRelations : a));
        }
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) {
          queryClient.setQueryData(key, value);
        }
      }
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

export function useCreateBulkAppointments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ appointments }: { appointments: BulkAppointmentData[] }) => {
      const rows = appointments.map((a) => ({
        patient_id: a.patient_id,
        appointment_type_id: a.appointment_type_id,
        treatment_course_id: a.treatment_course_id,
        chair_id: a.chair_id,
        assigned_nurse_id: a.assigned_nurse_id,
        scheduled_start: a.scheduled_start.toISOString(),
        scheduled_end: addMinutes(a.scheduled_start, a.duration_minutes).toISOString(),
        session_number: a.session_number,
        notes: a.notes,
      }));

      const { data, error } = await supabase
        .from("appointments")
        .insert(rows)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["treatment-courses"] });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      originalAppointmentId,
      newData,
      reason,
    }: {
      originalAppointmentId: string;
      newData: {
        patient_id: string;
        appointment_type_id: string;
        treatment_course_id: string | null;
        chair_id: string | null;
        assigned_nurse_id: string | null;
        scheduled_start: Date;
        scheduled_end: Date;
        session_number: number | null;
      };
      reason: string;
    }) => {
      // Mark original as rescheduled
      const { error: updateError } = await supabase
        .from("appointments")
        .update({
          status: "rescheduled" as any,
          reschedule_reason: reason,
        })
        .eq("id", originalAppointmentId);

      if (updateError) throw updateError;

      // Create new appointment linked to original
      const { data, error: insertError } = await supabase
        .from("appointments")
        .insert({
          patient_id: newData.patient_id,
          appointment_type_id: newData.appointment_type_id,
          treatment_course_id: newData.treatment_course_id,
          chair_id: newData.chair_id,
          assigned_nurse_id: newData.assigned_nurse_id,
          scheduled_start: newData.scheduled_start.toISOString(),
          scheduled_end: newData.scheduled_end.toISOString(),
          rescheduled_from_id: originalAppointmentId,
          session_number: newData.session_number,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
    },
  });
}

export function useNurseWorkload(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: ["nurse-workload", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      if (!startDate || !endDate) return {};

      const { data, error } = await supabase
        .from("appointments")
        .select("assigned_nurse_id")
        .gte("scheduled_start", startDate.toISOString())
        .lte("scheduled_start", endDate.toISOString())
        .neq("status", "cancelled")
        .neq("status", "no_show")
        .not("assigned_nurse_id", "is", null);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        if (row.assigned_nurse_id) {
          counts[row.assigned_nurse_id] = (counts[row.assigned_nurse_id] || 0) + 1;
        }
      }
      return counts;
    },
    enabled: !!startDate && !!endDate,
  });
}

/**
 * Move an appointment (drag-drop) — updates start/end and optionally chair.
 * Optimistic cache update so the calendar feels instant.
 */
export function useMoveAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      newStart,
      durationMinutes,
      newChairId,
    }: {
      id: string;
      newStart: Date;
      durationMinutes: number;
      newChairId?: string | null;
    }) => {
      const newEnd = addMinutes(newStart, durationMinutes);
      const updates: Record<string, unknown> = {
        scheduled_start: newStart.toISOString(),
        scheduled_end: newEnd.toISOString(),
      };
      if (newChairId !== undefined) updates.chair_id = newChairId;

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, newStart, durationMinutes, newChairId }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["appointments"] });
      const previous = queryClient.getQueriesData({ queryKey: ["appointments"] });

      const newEnd = addMinutes(newStart, durationMinutes);
      queryClient.setQueriesData<AppointmentWithRelations[]>(
        { queryKey: ["appointments"] },
        (old) => {
          if (!old) return old;
          return old.map((a) =>
            a.id === id
              ? {
                  ...a,
                  scheduled_start: newStart.toISOString(),
                  scheduled_end: newEnd.toISOString(),
                  chair_id: newChairId !== undefined ? newChairId : a.chair_id,
                }
              : a
          );
        }
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        for (const [key, value] of ctx.previous) {
          queryClient.setQueryData(key, value);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
