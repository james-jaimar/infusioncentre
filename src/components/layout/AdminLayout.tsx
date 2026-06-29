import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  GraduationCap,
  BarChart3,
  Menu,
  X,
  FileText,
  ClipboardList,
  Package,
  Mail,
  Monitor,
  Layers,
  Stethoscope,
  Receipt,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessages";
import { useReferralsAttentionCount } from "@/hooks/useReferralsAttentionCount";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Command Centre", href: "/admin/command-centre", icon: Monitor },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Contact Submissions", href: "/admin/contacts", icon: Mail },
  { name: "Patients", href: "/admin/patients", icon: Users },
  { name: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Referrals", href: "/admin/referrals", icon: FileText },
  { name: "Course Templates", href: "/admin/course-templates", icon: Layers },
  { name: "Form Templates", href: "/admin/form-templates", icon: ClipboardList },
  { name: "Staff", href: "/admin/staff", icon: Users },
  { name: "Training Bookings", href: "/admin/training", icon: GraduationCap },
  { name: "Billable Items", href: "/admin/billable-items", icon: Package },
  { name: "Communications", href: "/admin/communications", icon: Mail },
  { name: "Doctor Reports", href: "/admin/doctor-reports", icon: Stethoscope },
  { name: "Billing", href: "/admin/billing", icon: Receipt },
  { name: "Tenants", href: "/admin/tenants", icon: Building2 },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const { isSuperAdmin } = useTenant();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("admin.sidebar.collapsed") === "1";
  });
  useEffect(() => {
    try {
      window.localStorage.setItem("admin.sidebar.collapsed", desktopCollapsed ? "1" : "0");
    } catch {}
  }, [desktopCollapsed]);
  const unreadCount = useUnreadMessageCount();
  const referralAttention = useReferralsAttentionCount();
  const referralBadge = referralAttention.total;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`
    : "Admin";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-200 ease-in-out lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${desktopCollapsed ? "lg:hidden" : "lg:translate-x-0"}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={`flex items-center justify-between border-b border-primary-foreground/10 py-6 ${desktopCollapsed ? "px-2" : "px-5"}`}>
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <img src={logo} alt="Infusion Centre" className="h-10 w-auto" />
            </Link>
            <button
              className="lg:hidden text-primary-foreground h-12 w-12 flex items-center justify-center"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <button
              className="hidden lg:flex text-primary-foreground/70 hover:text-primary-foreground h-9 w-9 items-center justify-center rounded-md hover:bg-primary-foreground/10"
              onClick={() => setDesktopCollapsed((v) => !v)}
              title={desktopCollapsed ? "Expand menu" : "Collapse menu"}
              aria-label={desktopCollapsed ? "Expand menu" : "Collapse menu"}
            >
              {desktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  title={desktopCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-md ${desktopCollapsed ? "justify-center" : ""} ${
                    isActive
                      ? `bg-primary-foreground/15 text-primary-foreground ${desktopCollapsed ? "" : "border-l-4 border-primary-foreground ml-0 pl-2"}`
                      : "text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {!desktopCollapsed && item.name}
                  {!desktopCollapsed && item.name === "Messages" && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {!desktopCollapsed && item.name === "Referrals" && referralBadge > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {referralBadge > 99 ? "99+" : referralBadge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isSuperAdmin && (
              <div className="pt-3 mt-3 border-t border-primary-foreground/10">
                <Link
                  to="/platform"
                  title={desktopCollapsed ? "Platform Console" : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-amber-300 hover:bg-primary-foreground/8 hover:text-amber-200 rounded-md ${desktopCollapsed ? "justify-center" : ""}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Building2 className="h-4 w-4" />
                  {!desktopCollapsed && "Platform Console"}
                </Link>
              </div>
            )}
          </nav>

          {/* User section */}
          <div className={`border-t border-primary-foreground/10 ${desktopCollapsed ? "p-2" : "p-5"}`}>
            {!desktopCollapsed && (
              <div className="mb-3">
                <p className="font-medium text-sm text-primary-foreground">{displayName}</p>
                <p className="text-primary-foreground/50 text-xs mt-0.5">Administrator</p>
              </div>
            )}
            <Button
              variant="ghost"
              className={`w-full text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8 h-10 ${desktopCollapsed ? "justify-center px-0" : "justify-start"}`}
              onClick={handleSignOut}
              title={desktopCollapsed ? "Sign out" : undefined}
            >
              <LogOut className={desktopCollapsed ? "h-4 w-4" : "mr-2 h-4 w-4"} />
              {!desktopCollapsed && "Sign out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card/95 backdrop-blur px-4 lg:hidden shadow-clinical-sm">
          <button onClick={() => setSidebarOpen(true)} className="h-12 w-12 flex items-center justify-center">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-foreground">Administration</span>
        </header>

        {/* Floating desktop sidebar toggle */}
        <button
          onClick={() => setDesktopCollapsed((v) => !v)}
          className="hidden lg:flex fixed top-3 left-3 z-40 h-9 w-9 items-center justify-center rounded-md bg-card/90 backdrop-blur border shadow-clinical-sm text-foreground/70 hover:text-foreground hover:bg-muted"
          style={!desktopCollapsed ? { left: "calc(16rem + 0.5rem)" } : undefined}
          title={desktopCollapsed ? "Show menu" : "Hide menu"}
          aria-label={desktopCollapsed ? "Show menu" : "Hide menu"}
        >
          {desktopCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 lg:pt-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
