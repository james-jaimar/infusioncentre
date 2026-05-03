import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { derivePatientStage, type PatientStage } from "@/lib/patientPipeline";

export type PipelineCounts = Record<PatientStage, number> & { total_active: number };

const EMPTY: PipelineCounts = {
  needs_invite: 0,
  invite_sent: 0,
  onboarding: 0,
  ready_to_schedule: 0,
  scheduled: 0,
  in_treatment: 0,
  completed: 0,
  paused: 0,
  cancelled: 0,
  no_course: 0,
  total_active: 0,
};

export function usePatientPipelineCounts() {
  return useQuery({
    queryKey: ["patient-pipeline-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(
          "id, user_id, status, treatment_courses(id, status, sessions_completed, total_sessions_planned), patient_invites(status, created_at, expires_at), onboarding_checklists(status), appointments(status)"
        )
        .neq("status", "archived")
        .limit(1000);
      if (error) throw error;
      const counts = { ...EMPTY };
      for (const p of (data as any[]) || []) {
        const checklists = p.onboarding_checklists ?? [];
        const appts = p.appointments ?? [];
        const stage = derivePatientStage({
          patient: p,
          courses: p.treatment_courses ?? [],
          invites: p.patient_invites ?? [],
          checklistTotal: checklists.length,
          checklistCompleted: checklists.filter((c: any) => c.status === "completed").length,
          appointmentsScheduled: appts.filter((a: any) => a.status !== "cancelled" && a.status !== "completed").length,
          appointmentsCompleted: appts.filter((a: any) => a.status === "completed").length,
        });
        counts[stage]++;
      }
      counts.total_active =
        counts.needs_invite + counts.invite_sent + counts.onboarding + counts.ready_to_schedule;
      return counts;
    },
    refetchInterval: 60000,
  });
}