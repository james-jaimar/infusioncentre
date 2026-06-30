import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Calendar, Activity, Layers, FileText, ArrowRight, UserPlus, ClipboardList, CalendarPlus, CheckCircle2, Stethoscope } from "lucide-react";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, formatDistanceToNow, addDays } from "date-fns";
import { useActivePatientsWithCourses } from "@/hooks/useTreatmentCourses";
import { TreatmentCourseChip } from "@/components/shared/TreatmentCourseChip";
import { useReferralsAttentionCount } from "@/hooks/useReferralsAttentionCount";
import { usePatientPipelineCounts } from "@/hooks/usePatientPipelineCounts";
import { STAGE_LABEL } from "@/lib/patientPipeline";
import { getChairColor } from "@/lib/chairColors";

function useDashboardStats() {
  return useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 }).toISOString();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const tomorrow = addDays(now, 1);
      const tomorrowStart = startOfDay(tomorrow).toISOString();
      const tomorrowEnd = endOfDay(tomorrow).toISOString();

      const [contacts, patients, weekAppointments, todayAppointments, tomorrowAppointments, activeCourses] = await Promise.all([
        supabase.from("contact_submissions").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("scheduled_start", weekStart).lte("scheduled_start", weekEnd),
        supabase.from("appointments").select("id, status, scheduled_start, patient_confirmed_at, chair:treatment_chairs(name, display_order), patient:patients!inner(first_name, last_name, referring_doctor_name, referring_doctor_practice), appointment_type:appointment_types!inner(name)").gte("scheduled_start", todayStart).lte("scheduled_start", todayEnd).order("scheduled_start", { ascending: true }),
        supabase.from("appointments").select("id, status, scheduled_start, patient_confirmed_at, chair:treatment_chairs(name, display_order), patient:patients!inner(first_name, last_name, referring_doctor_name, referring_doctor_practice), appointment_type:appointment_types!inner(name)").gte("scheduled_start", tomorrowStart).lte("scheduled_start", tomorrowEnd).order("scheduled_start", { ascending: true }),
        supabase.from("treatment_courses").select("id", { count: "exact", head: true }).in("status", ["draft", "active", "ready"] as any),
      ]);

      const sortByTimeThenChair = (a: any, b: any) => {
        const t = new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
        if (t !== 0) return t;
        const ao = a.chair?.display_order ?? 9999;
        const bo = b.chair?.display_order ?? 9999;
        return ao - bo;
      };

      return {
        unreadContacts: contacts.count || 0,
        totalPatients: patients.count || 0,
        weekAppointments: weekAppointments.count || 0,
        todayAppointments: (todayAppointments.data || []).slice().sort(sortByTimeThenChair),
        tomorrowAppointments: (tomorrowAppointments.data || []).slice().sort(sortByTimeThenChair),
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
  const attention = useReferralsAttentionCount();
  const { data: pipeline } = usePatientPipelineCounts();

  const greeting = profile?.first_name ? `Welcome back, ${profile.first_name}` : "Welcome back";

  const statCards = [
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

      {attention.total > 0 && (
        <Card className="border-clinical-warning/40 bg-clinical-warning-soft mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex items-center gap-3 mr-2">
                <div className="h-10 w-10 rounded-md bg-clinical-warning/20 text-clinical-warning flex items-center justify-center">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Referrals needing attention</p>
                  <p className="text-xs text-muted-foreground">Workflow steps that aren't finished yet</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                {attention.awaiting_triage > 0 && (
                  <Link
                    to="/admin/referrals?attention=awaiting_triage"
                    className="inline-flex items-center gap-2 rounded-md border border-clinical-warning/40 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <FileText className="h-4 w-4 text-clinical-warning" />
                    <span className="tabular-nums">{attention.awaiting_triage}</span>
                    <span className="text-muted-foreground">to triage</span>
                  </Link>
                )}
                {attention.needs_patient > 0 && (
                  <Link
                    to="/admin/referrals?attention=needs_patient"
                    className="inline-flex items-center gap-2 rounded-md border border-clinical-warning/40 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-clinical-warning" />
                    <span className="tabular-nums">{attention.needs_patient}</span>
                    <span className="text-muted-foreground">need patient</span>
                  </Link>
                )}
                {attention.needs_course > 0 && (
                  <Link
                    to="/admin/referrals?attention=needs_course"
                    className="inline-flex items-center gap-2 rounded-md border border-clinical-warning/40 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <ClipboardList className="h-4 w-4 text-clinical-warning" />
                    <span className="tabular-nums">{attention.needs_course}</span>
                    <span className="text-muted-foreground">need course setup</span>
                  </Link>
                )}
                {attention.needs_scheduling > 0 && (
                  <Link
                    to="/admin/referrals?attention=needs_scheduling"
                    className="inline-flex items-center gap-2 rounded-md border border-clinical-warning/40 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                  >
                    <CalendarPlus className="h-4 w-4 text-clinical-warning" />
                    <span className="tabular-nums">{attention.needs_scheduling}</span>
                    <span className="text-muted-foreground">need session scheduling</span>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {pipeline && pipeline.total_active > 0 && (
        <Card className="border-clinical-info/40 bg-clinical-info-soft mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex items-center gap-3 mr-2">
                <div className="h-10 w-10 rounded-md bg-clinical-info/20 text-clinical-info flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Patient pipeline</p>
                  <p className="text-xs text-muted-foreground">Where each patient is in their journey</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                {(["needs_invite","invite_sent","onboarding","ready_to_schedule"] as const).map((key) => {
                  const value = pipeline[key];
                  if (!value) return null;
                  return (
                    <Link
                      key={key}
                      to={`/admin/patients?stage=${key}`}
                      className="inline-flex items-center gap-2 rounded-md border border-clinical-info/40 bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                    >
                      <span className="tabular-nums">{value}</span>
                      <span className="text-muted-foreground">{STAGE_LABEL[key].toLowerCase()}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's & Tomorrow's Appointments */}
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <AppointmentsPanel title="Today's Appointments" emptyText="No appointments scheduled for today." items={stats?.todayAppointments || []} />
        <AppointmentsPanel title="Tomorrow's Appointments" emptyText="No appointments scheduled for tomorrow." items={stats?.tomorrowAppointments || []} />
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-3">
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
        <div className="grid gap-4 md:grid-cols-2">
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

      {/* Active Patients */}
      <div className="mt-8">
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
  );
}

function AppointmentsPanel({ title, emptyText, items }: { title: string; emptyText: string; items: any[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <Card>
        {items.length ? (
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {items.map((apt: any) => (
                <Link
                  key={apt.id}
                  to={`/admin/appointments/${apt.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground truncate">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      {apt.patient_confirmed_at ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-clinical-success-soft text-clinical-success px-2 py-0.5 text-[11px] font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Confirmed
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                          Awaiting confirmation
                        </span>
                      )}
                      {apt.chair?.name && (() => {
                        const c = getChairColor({ id: apt.chair_id ?? null, display_order: apt.chair?.display_order ?? null });
                        return (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                            {apt.chair.name}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">{apt.appointment_type.name}</p>
                    {(apt.patient.referring_doctor_name || apt.patient.referring_doctor_practice) && (
                      <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1 truncate">
                        <Stethoscope className="h-3 w-3" />
                        {apt.patient.referring_doctor_name || "—"}
                        {apt.patient.referring_doctor_practice ? ` · ${apt.patient.referring_doctor_practice}` : ""}
                      </p>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground font-mono tabular-nums shrink-0">
                    {new Date(apt.scheduled_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        ) : (
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {emptyText}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
