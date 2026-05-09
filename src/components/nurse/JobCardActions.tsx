import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { StageKey } from "./JobCardStepper";

interface JobCardActionsProps {
  stage: StageKey;
  primaryLabel?: string;
  primaryDisabled?: boolean;
  onPrimary?: () => void;
  isSubmitting?: boolean;
  hint?: string;
}

export default function JobCardActions({
  stage,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  isSubmitting,
  hint,
}: JobCardActionsProps) {
  const navigate = useNavigate();
  const isDischarged = stage === "discharged";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur-sm supports-[backdrop-filter]:bg-card/85 px-4 py-3 lg:left-64 shadow-clinical-lg">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        {!isDischarged && primaryLabel && onPrimary && (
          <div className="flex-1 flex flex-col gap-1">
            {hint && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <AlertTriangle className="h-3.5 w-3.5" /> {hint}
              </div>
            )}
            <Button
              onClick={onPrimary}
              disabled={primaryDisabled || isSubmitting}
              size="lg"
              className="w-full h-14 text-base"
            >
              {primaryLabel}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {isDischarged && (
          <div className="flex-1 text-center text-muted-foreground text-sm font-medium py-4">
            Treatment completed and discharged
          </div>
        )}

        <Button
          variant="destructive"
          size="lg"
          className="h-14 min-w-[48px] shrink-0"
          onClick={() => navigate("/nurse/emergency")}
          title="Emergency"
        >
          <AlertTriangle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
