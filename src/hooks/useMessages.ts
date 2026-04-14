import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Message {
  id: string;
  tenant_id: string;
  conversation_type: string;
  patient_id: string | null;
  doctor_id: string | null;
  sender_id: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useMessages(opts: { patientId?: string; doctorId?: string; conversationType?: string }) {
  const queryClient = useQueryClient();
  const { patientId, doctorId, conversationType } = opts;

  const queryKey = ["messages", patientId, doctorId, conversationType];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (patientId) q = q.eq("patient_id", patientId);
      if (doctorId) q = q.eq("doctor_id", doctorId);
      if (conversationType) q = q.eq("conversation_type", conversationType);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as Message[];
    },
    enabled: !!(patientId || doctorId),
  });

  // Realtime subscription
  useEffect(() => {
    if (!patientId && !doctorId) return;

    const channel = supabase
      .channel(`messages-${patientId || doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: patientId
            ? `patient_id=eq.${patientId}`
            : `doctor_id=eq.${doctorId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId, doctorId, queryClient]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: {
      conversation_type: string;
      patient_id?: string | null;
      doctor_id?: string | null;
      sender_id: string;
      sender_role: string;
      content: string;
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert(msg as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ messageIds }: { messageIds: string[] }) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in("id", messageIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export interface Conversation {
  type: "admin_patient" | "admin_doctor";
  patient_id?: string;
  doctor_id?: string;
  name: string;
  subtitle?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      // Get all messages grouped by conversation
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get patient and doctor info
      const patientIds = [...new Set((messages || []).filter(m => m.patient_id).map(m => m.patient_id!))];
      const doctorIds = [...new Set((messages || []).filter(m => m.doctor_id).map(m => m.doctor_id!))];

      const [patientsRes, doctorsRes] = await Promise.all([
        patientIds.length > 0
          ? supabase.from("patients").select("id, first_name, last_name, email").in("id", patientIds)
          : { data: [] },
        doctorIds.length > 0
          ? supabase.from("doctors").select("id, practice_name, email, specialisation").in("id", doctorIds)
          : { data: [] },
      ]);

      const patients = new Map((patientsRes.data || []).map(p => [p.id, p]));
      const doctors = new Map((doctorsRes.data || []).map(d => [d.id, d]));

      // Group into conversations
      const convMap = new Map<string, Conversation>();

      for (const msg of (messages || [])) {
        const key = msg.patient_id
          ? `patient-${msg.patient_id}`
          : `doctor-${msg.doctor_id}`;

        if (!convMap.has(key)) {
          let name = "Unknown";
          let subtitle: string | undefined;

          if (msg.patient_id && patients.has(msg.patient_id)) {
            const p = patients.get(msg.patient_id)!;
            name = `${p.first_name} ${p.last_name}`;
            subtitle = p.email || undefined;
          } else if (msg.doctor_id && doctors.has(msg.doctor_id)) {
            const d = doctors.get(msg.doctor_id)!;
            name = d.practice_name || d.email || "Doctor";
            subtitle = d.specialisation || undefined;
          }

          convMap.set(key, {
            type: msg.conversation_type as any,
            patient_id: msg.patient_id || undefined,
            doctor_id: msg.doctor_id || undefined,
            name,
            subtitle,
            last_message: msg.content,
            last_message_at: msg.created_at,
            unread_count: 0,
          });
        }

        if (!msg.is_read) {
          convMap.get(key)!.unread_count++;
        }
      }

      return Array.from(convMap.values()).sort((a, b) =>
        (b.last_message_at || "").localeCompare(a.last_message_at || "")
      );
    },
  });
}
