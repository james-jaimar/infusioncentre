import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export function usePendingReferralsCount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const initialized = useRef(false);

  const query = useQuery({
    queryKey: ["pending-referrals-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("referrals")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;
    // Mark initialized after first successful fetch so we don't toast on mount
    if (query.data !== undefined) initialized.current = true;
  }, [query.data, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("pending-referrals-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals" },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["pending-referrals-count"] });
          qc.invalidateQueries({ queryKey: ["referrals"] });
          if (
            initialized.current &&
            payload.eventType === "INSERT" &&
            payload.new?.status === "pending"
          ) {
            const name = [payload.new?.patient_first_name, payload.new?.patient_last_name]
              .filter(Boolean)
              .join(" ");
            toast.info("New referral received", {
              description: name ? `Patient: ${name}` : undefined,
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query.data || 0;
}
