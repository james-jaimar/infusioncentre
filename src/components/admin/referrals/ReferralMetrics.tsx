import { Card, CardContent } from "@/components/ui/card";
import { Clock, AlertTriangle, CheckCircle, ArrowRight, ListTodo } from "lucide-react";
import { getReferralAttention } from "@/lib/referralProgress";

interface Props {
  referrals: any[];
}

export function ReferralMetrics({ referrals }: Props) {
  const pending = referrals.filter((r) => r.status === "pending").length;
  const urgent = referrals.filter((r) => r.urgency === "urgent" && r.status === "pending").length;
  const accepted = referrals.filter((r) => r.status === "accepted").length;
  const incomplete = referrals.filter(
    (r) =>
      getReferralAttention(r, (r as any).course_count || 0, {
        appointmentCount: (r as any).appointment_count || 0,
        totalSessionsPlanned: (r as any).total_sessions_planned || 0,
      }) !== "complete"
  ).length;

  // Average time to triage (pending → any non-pending) in hours
  const triaged = referrals.filter((r) => r.reviewed_at && r.status !== "pending");
  const avgTriageHours =
    triaged.length > 0
      ? triaged.reduce((sum: number, r: any) => {
          const created = new Date(r.created_at).getTime();
          const reviewed = new Date(r.reviewed_at).getTime();
          return sum + (reviewed - created) / (1000 * 60 * 60);
        }, 0) / triaged.length
      : null;

  const conversionRate =
    referrals.length > 0
      ? Math.round(
          (referrals.filter((r) => r.status === "accepted" || r.status === "converted_to_course").length /
            referrals.length) *
            100
        )
      : 0;

  const metrics = [
    {
      label: "Pending Triage",
      value: pending,
      icon: Clock,
      className: "text-clinical-warning",
    },
    {
      label: "Urgent Pending",
      value: urgent,
      icon: AlertTriangle,
      className: "text-clinical-danger",
    },
    {
      label: "Incomplete Workflow",
      value: incomplete,
      icon: ListTodo,
      className: "text-clinical-warning",
    },
    {
      label: "Accepted",
      value: accepted,
      icon: CheckCircle,
      className: "text-clinical-success",
    },
    {
      label: "Avg Triage Time",
      value: avgTriageHours !== null ? `${avgTriageHours.toFixed(1)}h` : "—",
      icon: ArrowRight,
      className: "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((m) => (
        <Card key={m.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <m.icon className={`h-8 w-8 ${m.className}`} />
            <div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
