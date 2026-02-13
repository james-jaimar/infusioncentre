import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Key, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PatientAccountTabProps {
  patientId: string;
  patientEmail: string | null;
  patientUserId: string | null;
  patientName: string;
}

export default function PatientAccountTab({
  patientId,
  patientEmail,
  patientUserId,
  patientName,
}: PatientAccountTabProps) {
  const [sendingReset, setSendingReset] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const hasAccount = !!patientUserId;

  async function handleSendResetEmail() {
    if (!patientEmail) {
      toast.error("Patient has no email address on file");
      return;
    }

    setSendingReset(true);
    try {
      if (hasAccount) {
        // Use admin-reset-email action
        const { error } = await supabase.functions.invoke("password-reset", {
          body: { action: "admin-reset-email", user_id: patientUserId },
        });
        if (error) throw error;
      } else {
        // Use regular request action (by email)
        const { error } = await supabase.functions.invoke("password-reset", {
          body: { action: "request", email: patientEmail },
        });
        if (error) throw error;
      }
      toast.success(`Password reset email sent to ${patientEmail}`);
    } catch (err: any) {
      console.error("Reset email error:", err);
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  }

  async function handleSetPassword() {
    if (!patientUserId) {
      toast.error("Patient does not have an account yet");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setSettingPassword(true);
    try {
      const { error } = await supabase.functions.invoke("password-reset", {
        body: { action: "admin-set-password", user_id: patientUserId, password: newPassword },
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Set password error:", err);
      toast.error(err.message || "Failed to set password");
    } finally {
      setSettingPassword(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Portal Account:</span>
            {hasAccount ? (
              <Badge variant="default">Active</Badge>
            ) : (
              <Badge variant="secondary">No Account</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Email:</span>
            <span className="text-sm text-muted-foreground">{patientEmail || "Not set"}</span>
          </div>
          {!hasAccount && (
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                This patient hasn't created a portal account yet. Send them an invite from the header above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Password Reset Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5" />
            Send Password Reset Email
          </CardTitle>
          <CardDescription>
            Send a password reset link to {patientName}'s email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSendResetEmail}
            disabled={sendingReset || !patientEmail}
            variant="outline"
          >
            {sendingReset ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Send Reset Email
          </Button>
        </CardContent>
      </Card>

      {/* Set Password Directly */}
      {hasAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" />
              Set Password Directly
            </CardTitle>
            <CardDescription>
              Set a new password for {patientName} immediately. Use this if they can't access their email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                />
              </div>
            </div>
            <Button
              onClick={handleSetPassword}
              disabled={settingPassword || !newPassword}
            >
              {settingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              Set Password
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
