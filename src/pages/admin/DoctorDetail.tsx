import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useReferrals } from "@/hooks/useReferrals";
import { useDoctorReports } from "@/hooks/useDoctorReports";
import DoctorChatThread from "@/components/admin/DoctorChatThread";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft, Save, X, Edit2, Stethoscope, FileText, Phone, Mail,
  MapPin, Building2, Send, Trash2, KeyRound, MessageCircle, Users, Loader2,
} from "lucide-react";

function useDoctorDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["doctor-detail", id],
    queryFn: async () => {
      if (!id) return null;
      const { data: doctor, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;

      // Get profile name
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", doctor.user_id)
        .maybeSingle();

      return {
        ...doctor,
        profile_first_name: profile?.first_name || "",
        profile_last_name: profile?.last_name || "",
        doctor_name: profile
          ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Unknown"
          : "Unknown",
      };
    },
    enabled: !!id,
  });
}

function useLinkedPatients(doctorId: string | undefined) {
  return useQuery({
    queryKey: ["doctor-linked-patients", doctorId],
    queryFn: async () => {
      if (!doctorId) return [];
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("patient_id")
        .eq("doctor_id", doctorId)
        .not("patient_id", "is", null);
      if (error) throw error;

      const patientIds = [...new Set((referrals || []).map((r: any) => r.patient_id).filter(Boolean))];
      if (!patientIds.length) return [];

      const { data: patients, error: pErr } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone, status")
        .in("id", patientIds);
      if (pErr) throw pErr;
      return patients || [];
    },
    enabled: !!doctorId,
  });
}

