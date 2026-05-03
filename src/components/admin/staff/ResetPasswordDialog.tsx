import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type { StaffMember } from "@/hooks/useStaff";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  member: StaffMember | null;
  onSubmit: (mode: "set" | "email", data: { password?: string; force_change?: boolean }) => Promise<void>;
  saving: boolean;
};

export function ResetPasswordDialog({ open, onOpenChange, member, onSubmit, saving }: Props) {
  const [tab, setTab] = useState<"set" | "email">("email");
  const [password, setPassword] = useState("");
  const [forceChange, setForceChange] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            For {member?.first_name} {member?.last_name} ({member?.email}).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="email">Email reset link</TabsTrigger>
            <TabsTrigger value="set">Set new password</TabsTrigger>
          </TabsList>
          <TabsContent value="email" className="space-y-3 pt-3">
            <p className="text-sm text-muted-foreground">
              Sends a password reset email to <span className="font-medium text-foreground">{member?.email}</span>.
              They click the link, choose a new password, and sign in.
            </p>
          </TabsContent>
          <TabsContent value="set" className="space-y-4 pt-3">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div>
              <Label>New password *</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Force change on next sign-in</p>
                <p className="text-xs text-muted-foreground">User must set a new password after logging in.</p>
              </div>
              <Switch checked={forceChange} onCheckedChange={setForceChange} />
            </div>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => onSubmit(tab, tab === "set" ? { password, force_change: forceChange } : {})}
            disabled={saving || (tab === "set" && password.length < 8)}
          >
            {saving ? "Working..." : tab === "email" ? "Send reset email" : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}