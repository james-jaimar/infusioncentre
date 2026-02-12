import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      return;
    }

    supabase.functions
      .invoke("password-reset", { body: { action: "validate", token } })
      .then(({ data, error }) => {
        if (!error && data?.valid) {
          setIsValidToken(true);
        }
        setIsValidating(false);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.functions.invoke("password-reset", {
      body: { action: "reset", token, password },
    });

    if (error || data?.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: data?.error || "Failed to reset password. The link may have expired.",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Password updated",
      description: "Your password has been successfully reset.",
    });

    navigate("/login");
  }

  if (isValidating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8 flex flex-col items-center">
            <Link to="/">
              <img src={logo} alt="The Johannesburg Infusion Centre" className="h-20 w-auto mb-4" />
            </Link>
          </div>

          <div className="bg-card p-8 shadow-sm">
            <h1 className="text-xl font-semibold text-foreground mb-2">Invalid or expired link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full">Request new link</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/">
            <img src={logo} alt="The Johannesburg Infusion Centre" className="h-20 w-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Set new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        <div className="bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
