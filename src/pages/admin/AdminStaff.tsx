import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStaff, useStaffMutations, type StaffMember } from "@/hooks/useStaff";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Search, Shield, Stethoscope, Briefcase, UserCog, Plus, MoreVertical,
  Pencil, KeyRound, UserX, UserCheck, Trash2, Copy, Mail,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { StaffFormDialog } from "@/components/admin/staff/StaffFormDialog";
import { ResetPasswordDialog } from "@/components/admin/staff/ResetPasswordDialog";

const roleIcons = { admin: Shield, nurse: Stethoscope, doctor: Briefcase } as const;
const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  nurse: "bg-accent text-accent-foreground",
  doctor: "bg-green-100 text-green-800",
};

function statusBadge(m: StaffMember) {
  if (m.is_disabled) return <Badge variant="destructive">Disabled</Badge>;
  if (!m.email_confirmed_at) return <Badge variant="secondary">Email unconfirmed</Badge>;
  return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
}

export default function AdminStaff() {
  const { data: staff, isLoading } = useStaff();
  const { create, update, resetPassword, setStatus, remove } = useStaffMutations();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; disable: boolean }>({ open: false, disable: false });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  const filtered = useMemo(() => {
    if (!staff) return [];
    return staff.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (statusFilter === "active" && (m.is_disabled || !m.email_confirmed_at)) return false;
      if (statusFilter === "disabled" && !m.is_disabled) return false;
      if (statusFilter === "unconfirmed" && (m.is_disabled || m.email_confirmed_at)) return false;
      if (search) {
        const hay = `${m.first_name || ""} ${m.last_name || ""} ${m.email || ""} ${m.phone || ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [staff, search, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const c = { admin: 0, nurse: 0, doctor: 0, total: staff?.length || 0 };
    staff?.forEach((s) => { c[s.role] = (c[s.role] || 0) + 1; });
    return c;
  }, [staff]);

  const handleCreate = async (v: any) => {
    try {
      await create.mutateAsync({
        email: v.email,
        password: v.send_invite ? undefined : v.password,
        first_name: v.first_name,
        last_name: v.last_name,
        phone: v.phone,
        role: v.role,
        practice_name: v.practice_name,
        practice_number: v.practice_number,
        specialisation: v.specialisation,
        send_invite: v.send_invite,
      });
      toast({ title: "Staff member created", description: v.send_invite ? "Invite email sent." : undefined });
      setCreateOpen(false);
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleEdit = async (v: any) => {
    if (!selected) return;
    try {
      await update.mutateAsync({
        user_id: selected.user_id,
        first_name: v.first_name,
        last_name: v.last_name,
        phone: v.phone,
        email: v.email !== selected.email ? v.email : undefined,
        role: v.role,
        practice_name: v.practice_name,
        practice_number: v.practice_number,
        specialisation: v.specialisation,
      });
      toast({ title: "Staff member updated" });
      setEditOpen(false);
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleReset = async (mode: "set" | "email", data: any) => {
    if (!selected) return;
    try {
      await resetPassword.mutateAsync({ user_id: selected.user_id, mode, ...data });
      toast({ title: mode === "email" ? "Reset email sent" : "Password updated" });
      setResetOpen(false);
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleSetStatus = async () => {
    if (!selected) return;
    try {
      await setStatus.mutateAsync({ user_id: selected.user_id, disable: statusDialog.disable });
      toast({ title: statusDialog.disable ? "Account disabled" : "Account enabled" });
      setStatusDialog({ open: false, disable: false });
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await remove.mutateAsync(selected.user_id);
      toast({ title: "Staff member deleted" });
      setDeleteOpen(false);
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const copyEmail = (email: string | null) => {
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast({ title: "Email copied" });
  };

  const renderActions = (m: StaffMember) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => { setSelected(m); setEditOpen(true); }}>
          <Pencil className="h-4 w-4 mr-2" /> Edit profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setSelected(m); setResetOpen(true); }}>
          <KeyRound className="h-4 w-4 mr-2" /> Reset password
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {m.is_disabled ? (
          <DropdownMenuItem onClick={() => { setSelected(m); setStatusDialog({ open: true, disable: false }); }}>
            <UserCheck className="h-4 w-4 mr-2" /> Enable account
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => { setSelected(m); setStatusDialog({ open: true, disable: true }); }}>
            <UserX className="h-4 w-4 mr-2" /> Disable account
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => { setSelected(m); setDeleteOpen(true); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete permanently
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            {counts.total} total · {counts.admin} admin · {counts.nurse} nurse · {counts.doctor} doctor
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="unconfirmed">Email unconfirmed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="table">Table</TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : !filtered.length ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No staff members found.</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((m) => {
                const RoleIcon = roleIcons[m.role] || UserCog;
                return (
                  <Card key={m.user_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <RoleIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {m.first_name || "—"} {m.last_name || ""}
                              </p>
                              {m.email && (
                                <button
                                  onClick={() => copyEmail(m.email)}
                                  className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate max-w-full"
                                  title="Copy email"
                                >
                                  <Mail className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{m.email}</span>
                                  <Copy className="h-3 w-3 shrink-0 opacity-60" />
                                </button>
                              )}
                              {m.phone && <p className="text-xs text-muted-foreground mt-0.5">{m.phone}</p>}
                            </div>
                            {renderActions(m)}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className={roleColors[m.role] || ""}>{m.role}</Badge>
                            {statusBadge(m)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-3 space-y-0.5">
                            <p>Last sign-in: {m.last_sign_in_at ? formatDistanceToNow(new Date(m.last_sign_in_at), { addSuffix: true }) : "Never"}</p>
                            <p>Joined {format(new Date(m.created_at), "dd MMM yyyy")}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last sign-in</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.user_id} className="border-t border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{m.first_name} {m.last_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                        <td className="px-4 py-3"><Badge className={roleColors[m.role] || ""}>{m.role}</Badge></td>
                        <td className="px-4 py-3">{statusBadge(m)}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {m.last_sign_in_at ? formatDistanceToNow(new Date(m.last_sign_in_at), { addSuffix: true }) : "Never"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{format(new Date(m.created_at), "dd MMM yyyy")}</td>
                        <td className="px-4 py-3 text-right">{renderActions(m)}</td>
                      </tr>
                    ))}
                    {!filtered.length && !isLoading && (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No staff members found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StaffFormDialog
        open={createOpen} onOpenChange={setCreateOpen} mode="create"
        onSubmit={handleCreate} saving={create.isPending}
      />
      <StaffFormDialog
        open={editOpen} onOpenChange={setEditOpen} mode="edit" member={selected}
        onSubmit={handleEdit} saving={update.isPending}
      />
      <ResetPasswordDialog
        open={resetOpen} onOpenChange={setResetOpen} member={selected}
        onSubmit={handleReset} saving={resetPassword.isPending}
      />

      <AlertDialog open={statusDialog.open} onOpenChange={(o) => setStatusDialog({ ...statusDialog, open: o })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{statusDialog.disable ? "Disable account?" : "Enable account?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.disable
                ? `${selected?.first_name} ${selected?.last_name} will no longer be able to sign in. All their data is preserved.`
                : `${selected?.first_name} ${selected?.last_name} will be able to sign in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSetStatus} className={statusDialog.disable ? "bg-destructive hover:bg-destructive/90" : ""}>
              {statusDialog.disable ? "Disable" : "Enable"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete staff member permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selected?.first_name} {selected?.last_name}'s login, profile,
              role and {selected?.role === "doctor" ? "doctor record" : "any related staff data"}.
              This cannot be undone. To preserve data, use <strong>Disable account</strong> instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}