export default function DoctorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: doctor, isLoading } = useDoctorDetail(id);
  const { data: referrals = [] } = useReferrals(id);
  const { data: reports = [] } = useDoctorReports({ doctorId: id });
  const { data: linkedPatients = [] } = useLinkedPatients(id);

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invitePassword, setInvitePassword] = useState("");

  const handleEdit = () => {
    setEditData({ ...doctor });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData || !id) return;
    setSaving(true);
    try {
      await supabase.from("doctors").update({
        practice_name: editData.practice_name || null,
        practice_number: editData.practice_number || null,
        specialisation: editData.specialisation || null,
        phone: editData.phone || null,
        email: editData.email || null,
        address_line_1: editData.address_line_1 || null,
        address_line_2: editData.address_line_2 || null,
        city: editData.city || null,
        postal_code: editData.postal_code || null,
        is_active: editData.is_active,
      }).eq("id", id);

      if (editData.user_id) {
        await supabase.from("profiles").update({
          first_name: editData.profile_first_name || null,
          last_name: editData.profile_last_name || null,
        }).eq("user_id", editData.user_id);
      }

      toast({ title: "Doctor updated" });
      queryClient.invalidateQueries({ queryKey: ["doctor-detail", id] });
      setIsEditing(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doctor?.user_id) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("delete-staff", {
        body: { user_id: doctor.user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast({ title: "Doctor deleted" });
      navigate("/admin/doctors");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    let pw = "";
    for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    setInvitePassword(pw);
  };

  const handleSendInvite = async () => {
    if (!doctor?.email || !invitePassword) return;
    setSaving(true);
    try {
      const res = await supabase.functions.invoke("send-doctor-invite", {
        body: {
          doctor_id: doctor.id,
          email: doctor.email,
          doctor_name: doctor.doctor_name,
          temp_password: invitePassword,
          reset_password: true,
        },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast({ title: "Password reset & invite email sent" });
      setInviteOpen(false);
      setInvitePassword("");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Doctor not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/doctors")} className="mt-4">
          Back to Doctors
        </Button>
      </div>
    );
  }

  const d = isEditing ? editData : doctor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/doctors")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-medium shrink-0">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{doctor.doctor_name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={doctor.is_active ? "default" : "secondary"}>
                {doctor.is_active ? "Active" : "Inactive"}
              </Badge>
              {doctor.specialisation && (
                <span className="text-sm text-muted-foreground">{doctor.specialisation}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><Stethoscope className="mr-2 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="referrals">
            <FileText className="mr-2 h-4 w-4" />Referrals
            <Badge variant="secondary" className="ml-2 text-xs">{referrals.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="patients">
            <Users className="mr-2 h-4 w-4" />Patients
            <Badge variant="secondary" className="ml-2 text-xs">{linkedPatients.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="mr-2 h-4 w-4" />Reports
            <Badge variant="secondary" className="ml-2 text-xs">{reports.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="messages"><MessageCircle className="mr-2 h-4 w-4" />Messages</TabsTrigger>
          <TabsTrigger value="account"><KeyRound className="mr-2 h-4 w-4" />Account</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5" />Practice Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>First Name</Label><Input value={d.profile_first_name} onChange={(e) => setEditData({ ...d, profile_first_name: e.target.value })} /></div>
                      <div><Label>Last Name</Label><Input value={d.profile_last_name} onChange={(e) => setEditData({ ...d, profile_last_name: e.target.value })} /></div>
                    </div>
                    <div><Label>Practice Name</Label><Input value={d.practice_name || ""} onChange={(e) => setEditData({ ...d, practice_name: e.target.value })} /></div>
                    <div><Label>HPCSA Number</Label><Input value={d.practice_number || ""} onChange={(e) => setEditData({ ...d, practice_number: e.target.value })} /></div>
                    <div><Label>Specialisation</Label><Input value={d.specialisation || ""} onChange={(e) => setEditData({ ...d, specialisation: e.target.value })} /></div>
                    <div className="flex items-center gap-3">
                      <Switch checked={d.is_active} onCheckedChange={(v) => setEditData({ ...d, is_active: v })} />
                      <Label>Active</Label>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <InfoRow label="Name" value={doctor.doctor_name} />
                    <InfoRow label="Practice" value={doctor.practice_name} />
                    <InfoRow label="HPCSA Number" value={doctor.practice_number} />
                    <InfoRow label="Specialisation" value={doctor.specialisation} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5" />Contact & Address</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div><Label>Email</Label><Input value={d.email || ""} onChange={(e) => setEditData({ ...d, email: e.target.value })} /></div>
                    <div><Label>Phone</Label><Input value={d.phone || ""} onChange={(e) => setEditData({ ...d, phone: e.target.value })} /></div>
                    <div><Label>Address Line 1</Label><Input value={d.address_line_1 || ""} onChange={(e) => setEditData({ ...d, address_line_1: e.target.value })} /></div>
                    <div><Label>Address Line 2</Label><Input value={d.address_line_2 || ""} onChange={(e) => setEditData({ ...d, address_line_2: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>City</Label><Input value={d.city || ""} onChange={(e) => setEditData({ ...d, city: e.target.value })} /></div>
                      <div><Label>Postal Code</Label><Input value={d.postal_code || ""} onChange={(e) => setEditData({ ...d, postal_code: e.target.value })} /></div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <InfoRow label="Email" value={doctor.email} icon={<Mail className="h-4 w-4 text-muted-foreground" />} />
                    <InfoRow label="Phone" value={doctor.phone} icon={<Phone className="h-4 w-4 text-muted-foreground" />} />
                    <InfoRow
                      label="Address"
                      value={[doctor.address_line_1, doctor.address_line_2, doctor.city, doctor.postal_code].filter(Boolean).join(", ") || null}
                      icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Referrals Tab */}
        <TabsContent value="referrals">
          <Card>
            <CardContent className="p-0">
              {referrals.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No referrals from this doctor yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.patient_first_name} {r.patient_last_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {r.diagnosis || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.urgency === "urgent" ? "destructive" : "secondary"}>
                            {r.urgency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Patients Tab */}
        <TabsContent value="patients">
          <Card>
            <CardContent className="p-0">
              {linkedPatients.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No linked patients yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedPatients.map((p: any) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/patients/${p.id}`)}
                      >
                        <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.email || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">No reports for this doctor yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium max-w-[250px] truncate">{r.subject}</TableCell>
                        <TableCell className="text-sm">
                          {r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : "—"}
                        </TableCell>
                        <TableCell><Badge variant="outline">{r.milestone}</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{r.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" /> Chat with {doctor.doctor_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DoctorChatThread doctorId={id!} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5" /> Account Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => { setInviteOpen(true); }} className="gap-2">
                  <Send className="h-4 w-4" /> Reset Password & Re-invite
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete Doctor
                </Button>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Email: {doctor.email || "—"}</p>
                <p>Created: {format(new Date(doctor.created_at), "dd MMM yyyy")}</p>
                <p>Must change password: {doctor.must_change_password ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Re-invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInvitePassword(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password & Re-send Invite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a new temporary password for <strong>{doctor.doctor_name}</strong> and send them a fresh invite email at <strong>{doctor.email}</strong>.
            </p>
            <div className="space-y-2">
              <Label>New Temporary Password *</Label>
              <div className="flex gap-2">
                <Input type="text" value={invitePassword} onChange={(e) => setInvitePassword(e.target.value)} placeholder="Enter or generate a password" />
                <Button type="button" variant="outline" size="sm" onClick={generatePassword} className="shrink-0">Generate</Button>
              </div>
              <p className="text-xs text-muted-foreground">The doctor will be forced to change it on first login.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleSendInvite} disabled={saving || !invitePassword} className="gap-2">
              <Send className="h-4 w-4" />
              {saving ? "Sending..." : "Reset & Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete <strong>{doctor.doctor_name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}
