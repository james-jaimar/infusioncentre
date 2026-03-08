import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { usePlatformTenantStats } from "@/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const PLAN_LIMITS: Record<string, { chairs: number; users: number }> = {
  free: { chairs: 2, users: 5 },
  starter: { chairs: 5, users: 20 },
  professional: { chairs: 15, users: 50 },
  enterprise: { chairs: 100, users: 500 },
};

export default function PlatformSubscriptions() {
  const { data: tenants = [], isLoading } = usePlatformTenantStats();

  const planCounts = tenants.reduce((acc, t) => {
    acc[t.plan] = (acc[t.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subscriptions & Usage</h1>
        <p className="text-muted-foreground">Plan distribution and resource utilisation</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["free", "starter", "professional", "enterprise"].map(plan => (
          <Card key={plan}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{plan}</p>
              <p className="text-3xl font-bold mt-1">{planCounts[plan] || 0}</p>
              <p className="text-xs text-muted-foreground">tenants</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Usage by Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <div className="space-y-6">
              {tenants.map(t => {
                const userPct = t.max_users > 0 ? (t.user_count / t.max_users) * 100 : 0;
                const isOverLimit = userPct > 90;
                return (
                  <div key={t.tenant_id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{t.tenant_name}</p>
                        <p className="text-xs text-muted-foreground">{t.slug} • {t.plan}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverLimit ? (
                          <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" /> Near limit</Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-emerald-600"><CheckCircle2 className="h-3 w-3" /> Healthy</Badge>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Users</span>
                          <span className="font-medium">{t.user_count} / {t.max_users}</span>
                        </div>
                        <Progress value={userPct} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="font-bold text-lg">{t.patient_count}</p>
                          <p className="text-muted-foreground">Patients</p>
                        </div>
                        <div className="text-center p-2 bg-muted/50 rounded">
                          <p className="font-bold text-lg">{t.appointment_count}</p>
                          <p className="text-muted-foreground">Appts/mo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
