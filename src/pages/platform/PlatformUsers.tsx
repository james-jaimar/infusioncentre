import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Users } from "lucide-react";
import { usePlatformUsers } from "@/hooks/usePlatformAdmin";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const ROLE_COLORS: Record<string, string> = {
  admin: "destructive",
  nurse: "default",
  doctor: "outline",
  patient: "secondary",
};

export default function PlatformUsers() {
  const { data: users = [], isLoading } = usePlatformUsers();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");

  const tenantNames = [...new Set(users.map(u => u.tenant_name).filter(Boolean))];

  const filtered = users.filter(u => {
    const matchesSearch = !search ||
      (u.email?.toLowerCase().includes(search.toLowerCase())) ||
      (u.first_name?.toLowerCase().includes(search.toLowerCase())) ||
      (u.last_name?.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesTenant = tenantFilter === "all" || u.tenant_name === tenantFilter;
    return matchesSearch && matchesRole && matchesTenant;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Global User Management</h1>
        <p className="text-muted-foreground">All users across all tenants • {users.length} total</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
            <SelectItem value="patient">Patient</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenantFilter} onValueChange={setTenantFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tenant" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tenants</SelectItem>
            {tenantNames.map(n => <SelectItem key={n!} value={n!}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left bg-muted/50">
                    <th className="p-3 font-medium text-muted-foreground">User</th>
                    <th className="p-3 font-medium text-muted-foreground">Email</th>
                    <th className="p-3 font-medium text-muted-foreground">Role</th>
                    <th className="p-3 font-medium text-muted-foreground">Tenant</th>
                    <th className="p-3 font-medium text-muted-foreground">Status</th>
                    <th className="p-3 font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.user_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{u.first_name || ""} {u.last_name || ""}</td>
                      <td className="p-3 text-muted-foreground">{u.email}</td>
                      <td className="p-3"><Badge variant={ROLE_COLORS[u.role ?? ""] as any}>{u.role ?? "none"}</Badge></td>
                      <td className="p-3">{u.tenant_name ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={u.is_approved ? "default" : "secondary"}>
                          {u.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{format(new Date(u.created_at), "dd MMM yyyy")}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
