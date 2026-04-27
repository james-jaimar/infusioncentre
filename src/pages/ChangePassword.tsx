import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import logo from "@/assets/logo.png";

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, clearMustChangePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast({ variant: "destructive", title: "Password too short", description: "Password must be at least 8 characters." });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Passwords don't match", description: "Please ensure both passwords are identical." });
      return;
    }

    setIsLoading(true);
    try {
      // Update auth password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Clear the must_change_password flag on both profiles and doctors
      if (user) {
        await Promise.all([
          supabase.from("profiles").update({ must_change_password: false }).eq("user_id", user.id),
          supabase.from("doctors").update({ must_change_password: false }).eq("user_id", user.id),
        ]);
      }

      clearMustChangePassword();
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to update password", description: err.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img src={logo} alt="The Johannesburg Infusion Centre" className="h-16 w-auto mb-6" />
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Set Your Password</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            For security, please create a new password before accessing your portal.
          </p>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-clinical-md border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm text-muted-foreground">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                "Set Password & Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
