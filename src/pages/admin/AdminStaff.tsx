import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, UserCog, Shield, Stethoscope } from "lucide-react";

const roleIcons: Record<string, any> = {
  admin: Shield,
  nurse: Stethoscope,
  patient: UserCog,
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  nurse: "bg-accent text-accent-foreground",
  patient: "bg-muted text-muted-foreground",
};

function useStaffMembers(roleFilter: string) {
  return useQuery({
    queryKey: ["staff-members", roleFilter],
    queryFn: async () => {
      // Get profiles with roles (admin/nurse only for staff view)
      const filterRoles: ("admin" | "nurse")[] = roleFilter === "all" ? ["admin", "nurse"] : [roleFilter as "admin" | "nurse"];
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", filterRoles);

      if (rolesError) throw rolesError;
      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      return (profiles || []).map((p) => ({
        ...p,
        role: roles.find((r) => r.user_id === p.user_id)?.role || "unknown",
      }));
    },
  });
}

export default function AdminStaff() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: staff, isLoading } = useStaffMembers(roleFilter);

  const filtered = staff?.filter((s: any) => {
    if (!search) return true;
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground">{staff?.length || 0} staff members</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No staff members found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member: any) => {
            const RoleIcon = roleIcons[member.role] || UserCog;
            return (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <RoleIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">
                        {member.first_name || "—"} {member.last_name || ""}
                      </p>
                      {member.phone && (
                        <p className="text-sm text-muted-foreground">{member.phone}</p>
                      )}
                      <div className="mt-2">
                        <Badge className={roleColors[member.role] || ""}>
                          {member.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {format(new Date(member.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">
            To add new staff members, create their account via the{" "}
            <a
              href="https://supabase.com/dashboard/project/fydpeoqwdnjfxxdsxvws/auth/users"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Supabase Auth dashboard
            </a>{" "}
            and assign their role in the user_roles table.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
