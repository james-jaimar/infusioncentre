import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  patientId: string;
  compact?: boolean;
}

export default function PatientReadinessBadge({ patientId, compact = false }: Props) {
  const { data: checklist, isLoading } = useOnboardingChecklist(patientId);

  if (isLoading || !checklist?.length) return null;

  const total = checklist.length;
  const completed = checklist.filter(c => c.status === "completed").length;
  const percent = Math.round((completed / total) * 100);
  const isReady = completed === total;

  const icon = isReady ? (
    <CheckCircle2 className="h-3.5 w-3.5" />
  ) : percent > 0 ? (
    <Clock className="h-3.5 w-3.5" />
  ) : (
    <AlertCircle className="h-3.5 w-3.5" />
  );

  const variant = isReady ? "default" : "secondary";
  const className = isReady
    ? "bg-green-100 text-green-800 hover:bg-green-100"
    : percent > 0
    ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
    : "bg-red-100 text-red-800 hover:bg-red-100";

  const label = compact
    ? `${percent}%`
    : isReady
    ? "Ready"
    : `${completed}/${total} forms`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variant} className={`gap-1 ${className}`}>
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{completed} of {total} onboarding forms completed ({percent}%)</p>
          {!isReady && (
            <p className="text-xs text-muted-foreground mt-1">
              {total - completed} form{total - completed !== 1 ? "s" : ""} still outstanding
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
