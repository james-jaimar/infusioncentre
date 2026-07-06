import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PendingApproval {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  patient_id: string | null;
  email: string | null;
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: ["pending-approvals"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, created_at, is_approved")
        .eq("is_approved", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!profiles?.length) return [] as PendingApproval[];

      const userIds = profiles.map((p) => p.user_id);
      const { data: patients } = await supabase
        .from("patients")
        .select("id, user_id, email")
        .in("user_id", userIds);
      const byUser = new Map(
        (patients ?? []).map((p) => [p.user_id, { patient_id: p.id, email: p.email }])
      );

      return profiles.map<PendingApproval>((p) => ({
        user_id: p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        created_at: p.created_at,
        patient_id: byUser.get(p.user_id)?.patient_id ?? null,
        email: byUser.get(p.user_id)?.email ?? null,
      }));
    },
    refetchInterval: 60000,
  });
}

export function useApproveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_approved: true } as any)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pending-approvals"] });
    },
  });
}
