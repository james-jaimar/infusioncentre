import { ChairData, UnassignedTreatment } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, Droplets, Armchair } from "lucide-react";
import { formatDuration, getElapsedMs } from "./ElapsedTimer";

const EXPECTED_DURATION_MS = 2 * 60 * 60 * 1000;
const VITALS_INTERVAL_MS = 15 * 60 * 1000;

interface Alert {
  chairName: string;
  type: "vitals_overdue" | "running_over";
  detail: string;
}

function computeAlerts(chairs: ChairData[]): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  for (const chair of chairs) {
    const occ = chair.occupant;
    if (!occ) continue;

    const vitalsBase = occ.lastVitalsAt || occ.startedAt;
    if (vitalsBase) {
      const sinceVitals = now - new Date(vitalsBase).getTime();
      if (sinceVitals > VITALS_INTERVAL_MS) {
        const overdueMins = Math.floor((sinceVitals - VITALS_INTERVAL_MS) / 60000);
        alerts.push({ chairName: chair.name, type: "vitals_overdue", detail: `Vitals overdue by ${overdueMins}m` });
      }
    }

    if (occ.startedAt) {
      const elapsed = getElapsedMs(occ.startedAt);
      if (elapsed > EXPECTED_DURATION_MS) {
        alerts.push({ chairName: chair.name, type: "running_over", detail: `Running over by ${formatDuration(elapsed - EXPECTED_DURATION_MS)}` });
      }
    }
  }
  return alerts;
}

function computeAvgDuration(chairs: ChairData[]): string {
  const activeTimes = chairs
    .filter((c) => c.occupant?.startedAt)
    .map((c) => getElapsedMs(c.occupant!.startedAt));
  if (activeTimes.length === 0) return "—";
  const avg = activeTimes.reduce((a, b) => a + b, 0) / activeTimes.length;
  return formatDuration(avg);
}

interface MonitoringSidebarProps {
  chairs: ChairData[];
  unassigned: UnassignedTreatment[];
  availableChairs: ChairData[];
  onAssign: (appointmentId: string, chairId: string) => void;
}

export function MonitoringSidebar({ chairs, unassigned, availableChairs, onAssign }: MonitoringSidebarProps) {
  const alerts = computeAlerts(chairs);
  const activeCount = chairs.filter((c) => c.occupant).length;
  const availableCount = chairs.filter((c) => !c.occupant).length;
  const avgDuration = computeAvgDuration(chairs);

  return (
    <div className="space-y-3">
      {/* Live Alerts */}
      <div className="rounded-xl border border-border/40 bg-card shadow-clinical-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Live Alerts</h3>
          {alerts.length > 0 && <Badge variant="danger">{alerts.length}</Badge>}
        </div>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const isDanger = alert.type === "vitals_overdue";
              return (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isDanger ? "bg-clinical-danger" : "bg-clinical-warning"}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isDanger ? "text-clinical-danger" : "text-clinical-warning"}`}>
                      {alert.chairName}
                    </p>
                    <p className="text-muted-foreground">{alert.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned Treatments */}
      {unassigned.length > 0 && (
        <div className="rounded-xl border border-clinical-warning/30 bg-clinical-warning-soft/30 shadow-clinical-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-clinical-warning" />
            <h3 className="text-sm font-semibold text-foreground">Unassigned</h3>
            <Badge variant="warning">{unassigned.length}</Badge>
          </div>
          <div className="space-y-3">
            {unassigned.map((t) => (
              <div key={t.treatmentId} className="space-y-1.5">
                <div>
                  <p className="text-sm font-medium text-foreground truncate">{t.patientName}</p>
                  <p className="text-xs text-muted-foreground">{t.treatmentType}</p>
                </div>
                <Select onValueChange={(chairId) => onAssign(t.appointmentId, chairId)}>
                  <SelectTrigger className="w-full min-h-[44px] text-xs">
                    <SelectValue placeholder="Assign chair…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableChairs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="rounded-xl border border-border/40 bg-card shadow-clinical-sm p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Stats</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-3.5 w-3.5" />
              <span>Active infusions</span>
            </div>
            <span className="font-bold text-clinical-success">{activeCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Armchair className="h-3.5 w-3.5" />
              <span>Chairs available</span>
            </div>
            <span className="font-bold text-foreground">{availableCount}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Average session duration</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgDuration}</p>
        </div>
      </div>
    </div>
  );
}
