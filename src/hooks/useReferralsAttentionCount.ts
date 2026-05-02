import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getReferralAttention } from "@/lib/referralProgress";

export interface AttentionBreakdown {
  awaiting_triage: number;
  needs_patient: number;
  needs_course: number;
  needs_scheduling: number;
  total: number;
}

const EMPTY: AttentionBreakdown = {
  awaiting_triage: 0,
  needs_patient: 0,
  needs_course: 0,
  needs_scheduling: 0,
  total: 0,
};

export function useReferralsAttentionCount(): AttentionBreakdown {
  const { user } = useAuth();
  const qc = useQueryClient();
  const initialized = useRef(false);

  const query = useQuery({
    queryKey: ["referrals-attention-count"],
    queryFn: async () => {
      // Pull only the columns we need + course ids to compute course_count cheaply
      const { data, error } = await supabase
        .from("referrals")
        .select("id, status, patient_id, treatment_courses:treatment_courses!treatment_courses_referral_id_fkey(id, total_sessions_planned, appointments:appointments!appointments_treatment_course_id_fkey(id, status))");
      if (error) throw error;

      const breakdown = { ...EMPTY };
      for (const r of data || []) {
        const courses = ((r as any).treatment_courses) || [];
        const courseCount = courses.length;
        const totalSessionsPlanned = courses.reduce(
          (s: number, c: any) => s + (c.total_sessions_planned || 0),
          0
        );
        const appointmentCount = courses.reduce(
          (s: number, c: any) =>
            s +
            (Array.isArray(c.appointments)
              ? c.appointments.filter((a: any) => a.status !== "cancelled").length
              : 0),
          0
        );
        const a = getReferralAttention(r as any, courseCount, {
          appointmentCount,
          totalSessionsPlanned,
        });
        if (a === "awaiting_triage") breakdown.awaiting_triage++;
        else if (a === "needs_patient") breakdown.needs_patient++;
        else if (a === "needs_course") breakdown.needs_course++;
        else if (a === "needs_scheduling") breakdown.needs_scheduling++;
      }
      breakdown.total =
        breakdown.awaiting_triage +
        breakdown.needs_patient +
        breakdown.needs_course +
        breakdown.needs_scheduling;
      return breakdown;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!user) return;
    if (query.data !== undefined) initialized.current = true;
  }, [query.data, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("referrals-attention-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "referrals" },
        (payload: any) => {
          qc.invalidateQueries({ queryKey: ["referrals-attention-count"] });
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treatment_courses" },
        () => {
          qc.invalidateQueries({ queryKey: ["referrals-attention-count"] });
          qc.invalidateQueries({ queryKey: ["referrals"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          qc.invalidateQueries({ queryKey: ["referrals-attention-count"] });
          qc.invalidateQueries({ queryKey: ["referrals"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  return query.data || EMPTY;
}