import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search,
  Plus,
  Pencil,
  Send,
  Stethoscope,
  FileText,
  Phone,
  Mail,
  MapPin,
  Building2,
  Trash2,
} from "lucide-react";
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

type DoctorFormData = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone: string;
  practice_name: string;
  practice_number: string;
  specialisation: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  postal_code: string;
};

const emptyForm: DoctorFormData = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  phone: "",
  practice_name: "",
  practice_number: "",
  specialisation: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  postal_code: "",
};

function useDoctorsAdmin() {
  return useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const { data: doctors, error } = await supabase
        .from("doctors")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get profile names for each doctor
      const userIds = (doctors || []).map((d: any) => d.user_id).filter(Boolean);
      let profileMap: Record<string, { first_name: string | null; last_name: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", userIds);
        (profiles || []).forEach((p: any) => {
          profileMap[p.user_id] = { first_name: p.first_name, last_name: p.last_name };
        });
      }

      // Get referral counts per doctor
      const { data: referralCounts } = await supabase
        .from("referrals")
        .select("doctor_id");

      const countMap: Record<string, number> = {};
      (referralCounts || []).forEach((r: any) => {
        countMap[r.doctor_id] = (countMap[r.doctor_id] || 0) + 1;
      });

      return (doctors || []).map((d: any) => {
        const profile = profileMap[d.user_id];
        return {
          ...d,
          profile_first_name: profile?.first_name || "",
          profile_last_name: profile?.last_name || "",
          doctor_name: profile
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown"
            : "Unknown",
          referral_count: countMap[d.id] || 0,
        };
      });
    },
  });
}

