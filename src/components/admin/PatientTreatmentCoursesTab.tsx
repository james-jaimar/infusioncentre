import { useState } from "react";
import { format, isAfter } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarPlus, Layers, FileText, CalendarDays, ExternalLink, MapPin } from "lucide-react";
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

const ACTIVE_APPT_STATUSES = new Set([
  "scheduled", "confirmed", "checked_in", "in_progress", "completed",
]);

const APPT_STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  checked_in: "bg-amber-100 text-amber-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-slate-200 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-slate-100 text-slate-600",
  no_show: "bg-red-100 text-red-800",
};

interface Props {
  patientId: string;
}

export default function PatientTreatmentCoursesTab({ patientId }: Props) {
  const { data: courses = [], isLoading } = useTreatmentCoursesByPatient(patientId);
  const [scheduling, setScheduling] = useState<any>(null);
  const navigate = useNavigate();

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
        const allAppts: any[] = (course.appointments || []).filter(
          (a: any) => ACTIVE_APPT_STATUSES.has(a.status)
        );
        const upcoming = allAppts
          .filter((a) => a.status !== "completed")
          .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());
        const scheduledCount = upcoming.length;
        const remaining = Math.max(0, total - done - scheduledCount);
        const canSchedule = SCHEDULABLE.includes(course.status) && (total === 0 || done + scheduledCount < total);
        const overBooked = total > 0 && done + scheduledCount > total;

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
                <div className="flex items-center gap-2">
                  {scheduledCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => navigate(`/admin/appointments?patient=${patientId}`)}
                    >
                      <CalendarDays className="h-4 w-4" />
                      View on calendar
                    </Button>
                  )}
                  {canSchedule && (
                    <Button size="sm" onClick={() => setScheduling(course)} className="gap-1">
                      <CalendarPlus className="h-4 w-4" />
                      {scheduledCount > 0 ? "Schedule more" : "Schedule sessions"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md border p-2">
                    <div className="text-2xl font-semibold tabular-nums">{done}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Completed</div>
                  </div>
                  <div className="rounded-md border p-2 bg-blue-50/50">
                    <div className="text-2xl font-semibold tabular-nums text-blue-700">{scheduledCount}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Scheduled</div>
                  </div>
                  <div className="rounded-md border p-2">
                    <div className="text-2xl font-semibold tabular-nums">{total || "—"}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Planned</div>
                  </div>
                </div>
                {total > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Completion progress</span>
                      <span>{done} / {total}</span>
                    </div>
                    <Progress value={pct} />
                  </div>
                )}
                {overBooked && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    More appointments are booked than the planned course length. Consider removing extras or expanding the plan.
                  </p>
                )}
                {!overBooked && total > 0 && remaining > 0 && scheduledCount === 0 && done === 0 && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    No sessions scheduled yet. Click "Schedule sessions" to add them to the calendar.
                  </p>
                )}
              </div>

              {upcoming.length > 0 && (
                <div className="rounded-md border">
                  <div className="px-3 py-2 border-b bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Scheduled sessions ({upcoming.length})
                  </div>
                  <ul className="divide-y">
                    {upcoming.map((a) => (
                      <li
                        key={a.id}
                        className="px-3 py-2 flex items-center gap-3 text-sm hover:bg-muted/40 cursor-pointer"
                        onClick={() => navigate(`/admin/appointments/${a.id}`)}
                      >
                        <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
                          #{a.session_number ?? "—"}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="font-medium">
                            {format(new Date(a.scheduled_start), "EEE d MMM yyyy")}
                          </span>
                          <span className="text-muted-foreground"> · {format(new Date(a.scheduled_start), "HH:mm")}</span>
                          {a.chair?.name && (
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1 ml-2">
                              <MapPin className="h-3 w-3" />{a.chair.name}
                            </span>
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${APPT_STATUS_STYLE[a.status] || ""}`}
                        >
                          {a.status.replace(/_/g, " ")}
                        </Badge>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
