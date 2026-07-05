import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UnreadPatientMessage {
  patient_id: string;
  patient_first_name: string | null;
  patient_last_name: string | null;
  last_content: string;
  last_created_at: string;
  unread_count: number;
}

export function useUnreadPatientMessages() {
  return useQuery({
    queryKey: ["unread-patient-messages"],
    queryFn: async (): Promise<UnreadPatientMessage[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, patient_id, content, created_at, sender_role, is_read")
        .eq("sender_role", "patient")
        .eq("is_read", false)
        .not("patient_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;

      const byPatient = new Map<string, UnreadPatientMessage>();
      for (const m of data || []) {
        const pid = m.patient_id as string;
        const existing = byPatient.get(pid);
        if (existing) {
          existing.unread_count += 1;
        } else {
          byPatient.set(pid, {
            patient_id: pid,
            patient_first_name: null,
            patient_last_name: null,
            last_content: m.content,
            last_created_at: m.created_at,
            unread_count: 1,
          });
        }
      }

      const ids = Array.from(byPatient.keys());
      if (ids.length) {
        const { data: pts } = await supabase
          .from("patients")
          .select("id, first_name, last_name")
          .in("id", ids);
        for (const p of pts || []) {
          const row = byPatient.get(p.id);
          if (row) {
            row.patient_first_name = p.first_name;
            row.patient_last_name = p.last_name;
          }
        }
      }

      return Array.from(byPatient.values()).sort(
        (a, b) => new Date(b.last_created_at).getTime() - new Date(a.last_created_at).getTime()
      );
    },
    refetchInterval: 30000,
  });
}
