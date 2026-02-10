import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function DoctorPatientView() {
  const { patientId } = useParams();
  const navigate = useNavigate();

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

  if (!patient) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {patient.first_name} {patient.last_name}
        </h1>
        <p className="text-muted-foreground">Treatment Summary (Read Only)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Treatment History</CardTitle>
        </CardHeader>
        <CardContent>
          {!treatments?.length ? (
            <p className="text-muted-foreground text-center py-8">No treatments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {treatments.map((t: any) => (
                <div key={t.id} className="p-3 border">
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
                    <Badge
                      className={
                        t.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-primary/10 text-primary"
                      }
                    >
                      {t.status}
                    </Badge>
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
    </div>
  );
}
