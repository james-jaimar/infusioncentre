import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PatientInvite {
  id: string;
  patient_id: string;
  token: string;
  email: string;
  phone: string | null;
  status: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export function usePatientInvites(patientId: string | undefined) {
  return useQuery({
    queryKey: ["patient_invites", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("patient_invites" as any)
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PatientInvite[];
    },
    enabled: !!patientId,
  });
}

export function useSendInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      patient_id: string;
      email: string;
      phone?: string;
      treatment_type_ids?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke("send-patient-invite", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["patient_invites", vars.patient_id] });
      qc.invalidateQueries({ queryKey: ["onboarding_checklists", vars.patient_id] });
    },
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ inviteId, patientId }: { inviteId: string; patientId: string }) => {
      const { error } = await supabase
        .from("patient_invites" as any)
        .update({ status: "revoked" } as any)
        .eq("id", inviteId);
      if (error) throw error;
      return patientId;
    },
    onSuccess: (patientId) => {
      qc.invalidateQueries({ queryKey: ["patient_invites", patientId] });
    },
  });
}
