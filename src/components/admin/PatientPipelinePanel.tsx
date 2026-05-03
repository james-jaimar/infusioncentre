import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, KeyRound, MailCheck, ClipboardList, CalendarPlus, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { usePatientInvites, useSendInvite } from "@/hooks/usePatientInvites";
import { useTreatmentCoursesByPatient } from "@/hooks/useTreatmentCourses";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { derivePatientStage, STAGE_LABEL, STAGE_CLASS, nextActionFor } from "@/lib/patientPipeline";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  patient: { id: string; user_id: string | null; email: string | null; phone: string | null; first_name: string };
}

export default function PatientPipelinePanel({ patient }: Props) {
  const navigate = useNavigate();
  const { data: checklist } = useOnboardingChecklist(patient.id);
  const { data: invites } = usePatientInvites(patient.id);
  const { data: appts } = useQuery({
    queryKey: ["patient-appointments-pipeline", patient.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, status, treatment_course_id")
        .eq("patient_id", patient.id);
      if (error) throw error;
      return data || [];
    },
  });
  const { data: courses } = useTreatmentCoursesByPatient(patient.id);
  const sendInvite = useSendInvite();

  const checklistTotal = checklist?.length ?? 0;
  const checklistCompleted = checklist?.filter((c) => c.status === "completed").length ?? 0;
  const ACTIVE = ["draft", "onboarding", "ready", "active", "completing"];
  const activeCourseId = (courses ?? []).find((c: any) => ACTIVE.includes(c.status))?.id;
  const scopedAppts = activeCourseId
    ? (appts ?? []).filter((a: any) => a.treatment_course_id === activeCourseId)
    : (appts ?? []);
  const apptsScheduled = scopedAppts.filter((a: any) => a.status !== "cancelled" && a.status !== "completed").length;
  const apptsCompleted = scopedAppts.filter((a: any) => a.status === "completed").length;
  const pendingInvite = (invites ?? []).find((i) => i.status === "pending" && new Date(i.expires_at) > new Date());

  const stage = derivePatientStage({
    patient,
    courses: (courses ?? []).map((c: any) => ({
      id: c.id,
      status: c.status,
      sessions_completed: c.sessions_completed,
      total_sessions_planned: c.total_sessions_planned,
    })),
    invites,
    checklistTotal,
    checklistCompleted,
    appointmentsScheduled: apptsScheduled,
    appointmentsCompleted: apptsCompleted,
  });

  const action = nextActionFor(stage);

  const handleResend = async () => {
    if (!patient.email) {
      toast.error("No email on file for this patient");
      return;
    }
    try {
      await sendInvite.mutateAsync({
        patient_id: patient.id,
        email: patient.email,
        phone: patient.phone || undefined,
      });
      toast.success("Portal invite sent");
    } catch (e: any) {
      toast.error(e.message || "Could not send invite");
    }
  };

  return (
    <Card className="mb-4 border-primary/20">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge className={cn("border", STAGE_CLASS[stage])}>{STAGE_LABEL[stage]}</Badge>
            {action && <span className="text-sm text-muted-foreground">{action}</span>}
          </div>

          <div className="flex items-center gap-4 ml-auto text-sm">
            <div className="flex items-center gap-2">
              {patient.user_id ? (
                <><KeyRound className="h-4 w-4 text-clinical-success" /><span>Account active</span></>
              ) : pendingInvite ? (
                <><MailCheck className="h-4 w-4 text-clinical-info" />
                  <span>Invite sent {formatDistanceToNow(new Date(pendingInvite.created_at), { addSuffix: true })}</span></>
              ) : (
                <><KeyRound className="h-4 w-4 text-clinical-warning" /><span>No portal access yet</span></>
              )}
            </div>

            {checklistTotal > 0 && (
              <div className="flex items-center gap-2">
                {checklistCompleted === checklistTotal ? (
                  <CheckCircle2 className="h-4 w-4 text-clinical-success" />
                ) : (
                  <ClipboardList className="h-4 w-4 text-clinical-warning" />
                )}
                <span>Forms {checklistCompleted}/{checklistTotal}</span>
              </div>
            )}

            {(stage === "needs_invite" || stage === "invite_sent") && patient.email && (
              <Button size="sm" variant="outline" onClick={handleResend} disabled={sendInvite.isPending}>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {pendingInvite ? "Resend invite" : "Send invite"}
              </Button>
            )}
            {stage === "ready_to_schedule" && (
              <Button size="sm" onClick={() => navigate(`/admin/appointments/new?patient=${patient.id}`)}>
                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                Schedule session
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}