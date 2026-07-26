import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { derivePatientStage, ACTIVE_COURSE_STATUSES } from "@/lib/patientPipeline";
import { useRealtimeInvalidate } from "./useRealtimeInvalidate";

export interface PendingForm {
  id: string;
  name: string;
  category: string | null;
}

export interface OnboardingPatient {
  id: string;
  first_name: string | null;
  last_name: string | null;
  pendingForms: PendingForm[];
}

export function usePatientsInOnboarding() {
  const query = useQuery({
    queryKey: ["patients-in-onboarding"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select(
          `id, first_name, last_name, user_id, status,
          treatment_courses(id, status, sessions_completed, total_sessions_planned),
          patient_invites(status, created_at, expires_at),
          onboarding_checklists(id, status, form_template_id, form_templates(id, name, category)),
          appointments(status, treatment_course_id)`
        )
        .neq("status", "archived")
        .limit(1000);
      if (error) throw error;

      const result: OnboardingPatient[] = [];
      for (const p of (data as any[]) || []) {
        const checklists = p.onboarding_checklists ?? [];
        const activeCourseId = (p.treatment_courses ?? []).find((c: any) =>
          (ACTIVE_COURSE_STATUSES as readonly string[]).includes(c.status)
        )?.id;
        const allAppts = p.appointments ?? [];
        const appts = activeCourseId
          ? allAppts.filter((a: any) => a.treatment_course_id === activeCourseId)
          : allAppts;
        const stage = derivePatientStage({
          patient: p,
          courses: p.treatment_courses ?? [],
          invites: p.patient_invites ?? [],
          checklistTotal: checklists.length,
          checklistCompleted: checklists.filter((c: any) => c.status === "completed").length,
          appointmentsScheduled: appts.filter((a: any) => a.status !== "cancelled" && a.status !== "completed").length,
          appointmentsCompleted: appts.filter((a: any) => a.status === "completed").length,
        });

        if (stage === "onboarding") {
          const pendingForms = checklists
            .filter((c: any) => c.status !== "completed")
            .map((c: any) => ({
              id: c.id,
              name: c.form_templates?.name || "Form",
              category: c.form_templates?.category || null,
            }));
          result.push({
            id: p.id,
            first_name: p.first_name,
            last_name: p.last_name,
            pendingForms,
          });
        }
      }
      return result;
    },
    refetchInterval: 60000,
  });

  useRealtimeInvalidate("patients-in-onboarding", [
    { table: "patients", invalidate: [["patients-in-onboarding"]] },
    { table: "onboarding_checklists", invalidate: [["patients-in-onboarding"]] },
    { table: "appointments", invalidate: [["patients-in-onboarding"]] },
  ]);

  return query;
}
