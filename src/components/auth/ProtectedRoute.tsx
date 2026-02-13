import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type AppRole = "admin" | "nurse" | "patient" | "doctor";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile && !profile.is_approved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // User is logged in but doesn't have the required role
    // Redirect to their appropriate dashboard
    const redirectPath = role === "admin" ? "/admin" : role === "nurse" ? "/nurse" : role === "doctor" ? "/doctor" : "/patient";
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
