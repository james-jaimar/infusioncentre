import { useCommandCentre } from "@/hooks/useCommandCentre";
import { useState, useEffect } from "react";
import { Droplets } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChairPanel } from "@/components/nurse/command-centre/ChairPanel";
import { MonitoringSidebar } from "@/components/nurse/command-centre/MonitoringSidebar";
import { UpcomingSessions } from "@/components/nurse/command-centre/UpcomingSessions";

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-sm font-mono font-medium text-muted-foreground tabular-nums">
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
    </span>
  );
}

/* ── Main Page ── */
export default function NurseCommandCentre() {
  const { chairs, unassigned, upcomingSessions, isLoading, assignChair } = useCommandCentre();
  const availableChairs = chairs.filter((c) => !c.occupant);
  const activeCount = chairs.filter((c) => c.occupant).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading command centre…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between h-[60px]">
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Clinical Operations</h1>
          <p className="text-xs text-muted-foreground">Real-time treatment monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <div className="flex items-center gap-2 rounded-full bg-clinical-success-soft px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clinical-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-clinical-success" />
            </span>
            <div className="flex items-center gap-1 text-sm font-medium text-clinical-success">
              <Droplets className="h-3.5 w-3.5" />
              {activeCount} Active
            </div>
          </div>
        </div>
      </div>

      {/* ── 12-column grid: Primary (8) + Monitoring (4) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Primary Operations Zone */}
        <div className="md:col-span-8 space-y-4">
          {/* Primary zone card */}
          <div className="rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm shadow-clinical-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Primary Operations</h2>
              <Badge variant="success">{activeCount} Active infusions</Badge>
            </div>

            {/* Chair grid: 2 per row on md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chairs.map((chair) => (
                <ChairPanel key={chair.id} chair={chair} />
              ))}
            </div>
          </div>

          {/* Secondary row: Unassigned + Upcoming side by side */}
          {(unassigned.length > 0 || upcomingSessions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unassigned inline */}
              {unassigned.length > 0 && (
                <div className="rounded-xl border border-clinical-warning/30 bg-clinical-warning-soft/30 shadow-clinical-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Unassigned Treatments</h3>
                    <Badge variant="warning">{unassigned.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {unassigned.map((t) => (
                      <div key={t.treatmentId} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{t.patientName}</p>
                          <p className="text-xs text-muted-foreground">{t.treatmentType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming inline */}
              <UpcomingSessions sessions={upcomingSessions} compact />
            </div>
          )}
        </div>

        {/* Monitoring & Alerts Zone */}
        <div className="md:col-span-4">
          <MonitoringSidebar
            chairs={chairs}
            unassigned={unassigned}
            availableChairs={availableChairs}
            onAssign={(apptId, chairId) => assignChair.mutate({ appointmentId: apptId, chairId })}
          />
        </div>
      </div>
    </div>
  );
}
