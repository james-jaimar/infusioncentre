import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Bell, CheckCircle2, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useClinicalAlerts,
  useAcknowledgeAlert,
  useResolveAlert,
  useTreatmentProtocol,
  useVitalsThresholds,
  evaluateVitalsAlerts,
  useCreateClinicalAlert,
} from "@/hooks/useTreatmentProtocols";
import { useTreatmentVitals } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import type { ClinicalAlert, VitalsAlert } from "@/types/protocol";

interface ClinicalAlertsProps {
  treatmentId: string;
  treatmentTypeId?: string;
  treatmentStartedAt?: string | null;
}

export default function ClinicalAlerts({ treatmentId, treatmentTypeId, treatmentStartedAt }: ClinicalAlertsProps) {
  const { user } = useAuth();
  const { data: alerts = [] } = useClinicalAlerts(treatmentId);
  const { data: protocol } = useTreatmentProtocol(treatmentTypeId);
  const { data: thresholds } = useVitalsThresholds(protocol?.id);
  const { data: vitals = [] } = useTreatmentVitals(treatmentId);
  const acknowledge = useAcknowledgeAlert();
  const resolve = useResolveAlert();
  const createAlert = useCreateClinicalAlert();

  const activeAlerts = alerts.filter((a) => a.status === "active" || a.status === "acknowledged");
  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;

  // Check for abnormal vitals on each new reading
  const [lastCheckedVitalsId, setLastCheckedVitalsId] = useState<string | null>(null);
  
  useEffect(() => {
    if (!latestVitals || !thresholds || latestVitals.id === lastCheckedVitalsId) return;
    setLastCheckedVitalsId(latestVitals.id);

    const vitalsAlerts = evaluateVitalsAlerts(latestVitals, thresholds);
    for (const va of vitalsAlerts) {
      // Only create if not already an active alert for this field
      const existing = activeAlerts.find(
        (a) => a.alert_type === "abnormal_reading" && (a.details as any)?.field === va.field && a.status === "active"
      );
      if (!existing) {
        createAlert.mutate({
          treatment_id: treatmentId,
          alert_type: "abnormal_reading",
          severity: va.severity,
          status: "active",
          message: va.message,
          details: { field: va.field, value: va.value, threshold: va.threshold },
        });
      }
    }
  }, [latestVitals?.id, thresholds]);

  // Check for overdue vitals
  const [vitalsOverdueAlerted, setVitalsOverdueAlerted] = useState(false);
  
  useEffect(() => {
    if (!protocol || !treatmentStartedAt || vitalsOverdueAlerted) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const started = new Date(treatmentStartedAt).getTime();
      const elapsedMins = (now - started) / 60000;
      
      // Determine expected interval
      const intervalMins = elapsedMins <= protocol.vitals_initial_period_mins
        ? protocol.vitals_interval_initial_mins
        : protocol.vitals_interval_standard_mins;
      
      // Check last vitals time
      const lastVitalsTime = latestVitals
        ? new Date(latestVitals.recorded_at).getTime()
        : started;
      const sinceLastVitals = (now - lastVitalsTime) / 60000;
      
      if (sinceLastVitals > intervalMins + 2) { // 2 min grace period
        const existing = activeAlerts.find(a => a.alert_type === "vitals_overdue" && a.status === "active");
        if (!existing) {
          createAlert.mutate({
            treatment_id: treatmentId,
            alert_type: "vitals_overdue",
            severity: sinceLastVitals > intervalMins * 2 ? "critical" : "warning",
            status: "active",
            message: `Vitals overdue by ${Math.floor(sinceLastVitals - intervalMins)} min (interval: ${intervalMins} min)`,
            details: { overdue_mins: Math.floor(sinceLastVitals - intervalMins), interval_mins: intervalMins },
          });
          setVitalsOverdueAlerted(true);
        }
      }
    }, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, [protocol, treatmentStartedAt, latestVitals, vitalsOverdueAlerted]);

  // Reset overdue flag when new vitals come in
  useEffect(() => {
    if (vitalsOverdueAlerted && latestVitals) {
      setVitalsOverdueAlerted(false);
    }
  }, [latestVitals?.id]);

  if (activeAlerts.length === 0) return null;

  return (
    <Card className="border-clinical-danger/30 bg-clinical-danger-soft/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-clinical-danger" />
          Clinical Alerts
          <Badge variant="destructive">{activeAlerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              "flex items-start gap-3 rounded-lg p-3 min-h-[48px]",
              alert.severity === "critical" ? "bg-clinical-danger/10 border border-clinical-danger/30" :
              alert.severity === "warning" ? "bg-clinical-warning-soft border border-clinical-warning/30" :
              "bg-muted border border-border"
            )}
          >
            <AlertTriangle className={cn(
              "h-5 w-5 mt-0.5 shrink-0",
              alert.severity === "critical" ? "text-clinical-danger" : "text-clinical-warning"
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(alert.triggered_at).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                {alert.status === "acknowledged" && " • Acknowledged"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              {alert.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0"
                  onClick={() => user?.id && acknowledge.mutate({ alertId: alert.id, userId: user.id })}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={() => user?.id && resolve.mutate({ alertId: alert.id, userId: user.id })}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
