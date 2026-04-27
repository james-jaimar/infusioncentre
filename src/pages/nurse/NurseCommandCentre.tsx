import { useCommandCentre } from "@/hooks/useCommandCentre";
import { useState, useEffect } from "react";
import { Droplets, Armchair } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChairPanel } from "@/components/nurse/command-centre/ChairPanel";
import { MonitoringSidebar } from "@/components/nurse/command-centre/MonitoringSidebar";
import { TodaysSchedule } from "@/components/nurse/command-centre/TodaysSchedule";
import { format } from "date-fns";

/* ── Live Clock ── */
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-right">
      <p className="text-sm font-mono font-medium text-foreground tabular-nums leading-none">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">
        {format(now, "EEE d MMM yyyy")}
      </p>
    </div>
  );
}

/* ── Main Page ── */
export default function NurseCommandCentre() {
  const { chairs, unassigned, todaysAppointments, isLoading, assignChair } = useCommandCentre();
  const activeCount = chairs.filter((c) => c.occupant).length;
  const totalChairs = chairs.length;

  // Candidates a nurse can drop onto a chair: today's appointments that don't yet
  // have a chair assigned and aren't already finished.
  const assignCandidates = todaysAppointments.filter(
    (a) =>
      !a.chairId &&
      ["scheduled", "confirmed", "checked_in"].includes(a.status)
  );

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
        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5">
            <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {activeCount}/{totalChairs}
            </span>
            <span className="text-xs text-muted-foreground">chairs</span>
          </div>
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

      {/* ── 12-column grid: Chair Floor (8) + Schedule + Alerts (4) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Chair Floor */}
        <div className="md:col-span-8 space-y-4">
          <div className="rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm shadow-clinical-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">Chair Floor</h2>
              <Badge variant="success">{activeCount} Active infusions</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chairs.map((chair) => (
                <ChairPanel
                  key={chair.id}
                  chair={chair}
                  assignCandidates={assignCandidates}
                  onAssignPatient={(appointmentId, chairId) =>
                    assignChair.mutate({ appointmentId, chairId })
                  }
                />
              ))}
            </div>
          </div>

          {/* Unassigned strip — informational; assignment happens via the chair card. */}
          {unassigned.length > 0 && (
            <div className="rounded-xl border border-clinical-warning/30 bg-clinical-warning-soft/30 shadow-clinical-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-foreground">Active treatments without a chair</h3>
                <Badge variant="warning">{unassigned.length}</Badge>
              </div>
              <div className="space-y-1">
                {unassigned.map((t) => (
                  <div key={t.treatmentId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-foreground truncate">{t.patientName}</span>
                    <span className="text-xs text-muted-foreground truncate">{t.treatmentType}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Today's schedule + monitoring */}
        <div className="md:col-span-4 space-y-4">
          <TodaysSchedule appointments={todaysAppointments} />
          <MonitoringSidebar chairs={chairs} />
        </div>
      </div>
    </div>
  );
}
