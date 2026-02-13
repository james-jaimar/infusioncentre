import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface InviteData {
  id: string;
  patient_id: string;
  token: string;
  email: string;
  status: string;
  expires_at: string;
  patient?: {
    first_name: string;
    last_name: string;
    user_id: string | null;
  };
}

export default function InviteLanding() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Registration form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  // If user is already logged in and invite is accepted, redirect
  useEffect(() => {
    if (user && invite?.status === "accepted") {
      navigate("/patient", { replace: true });
    }
  }, [user, invite]);

  async function validateToken() {
    if (!token) {
      setError("Invalid invite link.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.rpc(
        "validate_invite_token" as any,
        { invite_token: token }
      );

      if (fetchError || !data) {
        setError("This invite link is not valid. Please contact the clinic.");
        setLoading(false);
        return;
      }

      const normalized = data as unknown as InviteData;

      // Check status
      if (normalized.status === "revoked") {
        setError("This invite has been revoked. Please contact the clinic for a new one.");
        setLoading(false);
        return;
      }

      if (normalized.status === "accepted") {
        // Already accepted — redirect to login
        setInvite(normalized);
        setLoading(false);
        return;
      }

      // Check expiry
      if (new Date(normalized.expires_at) < new Date()) {
        setError("This invite link has expired. Please contact the clinic for a new one.");
        setLoading(false);
        return;
      }

      // Check if patient already has an account
      if (normalized.patient?.user_id) {
        setInvite(normalized);
        setLoading(false);
        return;
      }

      setInvite(normalized);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!invite) return;
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setRegistering(true);
    try {
      // Sign up using the invite email
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: invite.patient?.first_name,
            last_name: invite.patient?.last_name,
          },
        },
      });

      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("Registration failed");

      // Link patient record to the new auth user via edge function is not needed
      // The handle_new_user trigger already creates a profile and patient role
      // But we need to link the patients table user_id — we'll do this via a service role call
      // For now, let's update via the client (admin RLS won't apply, but patient can't update patients)
      // We need a small edge function or we accept the invite via service role

      // Mark invite as accepted — this will be done by a simple update
      // Since patient can view own invite but can't update, we'll use the accept flow
      // Actually, let's call a dedicated accept endpoint

      // Link patient record via edge function with retry
      let linkSuccess = false;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const { error: linkError } = await supabase.functions.invoke("send-patient-invite", {
            body: {
              action: "accept",
              token: invite.token,
              user_id: newUserId,
            },
          });
          if (!linkError) {
            linkSuccess = true;
            break;
          }
          console.error(`Link attempt ${attempt + 1} failed:`, linkError);
        } catch (e) {
          console.error(`Link attempt ${attempt + 1} exception:`, e);
        }
        // Brief delay before retry
        if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
      }

      if (!linkSuccess) {
        toast.error("Your account was created but we couldn't complete setup. Please contact the clinic — they can fix this from the admin panel.");
        navigate("/login", { replace: true });
        return;
      }

      toast.success("Account created! Welcome to JIC.");
      navigate("/patient", { replace: true });
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Invite Not Valid</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="pt-4 border-t space-y-2">
              <p className="text-sm text-muted-foreground">Need help? Contact us:</p>
              <a href="tel:+27118801830" className="flex items-center justify-center gap-2 text-primary hover:underline">
                <Phone className="h-4 w-4" />
                011 880 1830
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already has account — redirect to login
  if (invite?.patient?.user_id || invite?.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">You already have an account!</h2>
            <p className="text-muted-foreground">
              Please log in to access your patient portal and complete your forms.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login
            </Button>
            <Button variant="link" onClick={() => navigate("/forgot-password")} className="w-full">
              Forgot your password?
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="JIC" className="h-12 mx-auto mb-2" />
          <CardTitle className="text-xl">
            Welcome, {invite?.patient?.first_name}!
          </CardTitle>
          <CardDescription>
            Johannesburg Infusion Centre has invited you to set up your patient account.
            Once registered, you'll be able to complete your onboarding forms online.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={invite?.email || ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>
          <Button
            onClick={handleRegister}
            disabled={registering}
            className="w-full"
          >
            {registering ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Create Account
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By creating an account, you agree to our terms of service.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
