import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChecklistItem } from "@/hooks/useOnboardingChecklist";

interface Props {
  checklist: ChecklistItem[];
  onOpenForm: (item: ChecklistItem) => void;
}

export default function OnboardingProgress({ checklist, onOpenForm }: Props) {
  const pending = checklist.filter(c => c.status === "pending" || c.status === "in_progress");
  const completed = checklist.filter(c => c.status === "completed");
  const total = checklist.length;
  const percent = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Onboarding Progress</span>
            <span className="text-sm text-muted-foreground">
              {completed.length} of {total} forms complete
            </span>
          </div>
          <Progress value={percent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {percent === 100
              ? "All forms complete — you're ready for your appointment!"
              : `Complete the remaining ${pending.length} form${pending.length !== 1 ? "s" : ""} before your appointment.`}
          </p>
        </CardContent>
      </Card>

      {/* Pending Forms */}
      {pending.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5" />
              Outstanding Forms ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map((item) => (
              <button
                key={item.id}
                onClick={() => onOpenForm(item)}
                className="w-full flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{item.form_templates?.name}</span>
                    {item.form_templates?.description && (
                      <span className="text-xs text-muted-foreground">{item.form_templates.description}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {item.form_templates?.category?.replace("_", " ")}
                </Badge>
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Click on a form to fill it in. You can also complete these at the clinic.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed Forms */}
      {completed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed Forms ({completed.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {completed.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <span>{item.form_templates?.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
