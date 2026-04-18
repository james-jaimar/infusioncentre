import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ArrowLeft, User, Activity, FileText, StickyNote, Send, FilePlus2 } from "lucide-react";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { PatientUpdateDialog } from "@/components/doctor/PatientUpdateDialog";
import { FollowUpReferralDialog } from "@/components/doctor/FollowUpReferralDialog";

export default function DoctorPatientView() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { data: doctor } = useDoctorProfile();
  const [updateOpen, setUpdateOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);

  const { data: patient } = useQuery({
    queryKey: ["doctor-patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!patientId,
  });

  const { data: courses } = useQuery({
    queryKey: ["doctor-patient-courses", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatment_courses")
        .select("*, appointment_types:treatment_type_id(name)")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  const { data: treatments } = useQuery({
    queryKey: ["doctor-patient-treatments", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treatments")
        .select("*, appointment_types:treatment_type_id(name)")
        .eq("patient_id", patientId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId,
  });

  const { data: reports } = useQuery({
    queryKey: ["doctor-patient-reports", patientId, doctor?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_reports")
        .select("*")
        .eq("patient_id", patientId!)
        .eq("doctor_id", doctor!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!patientId && !!doctor?.id,
  });

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {patient.first_name} {patient.last_name}
          </h1>
          <p className="text-muted-foreground">Patient Summary (Read Only — clinic owns the master record)</p>
        </div>
        {doctor?.id && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setUpdateOpen(true)} className="gap-2">
              <Send className="h-4 w-4" /> Send Update to Clinic
            </Button>
            <Button size="sm" onClick={() => setFollowUpOpen(true)} className="gap-2">
              <FilePlus2 className="h-4 w-4" /> Submit Follow-up Referral
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <User className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="courses" className="gap-2">
            <Activity className="h-4 w-4" /> Treatment Courses
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" /> Reports
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <StickyNote className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Email" value={patient.email} />
              <Field label="Phone" value={patient.phone} />
              <Field label="Date of Birth" value={patient.date_of_birth} />
              <Field
                label="Address"
                value={
                  [patient.address_line_1, patient.address_line_2, patient.city, patient.postal_code]
                    .filter(Boolean)
                    .join(", ")
                }
              />
              <Field label="Emergency Contact" value={patient.emergency_contact_name} />
              <Field label="Emergency Phone" value={patient.emergency_contact_phone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medical Aid</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Scheme" value={patient.medical_aid_name} />
              <Field label="Number" value={patient.medical_aid_number} />
              <Field label="Main Member" value={patient.medical_aid_main_member} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Treatment Courses</CardTitle>
            </CardHeader>
            <CardContent>
              {!courses?.length ? (
                <p className="text-muted-foreground text-center py-8">No treatment courses yet.</p>
              ) : (
                <div className="space-y-3">
                  {courses.map((c: any) => (
                    <div key={c.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {(c.appointment_types as any)?.name || "Course"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {c.sessions_completed || 0} of {c.total_sessions_planned || "—"} sessions
                          </p>
                        </div>
                        <Badge variant="outline">{c.status}</Badge>
                      </div>
                      {c.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{c.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Doctor Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {!reports?.length ? (
                <p className="text-muted-foreground text-center py-8">
                  No reports for this patient yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {reports.map((r: any) => (
                    <div key={r.id} className="border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{r.subject}</h3>
                        <Badge variant="outline">{r.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {r.milestone} ·{" "}
                        {r.sent_at
                          ? `Sent ${format(new Date(r.sent_at), "dd MMM yyyy")}`
                          : `Generated ${format(new Date(r.generated_at || r.created_at), "dd MMM yyyy")}`}
                      </p>
                      <Separator className="mb-3" />
                      <div
                        className="prose prose-sm max-w-none text-sm"
                        dangerouslySetInnerHTML={{ __html: r.body_html || r.body_text || "" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Treatment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!treatments?.length ? (
                <p className="text-muted-foreground text-center py-8">No treatments recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {treatments.map((t: any) => (
                    <div key={t.id} className="p-3 border rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {(t.appointment_types as any)?.name || "Treatment"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t.started_at
                              ? format(new Date(t.started_at), "dd MMM yyyy HH:mm")
                              : format(new Date(t.created_at), "dd MMM yyyy")}
                          </p>
                        </div>
                        <Badge variant="outline">{t.status}</Badge>
                      </div>
                      {t.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{t.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p>{value || <span className="text-muted-foreground italic">—</span>}</p>
    </div>
  );
}
