import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarPlus, Layers, FileText } from "lucide-react";
import { useTreatmentCoursesByPatient } from "@/hooks/useTreatmentCourses";
import { TreatmentCourseStatus } from "@/types/treatment";
import { RecurringSessionDialog } from "@/components/admin/RecurringSessionDialog";

const STATUS_CONFIG: Record<TreatmentCourseStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  onboarding: { label: "Onboarding", variant: "outline" },
  ready: { label: "Ready", variant: "default" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completing: { label: "Completing", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

const SCHEDULABLE: TreatmentCourseStatus[] = ["onboarding", "ready", "active"];

interface Props {
  patientId: string;
}

export default function PatientTreatmentCoursesTab({ patientId }: Props) {
  const { data: courses = [], isLoading } = useTreatmentCoursesByPatient(patientId);
  const [scheduling, setScheduling] = useState<any>(null);

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading...</p>;
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-2">
          <Layers className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No treatment course assigned</p>
          <p className="text-sm text-muted-foreground">
            Treatment courses are created when a referral is converted, or via the Referrals page.
          </p>
        </CardContent>
      </Card>
    );
  }

  const active = courses.filter((c: any) => !["completed", "cancelled"].includes(c.status));
  const past = courses.filter((c: any) => ["completed", "cancelled"].includes(c.status));

  return (
    <div className="space-y-4">
      {active.map((course: any) => {
        const cfg = STATUS_CONFIG[course.status as TreatmentCourseStatus] || STATUS_CONFIG.draft;
        const total = course.total_sessions_planned || 0;
        const done = course.sessions_completed || 0;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        const canSchedule = SCHEDULABLE.includes(course.status) && done < total;

        return (
          <Card key={course.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: course.appointment_type?.color }}
                    />
                    <CardTitle className="text-lg">{course.appointment_type?.name}</CardTitle>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(course.created_at), "dd MMM yyyy")}
                    {course.doctor?.practice_name && ` · Referred by ${course.doctor.practice_name}`}
                  </p>
                </div>
                {canSchedule && (
                  <Button size="sm" onClick={() => setScheduling(course)} className="gap-1">
                    <CalendarPlus className="h-4 w-4" />
                    Schedule Sessions
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sessions</span>
                  <span className="font-medium">{done} / {total}</span>
                </div>
                <Progress value={pct} />
              </div>

              {course.referral?.diagnosis && (
                <div className="rounded-md border p-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
                    <FileText className="h-3.5 w-3.5" />
                    Referral
                  </div>
                  <p className="text-sm">{course.referral.diagnosis}</p>
                  {course.referral.urgency && (
                    <Badge variant="outline" className="text-xs">{course.referral.urgency}</Badge>
                  )}
                </div>
              )}

              {course.notes && (
                <div className="rounded-md border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{course.notes}</p>
                </div>
              )}

              {course.expected_end_date && (
                <p className="text-sm text-muted-foreground">
                  Expected completion: {format(new Date(course.expected_end_date), "dd MMM yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {past.length > 0 && (
        <div className="space-y-2 pt-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Past Courses
          </h3>
          {past.map((course: any) => {
            const cfg = STATUS_CONFIG[course.status as TreatmentCourseStatus] || STATUS_CONFIG.draft;
            return (
              <Card key={course.id} className="opacity-75">
                <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: course.appointment_type?.color }}
                    />
                    <span className="font-medium">{course.appointment_type?.name}</span>
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {course.sessions_completed} / {course.total_sessions_planned} sessions
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(course.created_at), "dd MMM yyyy")}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {scheduling && (
        <RecurringSessionDialog
          open={!!scheduling}
          onOpenChange={(open) => !open && setScheduling(null)}
          treatmentCourse={{
            id: scheduling.id,
            patient_id: scheduling.patient_id,
            treatment_type_id: scheduling.treatment_type_id,
            total_sessions_planned: scheduling.total_sessions_planned,
            sessions_completed: scheduling.sessions_completed,
            appointment_type: scheduling.appointment_type,
            patient: scheduling.patient,
          }}
        />
      )}
    </div>
  );
}
