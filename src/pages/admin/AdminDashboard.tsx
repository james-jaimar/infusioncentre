import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  {
    name: "Contact Submissions",
    href: "/admin/contacts",
    icon: MessageSquare,
    value: "—",
    description: "Unread enquiries",
  },
  {
    name: "Patients",
    href: "/admin/patients",
    icon: Users,
    value: "—",
    description: "Total registered",
  },
  {
    name: "Appointments",
    href: "/admin/appointments",
    icon: Calendar,
    value: "—",
    description: "This week",
  },
  {
    name: "Training Bookings",
    href: "/admin/training",
    icon: GraduationCap,
    value: "—",
    description: "Pending confirmation",
  },
];

export default function AdminDashboard() {
  const { profile } = useAuth();

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground">{greeting}</h1>
        <p className="mt-1 text-muted-foreground">
          Here's what's happening at The Johannesburg Infusion Centre
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">View Contact Submissions</CardTitle>
              <CardDescription>Review and respond to website enquiries</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/contacts"
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to Contacts →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Manage Patients</CardTitle>
              <CardDescription>View and edit patient records</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/patients"
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to Patients →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">View Schedule</CardTitle>
              <CardDescription>Check today's appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin/appointments"
                className="text-sm font-medium text-primary hover:underline"
              >
                Go to Calendar →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Placeholder for recent activity */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>Activity feed will appear here once you have data.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
