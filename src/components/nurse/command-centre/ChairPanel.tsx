import { useNavigate } from "react-router-dom";
import { ChairData } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Armchair, Clock } from "lucide-react";
import { ElapsedTimer } from "./ElapsedTimer";
import { VitalsCountdown } from "./VitalsCountdown";

const EXPECTED_DURATION_MS = 2 * 60 * 60 * 1000;

const statusConfig: Record<string, { label: string; variant: "success" | "info" | "warning" | "neutral"; borderClass: string; bgClass: string }> = {
  pre_assessment: { label: "Pre-Assessment", variant: "info", borderClass: "border-l-4 border-l-clinical-info", bgClass: "" },
  in_progress: { label: "Running", variant: "success", borderClass: "border-l-4 border-l-clinical-success", bgClass: "" },
  post_assessment: { label: "Observing", variant: "warning", borderClass: "border-l-4 border-l-clinical-warning", bgClass: "bg-clinical-warning-soft/30" },
};

export function ChairPanel({ chair }: { chair: ChairData }) {
  const navigate = useNavigate();
  const occ = chair.occupant;
  const cfg = occ ? statusConfig[occ.status] || { label: occ.status, variant: "neutral" as const, borderClass: "", bgClass: "" } : null;

  const getProgress = () => {
    if (!occ?.startedAt) return 0;
    const elapsed = Date.now() - new Date(occ.startedAt).getTime();
    return Math.min(100, Math.round((elapsed / EXPECTED_DURATION_MS) * 100));
  };

  const getRemainingLabel = () => {
    if (!occ?.startedAt) return null;
    const elapsed = Date.now() - new Date(occ.startedAt).getTime();
    const remaining = EXPECTED_DURATION_MS - elapsed;
    const absMs = Math.abs(remaining);
    const h = Math.floor(absMs / 3600000);
    const m = Math.floor((absMs % 3600000) / 60000);
    if (remaining < 0) return `Overdue ${h > 0 ? `${h}h ` : ""}${m}m`;
    return `Remaining ${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}m`;
  };

  // Available chair
  if (!occ) {
    return (
      <Card className="flex flex-col justify-center items-center p-6 bg-muted/30 border-border/50">
        <Armchair className="h-8 w-8 text-muted-foreground/20 mb-2" />
        <span className="text-sm font-medium text-muted-foreground">{chair.name}</span>
        <span className="text-xs text-muted-foreground/60 mt-0.5">Available</span>
      </Card>
    );
  }

  // Occupied chair
  return (
    <Card className={`flex flex-col justify-between p-0 overflow-hidden ${cfg?.borderClass || ""} ${cfg?.bgClass || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1.5">
        <div className="flex items-center gap-2">
          <Armchair className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-sm text-muted-foreground">{chair.name}</span>
        </div>
        <Badge variant={cfg?.variant || "neutral"}>{cfg?.label || occ.status}</Badge>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 space-y-3">
        <div>
          <p className="text-lg font-semibold text-foreground truncate">{occ.patientName}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{occ.treatmentType}</p>
        </div>

        {/* Elapsed time + remaining */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground/60" />
            <ElapsedTimer startedAt={occ.startedAt} />
          </div>
          {getRemainingLabel() && (
            <span className={`text-xs font-medium ${getRemainingLabel()?.startsWith("Overdue") ? "text-clinical-danger" : "text-muted-foreground"}`}>
              {getRemainingLabel()}
            </span>
          )}
        </div>

        {/* Vitals strip */}
        <VitalsCountdown startedAt={occ.startedAt} lastVitalsAt={occ.lastVitalsAt} />

        {/* Progress */}
        <Progress value={getProgress()} className="h-2.5" />
      </div>

      {/* Action */}
      <div className="px-4 pb-4 pt-3">
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
