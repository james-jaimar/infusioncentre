import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ArrowLeft, Activity, Calendar, FileText } from "lucide-react";

const courseStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  onboarding: "bg-yellow-100 text-yellow-800",
  ready: "bg-blue-100 text-blue-800",
  active: "bg-primary/10 text-primary",
  paused: "bg-orange-100 text-orange-800",
  completing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function DoctorPatientProgress() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data: doctor } = useDoctorProfile();

  const { data: course, isLoading } = useQuery({
    queryKey: ["doctor-course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_courses")
        .select(`
          *,
          patients!treatment_courses_patient_id_fkey(first_name, last_name),
          appointment_types!treatment_courses_treatment_type_id_fkey(name)
        `)
        .eq("id", courseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!courseId,
  });

  const { data: appointments } = useQuery({
    queryKey: ["doctor-course-appointments", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, scheduled_start, status, session_number")
        .eq("treatment_course_id", courseId!)
        .order("session_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!courseId,
  });

  if (isLoading || !course) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const patient = course.patients as any;
  const treatmentType = (course.appointment_types as any)?.name || "Treatment";
  const progress = course.total_sessions_planned > 0
    ? Math.round((course.sessions_completed / course.total_sessions_planned) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {patient?.first_name} {patient?.last_name}
          </h1>
          <p className="text-muted-foreground">{treatmentType} — Treatment Progress</p>
        </div>
        <Badge className={courseStatusColors[course.status] || ""}>
          {course.status}
        </Badge>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" /> Course Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{course.sessions_completed} of {course.total_sessions_planned} sessions</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="text-sm">
              <span className="text-muted-foreground block">Started</span>
              <span className="font-medium">
                {course.started_at ? format(new Date(course.started_at), "dd MMM yyyy") : "Not started"}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground block">Expected End</span>
              <span className="font-medium">
                {course.expected_end_date ? format(new Date(course.expected_end_date), "dd MMM yyyy") : "TBD"}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground block">Completed</span>
              <span className="font-medium">
                {course.completed_at ? format(new Date(course.completed_at), "dd MMM yyyy") : "In progress"}
              </span>
            </div>
          </div>

          {course.notes && (
            <div className="pt-2 text-sm">
              <span className="text-muted-foreground block">Notes</span>
              <p>{course.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" /> Session Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!appointments?.length ? (
            <p className="text-muted-foreground text-center py-4">No sessions scheduled yet.</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((appt: any) => (
                <div key={appt.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {appt.session_number || "—"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(appt.scheduled_start), "EEEE, dd MMM yyyy")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(appt.scheduled_start), "HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={
                      appt.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : appt.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {appt.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
