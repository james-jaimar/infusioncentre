import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, UserCog, Shield, Stethoscope, Plus, Pencil, Trash2, Briefcase } from "lucide-react";

const roleIcons: Record<string, any> = {
  admin: Shield,
  nurse: Stethoscope,
  doctor: Briefcase,
};

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  nurse: "bg-accent text-accent-foreground",
  doctor: "bg-green-100 text-green-800",
};

function useStaffMembers(roleFilter: string) {
  return useQuery({
    queryKey: ["staff-members", roleFilter],
    queryFn: async () => {
      const filterRoles: ("admin" | "nurse" | "doctor")[] =
        roleFilter === "all" ? ["admin", "nurse", "doctor"] : [roleFilter as "admin" | "nurse" | "doctor"];
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

type StaffFormData = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  role: "admin" | "nurse" | "doctor";
  practice_name: string;
  practice_number: string;
  specialisation: string;
};

const emptyForm: StaffFormData = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  password: "",
  role: "nurse",
  practice_name: "",
  practice_number: "",
  specialisation: "",
};

export default function AdminStaff() {
  const [roleFilter, setRoleFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { data: staff, isLoading } = useStaffMembers(roleFilter);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>(emptyForm);
  const [editData, setEditData] = useState<{ first_name: string; last_name: string; phone: string; role: string }>({
    first_name: "",
    last_name: "",
    phone: "",
    role: "nurse",
  });
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Create staff via edge function
  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.role) {
      toast({ title: "Email, password, and role are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-staff", {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: formData.role,
          practice_name: formData.practice_name,
          practice_number: formData.practice_number,
          specialisation: formData.specialisation,
        },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create staff");
      }
      toast({ title: "Staff member created successfully" });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setCreateOpen(false);
      setFormData(emptyForm);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Edit staff profile + role
  const handleEdit = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      // Update profile
      await supabase
        .from("profiles")
        .update({
          first_name: editData.first_name || null,
          last_name: editData.last_name || null,
          phone: editData.phone || null,
        })
        .eq("user_id", selectedMember.user_id);

      // Update role if changed
      if (editData.role !== selectedMember.role) {
        await supabase
          .from("user_roles")
          .update({ role: editData.role as "admin" | "nurse" })
          .eq("user_id", selectedMember.user_id);
      }

      toast({ title: "Staff member updated" });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setEditOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Delete staff (remove role + profile)
  const handleDelete = async () => {
    if (!selectedMember) return;
    setSaving(true);
    try {
      await supabase.from("user_roles").delete().eq("user_id", selectedMember.user_id);
      toast({ title: "Staff member removed" });
      queryClient.invalidateQueries({ queryKey: ["staff-members"] });
      setDeleteOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (member: any) => {
    setSelectedMember(member);
    setEditData({
      first_name: member.first_name || "",
      last_name: member.last_name || "",
      phone: member.phone || "",
      role: member.role,
    });
    setEditOpen(true);
  };

  const openDelete = (member: any) => {
    setSelectedMember(member);
    setDeleteOpen(true);
  };

  const filtered = staff?.filter((s: any) => {
    if (!search) return true;
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">{staff?.length || 0} staff members</p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="nurse">Nurse</SelectItem>
            <SelectItem value="doctor">Doctor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">No staff members found.</CardContent>
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
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {member.first_name || "—"} {member.last_name || ""}
                      </p>
                      {member.phone && <p className="text-sm text-muted-foreground">{member.phone}</p>}
                      <div className="mt-2">
                        <Badge className={roleColors[member.role] || ""}>{member.role}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Joined {format(new Date(member.created_at), "dd MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDelete(member)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <Label>Password *</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as "admin" | "nurse" | "doctor" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === "doctor" && (
              <>
                <div>
                  <Label>Practice Name</Label>
                  <Input value={formData.practice_name} onChange={(e) => setFormData({ ...formData, practice_name: e.target.value })} />
                </div>
                <div>
                  <Label>Practice Number (HPCSA)</Label>
                  <Input value={formData.practice_number} onChange={(e) => setFormData({ ...formData, practice_number: e.target.value })} />
                </div>
                <div>
                  <Label>Specialisation</Label>
                  <Input value={formData.specialisation} onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input value={editData.first_name} onChange={(e) => setEditData({ ...editData, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value={editData.last_name} onChange={(e) => setEditData({ ...editData, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editData.role} onValueChange={(v) => setEditData({ ...editData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {selectedMember?.first_name} {selectedMember?.last_name}'s role. They will no longer have staff access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              {saving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
