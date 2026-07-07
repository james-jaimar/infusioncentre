import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";

export interface AppointmentChangeRequest {
  id: string;
  appointment_id: string;
  patient_id: string;
  request_type: string;
  preferred_date: string | null;
  preferred_time_window: string | null;
  reason: string | null;
  status: string;
  created_at: string;
  new_appointment_id?: string | null;
  sms_sent_at?: string | null;
  appointment?: {
    id: string;
    scheduled_start: string;
    scheduled_end: string;
    appointment_type?: { name: string } | null;
  } | null;
  patient?: { id: string; first_name: string; last_name: string } | null;
}

export function usePendingChangeRequests() {
  const query = useQuery({
    queryKey: ["appointment-change-requests", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_change_requests" as any)
        .select(
          "id, appointment_id, patient_id, request_type, preferred_date, preferred_time_window, reason, status, created_at, new_appointment_id, sms_sent_at, appointment:appointments(id, scheduled_start, scheduled_end, appointment_type:appointment_types(name)), patient:patients(id, first_name, last_name)"
        )
        .in("status", ["pending", "rescheduled_pending_sms"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AppointmentChangeRequest[];
    },
    refetchInterval: 30000,
  });

  useRealtimeInvalidate("acr-pending", [
    {
      table: "appointment_change_requests",
      invalidate: [["appointment-change-requests"]],
    },
  ]);

  return query;
}

export function useCreateChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      appointment_id: string;
      patient_id: string;
      tenant_id: string;
      request_type?: string;
      preferred_date?: string | null;
      preferred_time_window?: string | null;
      reason?: string | null;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("appointment_change_requests" as any)
        .insert({
          appointment_id: input.appointment_id,
          patient_id: input.patient_id,
          tenant_id: input.tenant_id,
          requested_by: user?.id ?? null,
          request_type: input.request_type ?? "reschedule",
          preferred_date: input.preferred_date ?? null,
          preferred_time_window: input.preferred_time_window ?? null,
          reason: input.reason ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment-change-requests"] }),
  });
}

export function useResolveChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: "resolved" | "dismissed"; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("appointment_change_requests" as any)
        .update({
          status: input.status,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
          resolution_notes: input.notes ?? null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment-change-requests"] }),
  });
}

export function useMarkRequestRescheduled() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; new_appointment_id: string }) => {
      const { error } = await supabase
        .from("appointment_change_requests" as any)
        .update({
          status: "rescheduled_pending_sms",
          new_appointment_id: input.new_appointment_id,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment-change-requests"] }),
  });
}

export function useMarkRequestSmsSent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const nowIso = new Date().toISOString();
      const { error } = await supabase
        .from("appointment_change_requests" as any)
        .update({
          status: "resolved",
          sms_sent_at: nowIso,
          resolved_at: nowIso,
          resolved_by: user?.id ?? null,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointment-change-requests"] }),
  });
}