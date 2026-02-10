import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTreatmentHistory } from "@/hooks/useTreatmentHistory";
import { format, differenceInMinutes } from "date-fns";
import { ChevronDown, History, Pill, Activity } from "lucide-react";
import { useState } from "react";

interface TreatmentHistoryProps {
  patientId: string;
}

export default function TreatmentHistory({ patientId }: TreatmentHistoryProps) {
  const { data: history, isLoading } = useTreatmentHistory(patientId);
  const [open, setOpen] = useState(false);

  if (isLoading) return null;
  if (!history?.length) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="h-4 w-4" /> Previous Visits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">First visit — no previous treatments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" /> Previous Visits ({history.length})
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {history.map((item) => {
              const duration =
                item.started_at && item.ended_at
                  ? differenceInMinutes(new Date(item.ended_at), new Date(item.started_at))
                  : null;

              return (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 text-sm">
                  <div>
                    <p className="font-medium">
                      {format(new Date(item.created_at), "dd MMM yyyy")}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant="outline"
                        className="text-xs h-5"
                        style={{ borderColor: item.appointment_type_color }}
                      >
                        {item.appointment_type_name}
                      </Badge>
                      {duration !== null && <span>{duration} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Pill className="h-3 w-3" /> {item.medications_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" /> {item.vitals_count}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
