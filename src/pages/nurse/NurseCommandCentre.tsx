import { useCommandCentre } from "@/hooks/useCommandCentre";
import { useState, useEffect } from "react";
import { Droplets } from "lucide-react";
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
    <div className="space-y-6">
      {/* ── Header: thin, institutional ── */}
      <div className="flex items-center justify-between h-[60px]">
        <div>
          <h1 className="text-xl font-semibold text-foreground leading-tight">Clinical Operations</h1>
          <p className="text-xs text-muted-foreground">Real-time treatment monitoring</p>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-clinical-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-clinical-success" />
            </span>
            <div className="flex items-center gap-1 text-sm font-medium text-foreground">
              <Droplets className="h-3.5 w-3.5 text-clinical-success" />
              {activeCount} Active
            </div>
          </div>
        </div>
      </div>

      {/* ── 12-column grid: Primary (8) + Monitoring (4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Operations Zone */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chairs.map((chair) => (
              <ChairPanel key={chair.id} chair={chair} />
            ))}
          </div>
        </div>

        {/* Monitoring & Alerts Zone */}
        <div className="lg:col-span-4">
          <MonitoringSidebar
            chairs={chairs}
            unassigned={unassigned}
            availableChairs={availableChairs}
            onAssign={(apptId, chairId) => assignChair.mutate({ appointmentId: apptId, chairId })}
          />
        </div>
      </div>

      {/* ── Secondary Zone: Upcoming Sessions ── */}
      <UpcomingSessions sessions={upcomingSessions} />
    </div>
  );
}
