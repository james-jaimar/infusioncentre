import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CommunicationLogEntry {
  id: string;
  type: string;
  recipient: string;
  subject: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  template: string | null;
}

export function useCommunicationLog(filters?: {
  status?: string;
  type?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["communication_log", filters],
    queryFn: async () => {
      let query = supabase
        .from("communication_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status as "pending" | "sent" | "failed");
      }
      if (filters?.type && filters.type !== "all") {
        query = query.eq("type", filters.type as "email" | "sms" | "whatsapp");
      }
      if (filters?.search) {
        query = query.or(
          `recipient.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CommunicationLogEntry[];
    },
  });
}

export function useResendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (logEntry: CommunicationLogEntry) => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          to: logEntry.recipient,
          subject: logEntry.subject || "No subject",
          html: `<p>Resent email — original subject: ${logEntry.subject}</p>`,
          related_entity_type: logEntry.related_entity_type,
          related_entity_id: logEntry.related_entity_id,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication_log"] }),
  });
}

export function useSendAdHocEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { to: string; subject: string; html: string; text?: string }) => {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["communication_log"] }),
  });
}
