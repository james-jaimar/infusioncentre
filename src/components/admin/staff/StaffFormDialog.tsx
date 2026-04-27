import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { StaffMember } from "@/hooks/useStaff";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  member?: StaffMember | null;
  onSubmit: (values: any) => Promise<void>;
  saving: boolean;
};

const empty = {
  first_name: "", last_name: "", phone: "", email: "", password: "",
  role: "nurse" as "admin" | "nurse" | "doctor",
  practice_name: "", practice_number: "", specialisation: "",
  send_invite: true,
};

export function StaffFormDialog({ open, onOpenChange, mode, member, onSubmit, saving }: Props) {
  const [v, setV] = useState({ ...empty });

  useEffect(() => {
    if (mode === "edit" && member) {
      setV({
        first_name: member.first_name || "",
        last_name: member.last_name || "",
        phone: member.phone || "",
        email: member.email || "",
        password: "",
        role: member.role,
        practice_name: member.doctor?.practice_name || "",
        practice_number: member.doctor?.practice_number || "",
        specialisation: member.doctor?.specialisation || "",
        send_invite: false,
      });
    } else if (mode === "create") {
      setV({ ...empty });
    }
  }, [mode, member, open]);

  const isCreate = mode === "create";
  const isDoctor = v.role === "doctor";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Add Staff Member" : "Edit Staff Member"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Create a new staff account with login credentials." : "Update profile, email, and role."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First name</Label>
              <Input value={v.first_name} onChange={(e) => setV({ ...v, first_name: e.target.value })} />
            </div>
            <div>
              <Label>Last name</Label>
              <Input value={v.last_name} onChange={(e) => setV({ ...v, last_name: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Email *</Label>
            <Input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} />
            {!isCreate && (
              <p className="text-xs text-muted-foreground mt-1">
                Changing email will update the user's login address immediately.
              </p>
            )}
          </div>

          <div>
            <Label>Phone</Label>
            <Input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} />
          </div>

          <div>
            <Label>Role *</Label>
            <Select value={v.role} onValueChange={(val) => setV({ ...v, role: val as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isDoctor && (
            <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Doctor profile</p>
              <div>
                <Label>Practice name</Label>
                <Input value={v.practice_name} onChange={(e) => setV({ ...v, practice_name: e.target.value })} />
              </div>
              <div>
                <Label>Practice number (HPCSA)</Label>
                <Input value={v.practice_number} onChange={(e) => setV({ ...v, practice_number: e.target.value })} />
              </div>
              <div>
                <Label>Specialisation</Label>
                <Input value={v.specialisation} onChange={(e) => setV({ ...v, specialisation: e.target.value })} />
              </div>
            </div>
          )}

          {isCreate && (
            <>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Send invite email</p>
                  <p className="text-xs text-muted-foreground">User receives a password setup link by email.</p>
                </div>
                <Switch checked={v.send_invite} onCheckedChange={(c) => setV({ ...v, send_invite: c })} />
              </div>
              {!v.send_invite && (
                <div>
                  <Label>Initial password *</Label>
                  <Input type="password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters. User can change it after sign-in.</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(v)} disabled={saving}>
            {saving ? "Saving..." : isCreate ? "Create staff" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}