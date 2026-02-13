import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export function VitalsCountdown({ startedAt, lastVitalsAt }: { startedAt: string | null; lastVitalsAt: string | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const base = lastVitalsAt || startedAt;
  if (!base) return <span className="text-sm text-clinical-danger font-semibold">Vitals due now</span>;

  const nextDue = new Date(base).getTime() + 15 * 60 * 1000;
  const remaining = nextDue - now;
  const mins = Math.floor(Math.abs(remaining) / 60000);
  const secs = Math.floor((Math.abs(remaining) % 60000) / 1000);
  const overdue = remaining < 0;
  const urgent = remaining >= 0 && remaining <= 5 * 60 * 1000;

  return (
    <Badge
      variant={overdue ? "danger" : urgent ? "warning" : "success"}
      className={`gap-1 font-mono text-xs ${overdue ? "animate-pulse" : ""}`}
    >
      <Activity className="h-3 w-3" />
      {overdue ? `Overdue ${mins}:${secs.toString().padStart(2, "0")}` : `${mins}:${secs.toString().padStart(2, "0")}`}
    </Badge>
  );
}
