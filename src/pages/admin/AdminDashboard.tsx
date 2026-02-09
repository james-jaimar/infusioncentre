import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, GraduationCap, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      const [contacts, patients, weekAppointments, todayAppointments] = await Promise.all([
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_start", weekStart).lte("scheduled_start", weekEnd),
        supabase.from("appointments").select("id, status, scheduled_start, patient:patients!inner(first_name, last_name), appointment_type:appointment_types!inner(name)").gte("scheduled_start", todayStart).lte("scheduled_start", todayEnd).order("scheduled_start", { ascending: true }).limit(5),
      ]);

      return {
        unreadContacts: contacts.count || 0,
        totalPatients: patients.count || 0,
        weekAppointments: weekAppointments.count || 0,
        todayAppointments: todayAppointments.data || [],
      };
    },
    refetchInterval: 60000,
  });
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { data: stats } = useDashboardStats();

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  const statCards = [
    {
      name: "Contact Submissions",
      href: "/admin/contacts",
      icon: MessageSquare,
      value: stats?.unreadContacts ?? "—",
      description: "Unread enquiries",
    },
    {
      name: "Patients",
      href: "/admin/patients",
      icon: Users,
      value: stats?.totalPatients ?? "—",
      description: "Active patients",
    },
    {
      name: "Appointments",
      href: "/admin/appointments",
      icon: Calendar,
      value: stats?.weekAppointments ?? "—",
      description: "This week",
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: Activity,
      value: "→",
      description: "View analytics",
    },
  ];

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
        {statCards.map((stat) => (
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
              <Link to="/admin/contacts" className="text-sm font-medium text-primary hover:underline">
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
              <Link to="/admin/patients" className="text-sm font-medium text-primary hover:underline">
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
              <Link to="/admin/appointments" className="text-sm font-medium text-primary hover:underline">
                Go to Calendar →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
        <Card>
          {stats?.todayAppointments?.length ? (
            <CardContent className="p-0">
              <div className="divide-y">
                {stats.todayAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{apt.appointment_type.name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(apt.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          ) : (
            <CardContent className="py-8 text-center text-muted-foreground">
              No appointments scheduled for today.
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
