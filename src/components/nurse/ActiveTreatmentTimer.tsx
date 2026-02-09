import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, ArrowRight } from "lucide-react";

interface ActiveTreatment {
  id: string;
  appointment_id: string;
  started_at: string | null;
  patient: { first_name: string; last_name: string };
  appointment_type: { name: string; color: string };
  chair?: { name: string } | null;
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startedAt).getTime();
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        hrs > 0
          ? `${hrs}h ${mins.toString().padStart(2, "0")}m`
          : `${mins}m ${secs.toString().padStart(2, "0")}s`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="text-2xl font-mono font-bold text-primary tabular-nums">
      {elapsed}
    </span>
  );
}

export default function ActiveTreatmentTimer({
  treatments,
}: {
  treatments: ActiveTreatment[];
}) {
  const navigate = useNavigate();

  if (!treatments.length) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
          Active Treatments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {treatments.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-4 rounded-lg border bg-background p-4"
          >
            <div className="space-y-1">
              <p className="font-semibold">
                {t.patient.first_name} {t.patient.last_name}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {t.appointment_type.name}
                </Badge>
                {t.chair && (
                  <span className="text-xs">{t.chair.name}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {t.started_at && <ElapsedTimer startedAt={t.started_at} />}
              <Button
                size="sm"
                onClick={() => navigate(`/nurse/treatment/${t.id}`)}
              >
                View
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
