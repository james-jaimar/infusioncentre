import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentWithRelations, AppointmentFormData } from "@/types/appointment";
import { addMinutes, endOfDay } from "date-fns";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";

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
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["appointments", startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          patient:patients!inner(id, first_name, last_name, phone, referring_doctor_name, referring_doctor_practice, referring_doctor_phone),
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

  useRealtimeInvalidate("appointments-list", [
    {
      table: "appointments",
      invalidate: [
        ["appointments"],
        ["appointment"],
        ["admin-dashboard-stats"],
        ["command-centre"],
      ],
    },
  ]);

  useEffect(() => {
    const channel = supabase
      .channel("appointments-list-direct-updates")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        (payload) => {
          const updated = payload.new as Partial<AppointmentWithRelations> & { id?: string };
          if (!updated.id) return;
          queryClient.setQueriesData<AppointmentWithRelations[]>(
            { queryKey: ["appointments"] },
            (old) =>
              old?.map((appointment) =>
                appointment.id === updated.id
                  ? ({ ...appointment, ...updated } as AppointmentWithRelations)
                  : appointment
              )
          );
          queryClient.setQueryData<AppointmentWithRelations | null>(
            ["appointment", updated.id],
            (old) => (old ? ({ ...old, ...updated } as AppointmentWithRelations) : old)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
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
          patient:patients!inner(id, first_name, last_name, phone, referring_doctor_name, referring_doctor_practice, referring_doctor_phone),
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
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
      queryClient.invalidateQueries({ queryKey: ["onboarding_checklists", vars.patient_id] });
      queryClient.invalidateQueries({ queryKey: ["form_submissions_readiness", vars.patient_id] });
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
      // Fetch patient_id first so we can invalidate their onboarding cache.
      const { data: existing } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      return { patientId: existing?.patient_id as string | undefined };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
      if (result?.patientId) {
        queryClient.invalidateQueries({ queryKey: ["onboarding_checklists", result.patientId] });
        queryClient.invalidateQueries({ queryKey: ["form_submissions_readiness", result.patientId] });
      }
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
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referrals-attention-count"] });
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
      // Move the SAME appointment to the new slot — no duplicate row.
      // Any admin-driven time change invalidates the patient's prior confirmation:
      // clear patient_confirmed_at and downgrade a `confirmed` status back to `scheduled`
      // so the calendar surfaces "needs re-confirmation" and admin is prompted to re-send SMS.
      const { data: existing } = await supabase
        .from("appointments")
        .select("status")
        .eq("id", originalAppointmentId)
        .maybeSingle();
      const updates: Record<string, unknown> = {
        scheduled_start: newData.scheduled_start.toISOString(),
        scheduled_end: newData.scheduled_end.toISOString(),
        chair_id: newData.chair_id,
        assigned_nurse_id: newData.assigned_nurse_id,
        reschedule_reason: reason,
        patient_confirmed_at: null,
      };
      if (existing?.status === "confirmed") updates.status = "scheduled";
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", originalAppointmentId)
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
      clearPatientConfirmation,
      downgradeConfirmedStatus,
      rescheduleReason,
    }: {
      id: string;
      newStart: Date;
      durationMinutes: number;
      newChairId?: string | null;
      /** When the start time changed, clear patient_confirmed_at so calendar shows "needs re-confirmation". */
      clearPatientConfirmation?: boolean;
      /** When the appointment was `confirmed`, downgrade to `scheduled` on time change. */
      downgradeConfirmedStatus?: boolean;
      /** Optional reason to stamp on the row so the "Rescheduled" badge appears. */
      rescheduleReason?: string;
    }) => {
      const newEnd = addMinutes(newStart, durationMinutes);
      const updates: Record<string, unknown> = {
        scheduled_start: newStart.toISOString(),
        scheduled_end: newEnd.toISOString(),
      };
      if (newChairId !== undefined) updates.chair_id = newChairId;
      if (clearPatientConfirmation) updates.patient_confirmed_at = null;
      if (downgradeConfirmedStatus) updates.status = "scheduled";
      if (rescheduleReason) updates.reschedule_reason = rescheduleReason;

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, newStart, durationMinutes, newChairId, clearPatientConfirmation, downgradeConfirmedStatus, rescheduleReason }) => {
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
                  patient_confirmed_at: clearPatientConfirmation ? null : a.patient_confirmed_at,
                  status: downgradeConfirmedStatus && a.status === "confirmed" ? "scheduled" : a.status,
                  reschedule_reason: rescheduleReason ?? (a as any).reschedule_reason,
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

/**
 * Mark a patient as physically arrived at the clinic (and optionally re-assign
 * the chair they're sitting in). Sits between `confirmed` and `checked_in`:
 * front-desk says "they're here", the nurse later opens the job card to start
 * the actual check-in form.
 */
export function useMarkArrived() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      chairId,
    }: {
      id: string;
      chairId?: string | null;
    }) => {
      const updates: Record<string, unknown> = { status: "arrived" };
      if (chairId !== undefined) updates.chair_id = chairId;

      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment"] });
      queryClient.invalidateQueries({ queryKey: ["command-centre"] });
    },
  });
}
