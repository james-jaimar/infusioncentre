import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Activity, Timer } from "lucide-react";
import { useTreatmentProtocol } from "@/hooks/useTreatmentProtocols";
import { useTreatmentVitals } from "@/hooks/useTreatments";
import { useState, useEffect } from "react";

interface ProtocolMonitoringBannerProps {
  treatmentTypeId: string;
  treatmentId?: string;
  treatmentStartedAt: string | null;
}

export default function ProtocolMonitoringBanner({
  treatmentTypeId,
  treatmentId,
  treatmentStartedAt,
}: ProtocolMonitoringBannerProps) {
  const { data: protocol } = useTreatmentProtocol(treatmentTypeId);
  const { data: vitals = [] } = useTreatmentVitals(treatmentId);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  if (!protocol || !treatmentStartedAt) return null;

  const startMs = new Date(treatmentStartedAt).getTime();
  const elapsedMins = (now - startMs) / 60000;

  // Determine current vitals interval
  const currentInterval = elapsedMins <= protocol.vitals_initial_period_mins
    ? protocol.vitals_interval_initial_mins
    : protocol.vitals_interval_standard_mins;

  // Next vitals due
  const duringVitals = vitals.filter((v) => v.phase === "during" || v.phase === "post");
  const lastVitalsTime = duringVitals.length > 0
    ? new Date(duringVitals[duringVitals.length - 1].recorded_at).getTime()
    : startMs;
  const sinceLastMins = (now - lastVitalsTime) / 60000;
  const nextDueInMins = Math.max(0, currentInterval - sinceLastMins);
  const isOverdue = sinceLastMins > currentInterval;

  // Vitals count
  const vitalsRecorded = duringVitals.length;
  const vitalsRequired = protocol.min_vitals_during;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">{protocol.name}</span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            {/* Vitals interval */}
            <div className="flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Every {currentInterval}m</span>
            </div>

            {/* Next vitals countdown */}
            <div className="flex items-center gap-1.5">
              <Clock className={`h-3.5 w-3.5 ${isOverdue ? "text-clinical-danger" : nextDueInMins < 5 ? "text-clinical-warning" : "text-clinical-success"}`} />
              <Badge
                variant={isOverdue ? "destructive" : nextDueInMins < 5 ? "warning" : "outline"}
                className="text-xs"
              >
                {isOverdue
                  ? `Overdue ${Math.floor(sinceLastMins - currentInterval)}m`
                  : `Next in ${Math.ceil(nextDueInMins)}m`}
              </Badge>
            </div>

            {/* Progress */}
            <Badge variant="outline" className="text-xs">
              {vitalsRecorded}/{vitalsRequired} vitals
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
