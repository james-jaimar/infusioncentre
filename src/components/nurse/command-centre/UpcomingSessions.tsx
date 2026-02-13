import { UpcomingSession } from "@/hooks/useCommandCentre";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";

interface UpcomingSessionsProps {
  sessions: UpcomingSession[];
}

export function UpcomingSessions({ sessions }: UpcomingSessionsProps) {
  if (sessions.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
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
    </Card>
  );
}
