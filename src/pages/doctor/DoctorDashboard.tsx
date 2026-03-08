import { useDoctorProfile } from "@/hooks/useDoctors";
import { useReferrals } from "@/hooks/useReferrals";
import { useDoctorReports } from "@/hooks/useDoctorReports";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  FileText, PlusCircle, Clock, CheckCircle, AlertCircle, Activity, ClipboardList,
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function DoctorDashboard() {
  const { data: doctor, isLoading: loadingDoctor } = useDoctorProfile();
  const { data: referrals, isLoading: loadingReferrals } = useReferrals(doctor?.id);
  const { data: reports } = useDoctorReports({ doctorId: doctor?.id });
  const navigate = useNavigate();

  // Fetch treatment courses for this doctor
  const { data: courses } = useQuery({
    queryKey: ["doctor-courses", doctor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_courses")
        .select(`
          *,
          patients!treatment_courses_patient_id_fkey(first_name, last_name),
          appointment_types!treatment_courses_treatment_type_id_fkey(name)
        `)
        .eq("doctor_id", doctor!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!doctor?.id,
  });

  const pending = referrals?.filter((r: any) => r.status === "pending").length || 0;
  const accepted = referrals?.filter((r: any) => r.status === "accepted" || r.status === "scheduled").length || 0;
  const unreadReports = reports?.filter(r => r.status === "sent").length || 0;

  if (loadingDoctor || loadingReferrals) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Doctor Dashboard</h1>
          {doctor?.practice_name && (
            <p className="text-muted-foreground">{doctor.practice_name}</p>
          )}
        </div>
        <Button onClick={() => navigate("/doctor/referrals/new")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> New Referral
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 shrink-0">
              <Clock className="h-6 w-6 text-yellow-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pending}</p>
              <p className="text-sm text-muted-foreground">Pending Referrals</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{accepted}</p>
              <p className="text-sm text-muted-foreground">Active Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate("/doctor/reports")}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 shrink-0">
              <ClipboardList className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{unreadReports}</p>
              <p className="text-sm text-muted-foreground">Unread Reports</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Treatment Courses */}
      {courses && courses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" /> Patient Treatment Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courses.map((c: any) => {
                const progress = c.total_sessions_planned > 0
                  ? Math.round((c.sessions_completed / c.total_sessions_planned) * 100)
                  : 0;
                return (
                  <div
                    key={c.id}
                    className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/doctor/courses/${c.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {c.patients?.first_name} {c.patients?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {c.appointment_types?.name || "Treatment"}
                        </p>
                      </div>
                      <Badge className={
                        c.status === "completed" ? "bg-green-100 text-green-800"
                        : c.status === "active" ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                      }>
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.sessions_completed}/{c.total_sessions_planned}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Recent Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!referrals?.length ? (
            <p className="text-muted-foreground text-center py-8">
              No referrals yet. Submit your first referral to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.slice(0, 10).map((ref: any) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/doctor/referrals`)}
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {ref.patient_first_name} {ref.patient_last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {ref.treatment_requested || ref.diagnosis || "No details"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[ref.status] || ""}>{ref.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ref.created_at), "dd MMM yyyy")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
