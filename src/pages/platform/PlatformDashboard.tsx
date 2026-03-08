import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, Activity, DollarSign, FileText, TrendingUp, Layers } from "lucide-react";
import { usePlatformMetrics, usePlatformTenantStats } from "@/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";

export default function PlatformDashboard() {
  const { data: metrics, isLoading: metricsLoading } = usePlatformMetrics();
  const { data: tenants = [], isLoading: tenantsLoading } = usePlatformTenantStats();

  const metricCards = [
    { label: "Total Tenants", value: metrics?.total_tenants ?? 0, icon: Building2, color: "text-blue-500" },
    { label: "Active Tenants", value: metrics?.active_tenants ?? 0, icon: Activity, color: "text-emerald-500" },
    { label: "Total Patients", value: metrics?.total_patients ?? 0, icon: Users, color: "text-violet-500" },
    { label: "Total Users", value: metrics?.total_users ?? 0, icon: Users, color: "text-amber-500" },
    { label: "Appointments (Month)", value: metrics?.total_appointments_this_month ?? 0, icon: Calendar, color: "text-cyan-500" },
    { label: "Active Courses", value: metrics?.total_active_courses ?? 0, icon: Layers, color: "text-pink-500" },
    { label: "Invoices (Month)", value: metrics?.total_invoices_this_month ?? 0, icon: FileText, color: "text-orange-500" },
    { label: "Revenue (Month)", value: `R ${(metrics?.total_revenue_this_month ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-600" },
  ];

  const PLAN_COLORS: Record<string, string> = {
    free: "secondary",
    starter: "outline",
    professional: "default",
    enterprise: "destructive",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">Cross-tenant metrics and system health</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              {metricsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                    <p className="text-2xl font-bold mt-1">{m.value}</p>
                  </div>
                  <m.icon className={`h-5 w-5 ${m.color} opacity-70`} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tenant Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {tenantsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 font-medium text-muted-foreground">Clinic</th>
                    <th className="pb-2 font-medium text-muted-foreground">Plan</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Patients</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Users</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Appts (Month)</th>
                    <th className="pb-2 font-medium text-muted-foreground text-right">Active Courses</th>
                    <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.tenant_id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 font-medium">{t.tenant_name}</td>
                      <td className="py-3"><Badge variant={PLAN_COLORS[t.plan] as any}>{t.plan}</Badge></td>
                      <td className="py-3 text-right">{t.patient_count}</td>
                      <td className="py-3 text-right">
                        <span className={t.user_count > t.max_users * 0.9 ? "text-destructive font-semibold" : ""}>
                          {t.user_count}
                        </span>
                        <span className="text-muted-foreground">/{t.max_users}</span>
                      </td>
                      <td className="py-3 text-right">{t.appointment_count}</td>
                      <td className="py-3 text-right">{t.active_treatment_count}</td>
                      <td className="py-3">
                        <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
