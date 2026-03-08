import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  CreditCard,
  ScrollText,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { getImpersonatedTenantId } from "@/hooks/usePlatformAdmin";

const navigation = [
  { name: "Dashboard", href: "/platform", icon: LayoutDashboard },
  { name: "Tenants", href: "/platform/tenants", icon: Building2 },
  { name: "Users", href: "/platform/users", icon: Users },
  { name: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard },
  { name: "Audit Log", href: "/platform/audit-log", icon: ScrollText },
  { name: "Platform Settings", href: "/platform/settings", icon: Settings },
];

export default function PlatformLayout() {
  const { profile, signOut } = useAuth();
  const { isSuperAdmin } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const impersonatedId = getImpersonatedTenantId();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`
    : "Platform Admin";

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-destructive opacity-60" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">Platform administration requires super-admin privileges.</p>
          <Button onClick={() => navigate("/admin")}>Go to Admin</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 text-amber-400" />
              <div>
                <p className="font-bold text-sm">Platform Admin</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Super Console</p>
              </div>
            </div>
            <button className="lg:hidden text-white h-12 w-12 flex items-center justify-center" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          {impersonatedId && (
            <div className="mx-3 mt-3 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-md">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">Impersonating Tenant</p>
              <Button variant="ghost" size="sm" className="w-full mt-1 text-amber-300 hover:text-white h-7 text-xs" onClick={() => { sessionStorage.removeItem("impersonated_tenant_id"); window.location.reload(); }}>
                <ArrowLeft className="h-3 w-3 mr-1" /> Exit Impersonation
              </Button>
            </div>
          )}

          <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/platform" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-md ${
                    isActive
                      ? "bg-white/15 text-white border-l-4 border-amber-400 ml-0 pl-2"
                      : "text-white/60 hover:bg-white/8 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-white/10">
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-white/40 hover:text-white hover:bg-white/8 rounded-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Tenant Admin
              </Link>
            </div>
          </nav>

          <div className="border-t border-white/10 p-5">
            <div className="mb-3">
              <p className="font-medium text-sm text-white">{displayName}</p>
              <Badge variant="outline" className="mt-1 text-[10px] border-amber-400/50 text-amber-400">Super Admin</Badge>
            </div>
            <Button variant="ghost" className="w-full justify-start text-white/50 hover:text-white hover:bg-white/8 h-10" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 backdrop-blur px-4 lg:hidden shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="h-12 w-12 flex items-center justify-center">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-foreground">Platform Administration</span>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
