import { CheckCircle, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "pending", label: "Check-In" },
  { key: "pre_assessment", label: "Pre-Assessment" },
  { key: "in_progress", label: "In Progress" },
  { key: "post_assessment", label: "Post-Assessment" },
  { key: "completed", label: "Discharged" },
] as const;

interface JobCardStepperProps {
  currentStatus: string;
  onAdvance?: (nextStatus: string) => void;
}

export default function JobCardStepper({ currentStatus }: JobCardStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto py-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[48px] transition-all",
                isDone && "bg-clinical-success-soft text-clinical-success",
                isCurrent && "bg-primary text-primary-foreground shadow-clinical-sm",
                !isDone && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isDone ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4 shrink-0",
                  i < currentIndex ? "bg-clinical-success" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