export default function AdminDoctors() {
  const { data: doctors, isLoading } = useDoctorsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>(emptyForm);
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDoctor, setDeleteDoctor] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [invitePassword, setInvitePassword] = useState("");

  const handleDelete = async () => {
    if (!deleteDoctor?.user_id) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("delete-staff", {
        body: { user_id: deleteDoctor.user_id },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to delete doctor");
      }
      toast({ title: "Doctor deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      setDeleteOpen(false);
      setDeleteDoctor(null);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.email || !formData.password) {
      toast({ title: "Email and password are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("create-staff", {
        body: {
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          role: "doctor",
          practice_name: formData.practice_name,
          practice_number: formData.practice_number,
          specialisation: formData.specialisation,
        },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create doctor");
      }

      // Update doctor record with address fields
      if (formData.address_line_1 || formData.city) {
        const { data: newDoctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("email", formData.email)
          .maybeSingle();
        if (newDoctor) {
          await supabase.from("doctors").update({
            address_line_1: formData.address_line_1 || null,
            address_line_2: formData.address_line_2 || null,
            city: formData.city || null,
            postal_code: formData.postal_code || null,
          }).eq("id", newDoctor.id);
        }
      }

      // Auto-send invite with temp password
      const doctorEmail = formData.email;
      const doctorName = `${formData.first_name} ${formData.last_name}`.trim() || "Doctor";
      const tempPassword = formData.password;

      // Find the newly created doctor record
      const { data: newDoctorForInvite } = await supabase
        .from("doctors")
        .select("id")
        .eq("email", doctorEmail)
        .maybeSingle();

      if (newDoctorForInvite) {
        try {
          await supabase.functions.invoke("send-doctor-invite", {
            body: {
              doctor_id: newDoctorForInvite.id,
              email: doctorEmail,
              doctor_name: doctorName,
              temp_password: tempPassword,
            },
          });
          toast({ title: "Doctor created & invite email sent with login credentials" });
        } catch {
          toast({ title: "Doctor created but invite email failed — use Re-invite to retry", variant: "destructive" });
        }
      } else {
        toast({ title: "Doctor created successfully" });
      }

      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      setCreateOpen(false);
      setFormData(emptyForm);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!editDoctor) return;
    setSaving(true);
    try {
      await supabase.from("doctors").update({
        practice_name: editDoctor.practice_name || null,
        practice_number: editDoctor.practice_number || null,
        specialisation: editDoctor.specialisation || null,
        phone: editDoctor.phone || null,
        email: editDoctor.email || null,
        address_line_1: editDoctor.address_line_1 || null,
        address_line_2: editDoctor.address_line_2 || null,
        city: editDoctor.city || null,
        postal_code: editDoctor.postal_code || null,
        is_active: editDoctor.is_active,
      }).eq("id", editDoctor.id);

      // Update profile name
      if (editDoctor.user_id) {
        await supabase.from("profiles").update({
          first_name: editDoctor.profile_first_name || null,
          last_name: editDoctor.profile_last_name || null,
        }).eq("user_id", editDoctor.user_id);
      }

      toast({ title: "Doctor updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
      setEditOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async () => {
    if (!selectedDoctor?.email) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("send-doctor-invite", {
        body: {
          doctor_id: selectedDoctor.id,
          email: selectedDoctor.email,
          doctor_name: selectedDoctor.doctor_name,
          temp_password: lastCreatedPassword || undefined,
        },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to send invite");
      }
      toast({ title: "Invite email sent successfully" });
      setInviteOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (doc: any) => {
    setEditDoctor({
      ...doc,
      profile_first_name: doc.profile_first_name || "",
      profile_last_name: doc.profile_last_name || "",
    });
    setEditOpen(true);
  };

  const filtered = doctors?.filter((d: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.doctor_name.toLowerCase().includes(s) ||
      (d.practice_name || "").toLowerCase().includes(s) ||
      (d.specialisation || "").toLowerCase().includes(s) ||
      (d.email || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Doctor Management</h1>
          <p className="text-muted-foreground">{doctors?.length || 0} registered doctors</p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Add Doctor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search doctors..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No doctors found.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Practice</TableHead>
                  <TableHead>Specialisation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-center">Referrals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc: any) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 shrink-0">
                          <Stethoscope className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{doc.doctor_name || "—"}</p>
                          {doc.practice_number && (
                            <p className="text-xs text-muted-foreground">HPCSA: {doc.practice_number}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{doc.practice_name || "—"}</TableCell>
                    <TableCell className="text-sm">{doc.specialisation || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        {doc.email && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {doc.email}
                          </div>
                        )}
                        {doc.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" /> {doc.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-mono">
                        <FileText className="h-3 w-3 mr-1" /> {doc.referral_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.is_active ? "default" : "secondary"}>
                        {doc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(doc)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedDoctor(doc); setInviteOpen(true); }}
                          title="Send invite"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setDeleteDoctor(doc); setDeleteOpen(true); }}
                          title="Delete doctor"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create Doctor Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Doctor</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Account Credentials</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Temporary Password *</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Personal Details</h4>
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
              <div className="mt-3">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Practice Details</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Practice Name</Label>
                  <Input value={formData.practice_name} onChange={(e) => setFormData({ ...formData, practice_name: e.target.value })} />
                </div>
                <div>
                  <Label>HPCSA Practice Number</Label>
                  <Input value={formData.practice_number} onChange={(e) => setFormData({ ...formData, practice_number: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <Label>Specialisation</Label>
                <Input value={formData.specialisation} onChange={(e) => setFormData({ ...formData, specialisation: e.target.value })} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Address</h4>
              <div className="space-y-3">
                <div>
                  <Label>Address Line 1</Label>
                  <Input value={formData.address_line_1} onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })} />
                </div>
                <div>
                  <Label>Address Line 2</Label>
                  <Input value={formData.address_line_2} onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>City</Label>
                    <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                  </div>
                  <div>
                    <Label>Postal Code</Label>
                    <Input value={formData.postal_code} onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating..." : "Create Doctor"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Doctor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Doctor</DialogTitle>
          </DialogHeader>
          {editDoctor && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Personal Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name</Label>
                    <Input value={editDoctor.profile_first_name} onChange={(e) => setEditDoctor({ ...editDoctor, profile_first_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input value={editDoctor.profile_last_name} onChange={(e) => setEditDoctor({ ...editDoctor, profile_last_name: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Practice Details</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Practice Name</Label>
                    <Input value={editDoctor.practice_name || ""} onChange={(e) => setEditDoctor({ ...editDoctor, practice_name: e.target.value })} />
                  </div>
                  <div>
                    <Label>HPCSA Practice Number</Label>
                    <Input value={editDoctor.practice_number || ""} onChange={(e) => setEditDoctor({ ...editDoctor, practice_number: e.target.value })} />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Specialisation</Label>
                  <Input value={editDoctor.specialisation || ""} onChange={(e) => setEditDoctor({ ...editDoctor, specialisation: e.target.value })} />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Contact</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Email</Label>
                    <Input value={editDoctor.email || ""} onChange={(e) => setEditDoctor({ ...editDoctor, email: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={editDoctor.phone || ""} onChange={(e) => setEditDoctor({ ...editDoctor, phone: e.target.value })} />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Address</h4>
                <div className="space-y-3">
                  <Input placeholder="Address Line 1" value={editDoctor.address_line_1 || ""} onChange={(e) => setEditDoctor({ ...editDoctor, address_line_1: e.target.value })} />
                  <Input placeholder="Address Line 2" value={editDoctor.address_line_2 || ""} onChange={(e) => setEditDoctor({ ...editDoctor, address_line_2: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={editDoctor.city || ""} onChange={(e) => setEditDoctor({ ...editDoctor, city: e.target.value })} />
                    <Input placeholder="Postal Code" value={editDoctor.postal_code || ""} onChange={(e) => setEditDoctor({ ...editDoctor, postal_code: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={editDoctor.is_active}
                  onCheckedChange={(v) => setEditDoctor({ ...editDoctor, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Doctor Invite</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a welcome email to <strong>{selectedDoctor?.doctor_name}</strong> at{" "}
            <strong>{selectedDoctor?.email}</strong> with their login details and a link to the doctor portal.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={saving} className="gap-2">
              <Send className="h-4 w-4" />
              {saving ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{deleteDoctor?.doctor_name}</strong>? This will remove their account, profile, and role. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
