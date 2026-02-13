import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface JobCardActionsProps {
  treatmentId: string | null;
  treatmentStatus: string;
  appointmentId: string;
  appointmentStatus: string;
  onCheckIn: () => void;
  onStartTreatment: () => void;
  onEndTreatment: () => void;
  onRecordVitals: () => void;
  onAddMedication: () => void;
  isSubmitting?: boolean;
  checklistComplete?: boolean;
  hasPreVitals?: boolean;
}

export default function JobCardActions({
  treatmentStatus,
  appointmentStatus,
  onCheckIn,
  onStartTreatment,
  onEndTreatment,
  isSubmitting,
  checklistComplete,
  hasPreVitals,
}: JobCardActionsProps) {
  const navigate = useNavigate();

  const showCheckIn = appointmentStatus === "scheduled" || appointmentStatus === "confirmed";
  const showStartTreatment = appointmentStatus === "checked_in" && !treatmentStatus;
  const showEndTreatment = treatmentStatus === "in_progress";
  const isCompleted = treatmentStatus === "completed" || treatmentStatus === "cancelled";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85 px-4 py-3 lg:left-64 shadow-clinical-lg">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        {showCheckIn && (
          <Button onClick={onCheckIn} disabled={isSubmitting} size="lg" className="flex-1 h-14 text-base">
            <CheckCircle className="mr-2 h-5 w-5" /> Check In Patient
          </Button>
        )}

        {showStartTreatment && (
          <Button
            onClick={onStartTreatment}
            disabled={isSubmitting || !checklistComplete || !hasPreVitals}
            size="lg"
            className="flex-1 h-14 text-base"
          >
            <Clock className="mr-2 h-5 w-5" /> Start Treatment
          </Button>
        )}

        {showEndTreatment && (
          <Button variant="destructive" onClick={onEndTreatment} size="lg" className="flex-1 h-14 text-base">
            <CheckCircle className="mr-2 h-5 w-5" /> End Treatment & Discharge
          </Button>
        )}

        {isCompleted && (
          <div className="flex-1 text-center text-muted-foreground text-sm font-medium py-4">
            Treatment completed
          </div>
        )}

        {/* Emergency always visible */}
        <Button
          variant="destructive"
          size="lg"
          className="h-14 min-w-[48px] shrink-0"
          onClick={() => navigate("/nurse/emergency")}
        >
          <AlertTriangle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
