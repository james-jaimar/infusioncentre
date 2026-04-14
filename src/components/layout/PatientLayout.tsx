import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useUnreadMessageCount } from "@/hooks/useUnreadMessages";

const navigation = [
  { name: "Dashboard", href: "/patient", icon: LayoutDashboard },
  { name: "My Appointments", href: "/patient/appointments", icon: Calendar },
  { name: "My Records", href: "/patient/records", icon: FileText },
  { name: "Messages", href: "/patient/messages", icon: MessageCircle },
  { name: "My Profile", href: "/patient/profile", icon: User },
];

export default function PatientLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const unreadCount = useUnreadMessageCount();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`
    : "Patient";

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/50 lg:hidden"
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
          <div className="flex items-center justify-between px-4 py-6">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Infusion Centre" className="h-10 w-auto" />
            </Link>
            <button
              className="lg:hidden text-primary-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                  {item.name === "Messages" && unreadCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-primary-foreground/20 p-4">
            <div className="mb-3 text-sm">
              <p className="font-medium text-primary-foreground">{displayName}</p>
              <p className="text-primary-foreground/60 text-xs">Patient</p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold">Patient Portal</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
