import { useNavigate } from "react-router-dom";
import { useCommandCentre, ChairData, UnassignedTreatment } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Armchair, Clock, Activity, AlertCircle, Heart, Droplets } from "lucide-react";
import { useState, useEffect } from "react";

/* ── Vitals countdown logic ── */
function VitalsCountdown({ startedAt, lastVitalsAt }: { startedAt: string | null; lastVitalsAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const base = lastVitalsAt || startedAt;
  if (!base) return <span className="text-sm text-clinical-danger font-semibold">Vitals due now</span>;

  const nextDue = new Date(base).getTime() + 15 * 60 * 1000;
  const remaining = nextDue - now;
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const overdue = remaining < 0;
  const urgent = remaining >= 0 && remaining <= 5 * 60 * 1000;

  return (
    <Badge
      variant={overdue ? "danger" : urgent ? "warning" : "success"}
      className={`gap-1 font-mono text-xs ${overdue ? "animate-pulse" : ""}`}
    >
      <Activity className="h-3 w-3" />
      {overdue ? `Overdue ${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:${secs.toString().padStart(2, "0")}`}
    </Badge>
  );
}

/* ── Elapsed timer ── */
function ElapsedTimer({ startedAt }: { startedAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!startedAt) return null;
  const elapsed = now - new Date(startedAt).getTime();
  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  return (
    <span className="text-2xl font-mono font-bold text-foreground tabular-nums tracking-tight">
      {h > 0 ? `${h}:` : ""}{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

/* ── Status config ── */
const statusConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "neutral"; borderClass: string; bgClass: string }> = {
  pre_assessment: { label: "Pre-Assessment", variant: "info", borderClass: "state-border-info", bgClass: "bg-clinical-info-soft" },
  in_progress: { label: "Running", variant: "success", borderClass: "state-border-success", bgClass: "bg-clinical-success-soft" },
  post_assessment: { label: "Observing", variant: "warning", borderClass: "state-border-warning", bgClass: "bg-clinical-warning-soft" },
};

/* ── Chair Tile ── */
function ChairTile({ chair }: { chair: ChairData }) {
  const navigate = useNavigate();
  const occ = chair.occupant;
  const cfg = occ ? statusConfig[occ.status] || { label: occ.status, variant: "neutral" as const, borderClass: "state-border-neutral", bgClass: "" } : null;

  // Approximate progress (assume 2hr default session)
  const getProgress = () => {
    if (!occ?.startedAt) return 0;
    const elapsed = Date.now() - new Date(occ.startedAt).getTime();
    const expectedMs = 2 * 60 * 60 * 1000;
    return Math.min(100, Math.round((elapsed / expectedMs) * 100));
  };

  if (!occ) {
    return (
      <Card className="flex flex-col justify-center items-center p-6 min-h-[240px] bg-clinical-neutral-soft border-border">
        <Armchair className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <span className="text-sm font-medium text-muted-foreground">{chair.name}</span>
        <span className="text-xs text-muted-foreground/60 mt-1">Available</span>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col justify-between p-0 min-h-[280px] ${cfg?.borderClass || ""} ${cfg?.bgClass || ""} overflow-hidden`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Armchair className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">{chair.name}</span>
        </div>
        <Badge variant={cfg?.variant || "neutral"}>{cfg?.label || occ.status}</Badge>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 space-y-3">
        <p className="text-lg font-semibold text-foreground truncate">{occ.patientName}</p>
        <p className="text-sm text-muted-foreground">{occ.treatmentType}</p>

        {/* Elapsed time */}
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <ElapsedTimer startedAt={occ.startedAt} />
        </div>

        {/* Vitals status */}
        <VitalsCountdown startedAt={occ.startedAt} lastVitalsAt={occ.lastVitalsAt} />

        {/* Progress bar */}
        <Progress value={getProgress()} className="h-2" />
      </div>

      {/* Action */}
      <div className="px-5 pb-5 pt-3">
        <Button
          className="w-full h-14 text-base font-medium"
          onClick={() => navigate(`/nurse/job-card/${occ.appointmentId}`)}
        >
          Open Session
        </Button>
      </div>
    </Card>
  );
}

/* ── Unassigned row ── */
function UnassignedRow({
  treatment,
  availableChairs,
  onAssign,
}: {
  treatment: UnassignedTreatment;
  availableChairs: ChairData[];
  onAssign: (appointmentId: string, chairId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{treatment.patientName}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{treatment.treatmentType}</p>
      </div>
      <Select onValueChange={(chairId) => onAssign(treatment.appointmentId, chairId)}>
        <SelectTrigger className="w-[160px] min-h-[44px]">
          <SelectValue placeholder="Assign chair…" />
        </SelectTrigger>
        <SelectContent>
          {availableChairs.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ── Main Page ── */
export default function NurseCommandCentre() {
  const { chairs, unassigned, isLoading, assignChair } = useCommandCentre();
  const availableChairs = chairs.filter((c) => !c.occupant);
  const activeCount = chairs.filter((c) => c.occupant).length;
  const chairsInUse = `${activeCount}/${chairs.length}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading command centre…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Clinical Operations</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time treatment monitoring</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-clinical-success-soft flex items-center justify-center">
            <Droplets className="h-5 w-5 text-clinical-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-xs text-muted-foreground">Active Infusions</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-clinical-info-soft flex items-center justify-center">
            <Armchair className="h-5 w-5 text-clinical-info" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{chairsInUse}</p>
            <p className="text-xs text-muted-foreground">Chairs in Use</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-clinical-warning-soft flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-clinical-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{unassigned.length}</p>
            <p className="text-xs text-muted-foreground">Unassigned</p>
          </div>
        </Card>
      </div>

      {/* Chair Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chairs.map((chair) => (
          <ChairTile key={chair.id} chair={chair} />
        ))}
      </div>

      {/* Unassigned Treatments */}
      {unassigned.length > 0 && (
        <Card className="state-border-warning p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-clinical-warning" />
            <h2 className="text-lg font-semibold text-foreground">Unassigned Treatments</h2>
            <Badge variant="warning">{unassigned.length}</Badge>
          </div>
          {unassigned.map((t) => (
            <UnassignedRow
              key={t.treatmentId}
              treatment={t}
              availableChairs={availableChairs}
              onAssign={(apptId, chairId) => assignChair.mutate({ appointmentId: apptId, chairId })}
            />
          ))}
        </Card>
      )}
    </div>
  );
}
