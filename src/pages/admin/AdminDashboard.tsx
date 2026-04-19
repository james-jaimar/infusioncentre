import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, Activity, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, formatDistanceToNow } from "date-fns";
import { useActivePatientsWithCourses } from "@/hooks/useTreatmentCourses";
import { TreatmentCourseChip } from "@/components/shared/TreatmentCourseChip";

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();

      const [contacts, patients, weekAppointments, todayAppointments, activeCourses] = await Promise.all([
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_start", weekStart).lte("scheduled_start", weekEnd),
        supabase.from("appointments").select("id, status, scheduled_start, patient:patients!inner(first_name, last_name), appointment_type:appointment_types!inner(name)").gte("scheduled_start", todayStart).lte("scheduled_start", todayEnd).order("scheduled_start", { ascending: true }).limit(5),
        supabase.from("treatment_courses").select("id", { count: "exact", head: true }).in("status", ["draft", "active", "ready"] as any),
      ]);

      return {
        unreadContacts: contacts.count || 0,
        totalPatients: patients.count || 0,
        weekAppointments: weekAppointments.count || 0,
        todayAppointments: todayAppointments.data || [],
        activeCourses: activeCourses.count || 0,
      };
    },
    refetchInterval: 60000,
  });
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { data: stats } = useDashboardStats();
  const { data: activePatients } = useActivePatientsWithCourses(8);

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  const statCards = [
    { name: "Contact Submissions", href: "/admin/contacts", icon: MessageSquare, value: stats?.unreadContacts ?? "—", description: "Unread enquiries", variant: "info" as const },
    { name: "Patients", href: "/admin/patients", icon: Users, value: stats?.totalPatients ?? "—", description: "Active patients", variant: "success" as const },
    { name: "Active Courses", href: "/admin/patients?state=has_active", icon: Layers, value: stats?.activeCourses ?? "—", description: "Treatment courses underway", variant: "warning" as const },
    { name: "Appointments", href: "/admin/appointments", icon: Calendar, value: stats?.weekAppointments ?? "—", description: "This week", variant: "neutral" as const },
  ];

  const stateClasses: Record<string, string> = {
    info: "bg-clinical-info-soft text-clinical-info",
    success: "bg-clinical-success-soft text-clinical-success",
    warning: "bg-clinical-warning-soft text-clinical-warning",
    neutral: "bg-clinical-neutral-soft text-clinical-neutral",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">{greeting}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening at The Johannesburg Infusion Centre
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} to={stat.href}>
            <Card className="hover:shadow-clinical-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`h-9 w-9 rounded-md flex items-center justify-center ${stateClasses[stat.variant]}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
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

      {/* Today's Appointments + Active Patients */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's Appointments</h2>
          <Card>
            {stats?.todayAppointments?.length ? (
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {stats.todayAppointments.map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-foreground">
                          {apt.patient.first_name} {apt.patient.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{apt.appointment_type.name}</p>
                      </div>
                      <span className="text-sm text-muted-foreground font-mono tabular-nums">
                        {new Date(apt.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            ) : (
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No appointments scheduled for today.
              </CardContent>
            )}
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Active Patients</h2>
            <Link
              to="/admin/patients?state=has_active"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <Card>
            {activePatients?.length ? (
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {activePatients.map((c: any) => (
                    <Link
                      key={c.id}
                      to={`/admin/patients/${c.patient?.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {c.patient?.first_name} {c.patient?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <TreatmentCourseChip
                        typeName={c.appointment_type?.name ?? "Course"}
                        color={c.appointment_type?.color}
                        sessionsCompleted={c.sessions_completed}
                        totalSessions={c.total_sessions_planned}
                        status={c.status}
                      />
                    </Link>
                  ))}
                </div>
              </CardContent>
            ) : (
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No active treatment courses yet.
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
