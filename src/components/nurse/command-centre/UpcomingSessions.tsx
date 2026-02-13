import { UpcomingSession } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

interface UpcomingSessionsProps {
  sessions: UpcomingSession[];
  compact?: boolean;
}

export function UpcomingSessions({ sessions, compact }: UpcomingSessionsProps) {
  if (sessions.length === 0) return null;

  // Compact inline variant for primary zone secondary row
  if (compact) {
    return (
      <div className="rounded-xl border border-border/40 bg-card shadow-clinical-sm p-4">
        <div className="flex items-center gap-2 mb-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Upcoming Sessions</h3>
          <Badge variant="neutral">Next 2 hours</Badge>
        </div>
        <div className="space-y-2">
          {sessions.slice(0, 3).map((s) => {
            const minsUntil = differenceInMinutes(new Date(s.scheduledStart), new Date());
            return (
              <div key={s.appointmentId} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.patientName}</p>
                  <p className="text-xs text-muted-foreground">{s.treatmentType}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {minsUntil > 0 ? `In ${minsUntil} min` : format(new Date(s.scheduledStart), "HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant (fallback)
  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-clinical-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Upcoming Sessions</h3>
        <Badge variant="neutral">{sessions.length}</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sessions.map((s) => (
          <div key={s.appointmentId} className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{s.patientName}</p>
              <p className="text-xs text-muted-foreground">{s.treatmentType}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-mono font-medium text-foreground">
                {format(new Date(s.scheduledStart), "HH:mm")}
              </p>
              {s.chairName && (
                <p className="text-xs text-muted-foreground">{s.chairName}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
