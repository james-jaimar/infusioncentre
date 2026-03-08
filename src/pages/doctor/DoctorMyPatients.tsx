import { useDoctorProfile } from "@/hooks/useDoctors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Users, Activity } from "lucide-react";
import { useState } from "react";

export default function DoctorMyPatients() {
  const { data: doctor } = useDoctorProfile();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  // Get all patients this doctor has referred (via referrals with patient_id linked)
  const { data: patients, isLoading } = useQuery({
    queryKey: ["doctor-my-patients", doctor?.id],
    queryFn: async () => {
      // Get referrals with linked patients
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("patient_id, patient_first_name, patient_last_name, patient_email, status, created_at")
        .eq("doctor_id", doctor!.id)
        .not("patient_id", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Deduplicate by patient_id
      const patientMap = new Map<string, any>();
      for (const r of referrals || []) {
        if (r.patient_id && !patientMap.has(r.patient_id)) {
          patientMap.set(r.patient_id, r);
        }
      }

      const patientIds = Array.from(patientMap.keys());
      if (!patientIds.length) return [];

      // Fetch patient details + treatment courses
      const { data: patientDetails } = await supabase
        .from("patients")
        .select("id, first_name, last_name, email, phone, status")
        .in("id", patientIds);

      const { data: courses } = await supabase
        .from("treatment_courses")
        .select("id, patient_id, status, sessions_completed, total_sessions_planned, created_at, appointment_types!treatment_courses_treatment_type_id_fkey(name)")
        .eq("doctor_id", doctor!.id)
        .order("created_at", { ascending: false });

      return (patientDetails || []).map((p: any) => ({
        ...p,
        courses: (courses || []).filter((c: any) => c.patient_id === p.id),
        referral: patientMap.get(p.id),
      }));
    },
    enabled: !!doctor?.id,
  });

  const filtered = patients?.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">My Patients</h1>
          <p className="text-muted-foreground">Patients you've referred to the clinic</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search patients..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No linked patients yet. Patients will appear here once your referrals are processed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((patient: any) => (
            <Card key={patient.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    >
                      {patient.first_name} {patient.last_name}
                    </h3>
                    <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                      {patient.email && <p>{patient.email}</p>}
                      {patient.phone && <p>{patient.phone}</p>}
                    </div>
                  </div>
                  <Badge variant={patient.status === "active" ? "default" : "secondary"}>
                    {patient.status || "active"}
                  </Badge>
                </div>

                {patient.courses.length > 0 ? (
                  <div className="space-y-2 mt-3 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Treatment Courses
                    </p>
                    {patient.courses.map((c: any) => {
                      const progress = c.total_sessions_planned > 0
                        ? Math.round((c.sessions_completed / c.total_sessions_planned) * 100)
                        : 0;
                      return (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 p-2 rounded bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => navigate(`/doctor/courses/${c.id}`)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {c.appointment_types?.name || "Treatment"}
                            </p>
                          </div>
                          <Progress value={progress} className="h-2 w-24" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {c.sessions_completed}/{c.total_sessions_planned}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {c.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2 italic">No treatment courses yet</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
