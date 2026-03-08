import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Command Centre", href: "/admin/command-centre", icon: Monitor },
  { name: "Contact Submissions", href: "/admin/contacts", icon: MessageSquare },
  { name: "Patients", href: "/admin/patients", icon: Users },
  { name: "Appointments", href: "/admin/appointments", icon: Calendar },
  { name: "Referrals", href: "/admin/referrals", icon: FileText },
  { name: "Treatment Courses", href: "/admin/treatment-courses", icon: Layers },
  { name: "Form Templates", href: "/admin/form-templates", icon: ClipboardList },
  { name: "Staff", href: "/admin/staff", icon: Users },
  { name: "Training Bookings", href: "/admin/training", icon: GraduationCap },
  { name: "Billable Items", href: "/admin/billable-items", icon: Package },
  { name: "Communications", href: "/admin/communications", icon: Mail },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-6 border-b border-primary-foreground/10">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Infusion Centre" className="h-10 w-auto" />
            </Link>
            <button
              className="lg:hidden text-primary-foreground h-12 w-12 flex items-center justify-center"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-md ${
                    isActive
                      ? "bg-primary-foreground/15 text-primary-foreground border-l-4 border-primary-foreground ml-0 pl-2"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/8 hover:text-primary-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-primary-foreground/10 p-5">
            <div className="mb-3">
              <p className="font-medium text-sm text-primary-foreground">{displayName}</p>
              <p className="text-primary-foreground/50 text-xs mt-0.5">Administrator</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/8 h-10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
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

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
