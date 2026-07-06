import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MessageFlagType =
  | "message_patient"
  | "create_appointment"
  | "complete_onboarding";

export interface MessageFlag {
  id: string;
  message_id: string;
  patient_id: string | null;
  flag_type: MessageFlagType;
  created_at: string;
  resolved_at: string | null;
}

export interface PendingMessageFlag extends MessageFlag {
  message_content: string | null;
  message_created_at: string | null;
  patient_first_name: string | null;
  patient_last_name: string | null;
}

export function useMessageFlagsForThread(patientId?: string) {
  return useQuery({
    queryKey: ["message-flags", "thread", patientId],
    queryFn: async () => {
      if (!patientId) return [] as MessageFlag[];
      const { data, error } = await (supabase as any)
        .from("message_action_flags")
        .select("id, message_id, patient_id, flag_type, created_at, resolved_at")
        .eq("patient_id", patientId)
        .is("resolved_at", null);
      if (error) throw error;
      return (data || []) as MessageFlag[];
    },
    enabled: !!patientId,
  });
}

export function usePendingMessageFlags() {
  return useQuery({
    queryKey: ["message-flags", "pending"],
    queryFn: async () => {
      const { data: flags, error } = await (supabase as any)
        .from("message_action_flags")
        .select("id, message_id, patient_id, flag_type, created_at, resolved_at")
        .is("resolved_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (flags || []) as MessageFlag[];
      if (!rows.length) return [] as PendingMessageFlag[];

      const msgIds = Array.from(new Set(rows.map((r) => r.message_id)));
      const patIds = Array.from(
        new Set(rows.map((r) => r.patient_id).filter(Boolean) as string[])
      );

      const [{ data: msgs }, { data: pats }] = await Promise.all([
        supabase.from("messages").select("id, content, created_at").in("id", msgIds),
        patIds.length
          ? supabase.from("patients").select("id, first_name, last_name").in("id", patIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const msgMap = new Map((msgs || []).map((m: any) => [m.id, m]));
      const patMap = new Map((pats || []).map((p: any) => [p.id, p]));

      return rows.map<PendingMessageFlag>((r) => {
        const m = msgMap.get(r.message_id);
        const p = r.patient_id ? patMap.get(r.patient_id) : null;
        return {
          ...r,
          message_content: m?.content ?? null,
          message_created_at: m?.created_at ?? null,
          patient_first_name: p?.first_name ?? null,
          patient_last_name: p?.last_name ?? null,
        };
      });
    },
    refetchInterval: 60000,
  });
}

export function useToggleMessageFlag() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (args: {
      messageId: string;
      patientId: string | null;
      flagType: MessageFlagType;
      existingId?: string | null;
    }) => {
      if (!user || !profile?.tenant_id) throw new Error("Not signed in");
      if (args.existingId) {
        const { error } = await (supabase as any)
          .from("message_action_flags")
          .delete()
          .eq("id", args.existingId);
        if (error) throw error;
        return { action: "removed" as const };
      }
      const { error } = await (supabase as any)
        .from("message_action_flags")
        .insert({
          message_id: args.messageId,
          patient_id: args.patientId,
          flag_type: args.flagType,
          tenant_id: profile.tenant_id,
          created_by: user.id,
        });
      if (error) throw error;
      return { action: "added" as const };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-flags"] });
    },
  });
}

export function useResolveMessageFlag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (flagId: string) => {
      const { error } = await (supabase as any)
        .from("message_action_flags")
        .update({
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id ?? null,
        })
        .eq("id", flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["message-flags"] });
    },
  });
}

export const FLAG_LABELS: Record<MessageFlagType, string> = {
  message_patient: "Message patient",
  create_appointment: "Create appointment",
  complete_onboarding: "Complete onboarding",
};
