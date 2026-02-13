import { useNavigate } from "react-router-dom";
import { ChairData } from "@/hooks/useCommandCentre";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Armchair, Clock, Activity } from "lucide-react";
import { ElapsedTimer } from "./ElapsedTimer";
import { VitalsCountdown } from "./VitalsCountdown";

const EXPECTED_DURATION_MS = 2 * 60 * 60 * 1000;

type ChairState = "running" | "pre" | "due" | "available";

const stateUI: Record<ChairState, { label: string; badge: string; tint: string; accent: string; progressFill: string }> = {
  running: {
    label: "Running",
    badge: "bg-clinical-success-soft text-clinical-success border border-clinical-success/20",
    tint: "bg-gradient-to-b from-clinical-success-soft/70 to-card/80",
    accent: "before:bg-clinical-success",
    progressFill: "bg-clinical-success",
  },
  pre: {
    label: "Pre-Assessment",
    badge: "bg-clinical-info-soft text-clinical-info border border-clinical-info/20",
    tint: "bg-gradient-to-b from-clinical-info-soft/70 to-card/80",
    accent: "before:bg-clinical-info",
    progressFill: "bg-clinical-info",
  },
  due: {
    label: "Observing",
    badge: "bg-clinical-warning-soft text-clinical-warning border border-clinical-warning/20",
    tint: "bg-gradient-to-b from-clinical-warning-soft/70 to-card/80",
    accent: "before:bg-clinical-warning",
    progressFill: "bg-clinical-warning",
  },
  available: {
    label: "Available",
    badge: "bg-muted/60 text-muted-foreground border border-border/70",
    tint: "bg-card/70",
    accent: "before:bg-muted-foreground/30",
    progressFill: "bg-muted",
  },
};

function mapStatus(status: string): ChairState {
  switch (status) {
    case "in_progress": return "running";
    case "pre_assessment": return "pre";
    case "post_assessment": return "due";
    default: return "running";
  }
}

export function ChairPanel({ chair }: { chair: ChairData }) {
  const navigate = useNavigate();
  const occ = chair.occupant;
  const state: ChairState = occ ? mapStatus(occ.status) : "available";
  const ui = stateUI[state];

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
      <div className={`relative overflow-hidden rounded-xl border border-border/50 shadow-clinical-sm ${ui.tint} before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl ${ui.accent} flex flex-col justify-center items-center p-6`}>
        <Armchair className="h-8 w-8 text-muted-foreground/20 mb-2" />
        <span className="text-sm font-medium text-muted-foreground">{chair.name}</span>
        <span className="text-xs text-muted-foreground/60 mt-0.5">Available</span>
      </div>
    );
  }

  const remainingLabel = getRemainingLabel();

  // Occupied chair
  return (
    <div className={`relative overflow-hidden rounded-xl border border-border/40 shadow-clinical-md ${ui.tint} before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-xl ${ui.accent} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1.5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Armchair className="h-4 w-4" />
          <span className="text-sm">{chair.name}</span>
        </div>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ui.badge}`}>
          {ui.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 space-y-3">
        <div>
          <p className="text-lg font-semibold text-foreground truncate">{occ.patientName}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{occ.treatmentType}</p>
        </div>

        {/* Elapsed + remaining */}
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground/60" />
            <ElapsedTimer startedAt={occ.startedAt} />
          </div>
          <div className="text-right text-xs text-muted-foreground space-y-0.5">
            <p>Expected 2h</p>
            {remainingLabel && (
              <p className={`font-medium ${remainingLabel.startsWith("Overdue") ? "text-clinical-danger" : ""}`}>
                {remainingLabel}
              </p>
            )}
          </div>
        </div>

        {/* Custom progress bar */}
        <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ui.progressFill}`}
            style={{ width: `${getProgress()}%` }}
          />
        </div>

        {/* Vitals strip */}
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="text-xs text-muted-foreground">Vitals</span>
          <VitalsCountdown startedAt={occ.startedAt} lastVitalsAt={occ.lastVitalsAt} />
        </div>
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
    </div>
  );
}
