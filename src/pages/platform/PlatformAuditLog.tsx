import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlatformAuditLog } from "@/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

export default function PlatformAuditLog() {
  const { data: entries = [], isLoading } = usePlatformAuditLog(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global Audit Log</h1>
        <p className="text-muted-foreground">Cross-tenant activity feed • {entries.length} entries</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : entries.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No audit log entries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left bg-muted/50">
                    <th className="p-3 font-medium text-muted-foreground">Time</th>
                    <th className="p-3 font-medium text-muted-foreground">Tenant</th>
                    <th className="p-3 font-medium text-muted-foreground">Action</th>
                    <th className="p-3 font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(e.created_at), "dd MMM HH:mm")}</td>
                      <td className="p-3"><Badge variant="outline">{e.tenant_name ?? "System"}</Badge></td>
                      <td className="p-3 font-medium">{e.action}</td>
                      <td className="p-3 text-muted-foreground text-xs max-w-md truncate">
                        {e.details ? JSON.stringify(e.details).slice(0, 120) : "—"}
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
