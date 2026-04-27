import { useNavigate, useLocation } from "react-router-dom";
import { ScheduledAppointment } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, ArrowRight } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface TodaysScheduleProps {
  appointments: ScheduledAppointment[];
}

const statusMeta: Record<
  string,
  { label: string; pill: string; cta: string; ctaVariant: "default" | "outline" | "secondary" }
> = {
  scheduled: { label: "Scheduled", pill: "bg-muted text-muted-foreground", cta: "Open", ctaVariant: "outline" },
  confirmed: { label: "Confirmed", pill: "bg-clinical-info-soft text-clinical-info", cta: "Open", ctaVariant: "outline" },
  checked_in: { label: "Checked In", pill: "bg-clinical-warning-soft text-clinical-warning", cta: "Pre-Assess", ctaVariant: "default" },
  in_progress: { label: "In Progress", pill: "bg-clinical-success-soft text-clinical-success", cta: "Resume", ctaVariant: "default" },
  completed: { label: "Completed", pill: "bg-primary/10 text-primary", cta: "View", ctaVariant: "secondary" },
  cancelled: { label: "Cancelled", pill: "bg-destructive/10 text-destructive", cta: "View", ctaVariant: "secondary" },
  no_show: { label: "No-show", pill: "bg-muted text-muted-foreground", cta: "View", ctaVariant: "secondary" },
};

export function TodaysSchedule({ appointments }: TodaysScheduleProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const jobCardBase = isAdmin ? "/admin/job-card" : "/nurse/job-card";

  // Sort: in-progress + checked-in first (active work), then chronological future, then past.
  const now = new Date();
  const sorted = [...appointments].sort((a, b) => {
    const priority = (s: string) =>
      s === "in_progress" ? 0 : s === "checked_in" ? 1 : s === "confirmed" || s === "scheduled" ? 2 : 3;
    const pa = priority(a.status);
    const pb = priority(b.status);
    if (pa !== pb) return pa - pb;
    return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
  });

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-clinical-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Today's Schedule</h3>
        </div>
        <Badge variant="neutral">{appointments.length}</Badge>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No appointments today.</p>
      ) : (
        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
          {sorted.map((a) => {
            const meta = statusMeta[a.status] || statusMeta.scheduled;
            const minsUntil = differenceInMinutes(new Date(a.scheduledStart), now);
            const timeLabel =
              a.status === "in_progress"
                ? "Now"
                : a.status === "checked_in"
                ? "Waiting"
                : minsUntil > 0 && minsUntil < 90
                ? `In ${minsUntil}m`
                : format(new Date(a.scheduledStart), "HH:mm");

            return (
              <div
                key={a.appointmentId}
                className="rounded-lg border border-border/60 bg-background/60 px-3 py-2.5 hover:border-border transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate leading-tight">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.treatmentType}
                      {a.chairName ? ` · ${a.chairName}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono font-medium text-foreground tabular-nums">
                      {timeLabel}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(a.scheduledStart), "HH:mm")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.pill}`}>
                    {meta.label}
                  </span>
                  <Button
                    size="sm"
                    variant={meta.ctaVariant}
                    className="h-8 text-xs"
                    onClick={() => navigate(`${jobCardBase}/${a.appointmentId}`)}
                  >
                    {meta.cta}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}