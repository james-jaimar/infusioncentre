import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";

function getRoleBasedPath(role: string | null): string {
  switch (role) {
    case "admin": return "/admin";
    case "nurse": return "/nurse";
    case "doctor": return "/doctor";
    case "patient": return "/patient";
    default: return "/";
  }
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signOut, user, role, profile, loading, mustChangePassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  useEffect(() => {
    if (!loading && user && profile) {
      if (!profile.is_approved) {
        toast({ variant: "destructive", title: "Account pending approval", description: "Your account is awaiting admin approval. Please contact the clinic." });
        signOut();
        navigate("/pending-approval", { replace: true });
        return;
      }
      if (role === "doctor") {
        // Check if doctor must change password
        supabase
          .from("doctors")
          .select("must_change_password")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.must_change_password) {
              navigate("/change-password", { replace: true });
            } else {
              navigate(from || "/doctor", { replace: true });
            }
          });
        return;
      }
      if (role) {
        const destination = from || getRoleBasedPath(role);
        navigate(destination, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, role, profile, loading, from, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ variant: "destructive", title: "Login failed", description: error.message });
      setIsLoading(false);
      return;
    }
    toast({ title: "Welcome back", description: "You have successfully logged in." });
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/">
            <img src={logo} alt="The Johannesburg Infusion Centre" className="h-16 w-auto mb-6" />
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Sign in</h1>
        </div>

        <div className="bg-card p-8 rounded-lg shadow-clinical-md border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                disabled={isLoading}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Register
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
            ← Back to website
          </Link>
        </div>
      </div>
    </div>
  );
}
