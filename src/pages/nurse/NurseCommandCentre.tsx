import { useNavigate } from "react-router-dom";
import { useCommandCentre, ChairData, UnassignedTreatment } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Armchair, Clock, Activity, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

/* ── Vitals countdown logic ── */
function getVitalsDue(startedAt: string | null, lastVitalsAt: string | null) {
  const base = lastVitalsAt || startedAt;
  if (!base) return { label: "No data", color: "destructive" as const, ms: 0 };
  const nextDue = new Date(base).getTime() + 15 * 60 * 1000;
  const remaining = nextDue - Date.now();
  return { ms: remaining, nextDue };
}

function VitalsCountdown({ startedAt, lastVitalsAt }: { startedAt: string | null; lastVitalsAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const base = lastVitalsAt || startedAt;
  if (!base) return <span className="text-sm text-destructive font-semibold">Vitals due now</span>;

  const nextDue = new Date(base).getTime() + 15 * 60 * 1000;
  const remaining = nextDue - now;
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const overdue = remaining < 0;
  const urgent = remaining >= 0 && remaining <= 5 * 60 * 1000;

  const colorClass = overdue
    ? "text-destructive animate-pulse font-bold"
    : urgent
    ? "text-amber-600 font-semibold"
    : "text-emerald-600 font-medium";

  return (
    <div className={`flex items-center gap-1.5 text-sm ${colorClass}`}>
      <Activity className="h-4 w-4" />
      {overdue ? `Overdue ${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:${secs.toString().padStart(2, "0")}`}
    </div>
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
    <span className="text-xs text-muted-foreground tabular-nums">
      {h > 0 ? `${h}h ` : ""}{m}m {s.toString().padStart(2, "0")}s
    </span>
  );
}

/* ── Status badge mapping ── */
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pre_assessment: { label: "Pre-Assessment", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  post_assessment: { label: "Observing", variant: "outline" },
};

/* ── Chair Tile ── */
function ChairTile({ chair }: { chair: ChairData }) {
  const navigate = useNavigate();
  const occ = chair.occupant;

  const borderColor = occ
    ? occ.status === "in_progress"
      ? "border-emerald-500"
      : occ.status === "pre_assessment"
      ? "border-primary"
      : "border-amber-500"
    : "border-border";

  return (
    <Card
      className={`flex flex-col justify-between p-5 min-h-[220px] border-2 ${borderColor} transition-colors`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Armchair className="h-5 w-5 text-muted-foreground" />
          <span className="font-semibold text-lg">{chair.name}</span>
        </div>
        {occ && (
          <Badge variant={statusConfig[occ.status]?.variant ?? "outline"}>
            {statusConfig[occ.status]?.label ?? occ.status}
          </Badge>
        )}
      </div>

      {occ ? (
        <>
          {/* Patient + type */}
          <div className="flex-1 space-y-2">
            <p className="text-base font-semibold truncate">{occ.patientName}</p>
            <Badge
              variant="outline"
              className="text-xs"
              style={{ borderColor: occ.treatmentTypeColor, color: occ.treatmentTypeColor }}
            >
              {occ.treatmentType}
            </Badge>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <ElapsedTimer startedAt={occ.startedAt} />
              </div>
            </div>
            <VitalsCountdown startedAt={occ.startedAt} lastVitalsAt={occ.lastVitalsAt} />
          </div>

          <Button
            className="mt-4 w-full min-h-[44px]"
            onClick={() => navigate(`/nurse/job-card/${occ.appointmentId}`)}
          >
            Open Session
          </Button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <Armchair className="h-10 w-10 mb-2 opacity-30" />
          <span className="text-sm">Available</span>
        </div>
      )}
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
    <div className="flex items-center justify-between gap-4 py-3 border-b last:border-b-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{treatment.patientName}</p>
        <p className="text-xs text-muted-foreground">{treatment.treatmentType}</p>
      </div>
      <Select onValueChange={(chairId) => onAssign(treatment.appointmentId, chairId)}>
        <SelectTrigger className="w-[160px] min-h-[44px]">
          <SelectValue placeholder="Assign chair…" />
        </SelectTrigger>
        <SelectContent>
          {availableChairs.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-muted-foreground">Loading command centre…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Command Centre</h1>

      {/* 2x2 Chair Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chairs.map((chair) => (
          <ChairTile key={chair.id} chair={chair} />
        ))}
      </div>

      {/* Unassigned Treatments */}
      {unassigned.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-lg">Unassigned Treatments</h2>
            <Badge variant="secondary">{unassigned.length}</Badge>
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
