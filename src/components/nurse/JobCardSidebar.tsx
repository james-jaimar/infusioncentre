import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import TreatmentHistory from "./TreatmentHistory";
import {
  ChevronDown,
  Phone,
  UserCircle,
  Stethoscope,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

interface JobCardSidebarProps {
  patientId: string;
  patient: {
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    emergency_contact_relationship?: string | null;
    referring_doctor_name?: string | null;
    referring_doctor_phone?: string | null;
    medical_aid_name?: string | null;
    medical_aid_number?: string | null;
    medical_aid_plan?: string | null;
  };
}

export default function JobCardSidebar({ patientId, patient }: JobCardSidebarProps) {
  const { data: medHistory } = usePatientMedicalHistory(patientId);
  const { data: checklist } = useOnboardingChecklist(patientId);
  const [medOpen, setMedOpen] = useState(true);

  const completedForms = checklist?.filter((c) => c.status === "completed").length || 0;
  const totalForms = checklist?.length || 0;
  const progressPct = totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Patient Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCircle className="h-4 w-4" /> Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {patient.emergency_contact_name && (
            <div>
              <p className="text-xs text-muted-foreground">Emergency Contact</p>
              <p className="font-medium">{patient.emergency_contact_name} ({patient.emergency_contact_relationship})</p>
              {patient.emergency_contact_phone && (
                <a href={`tel:${patient.emergency_contact_phone}`} className="flex items-center gap-1 text-primary text-sm py-1 min-h-[44px]">
                  <Phone className="h-3 w-3" /> {patient.emergency_contact_phone}
                </a>
              )}
            </div>
          )}
          {patient.referring_doctor_name && (
            <div>
              <p className="text-xs text-muted-foreground">Referring Doctor</p>
              <p className="font-medium">{patient.referring_doctor_name}</p>
            </div>
          )}
          {patient.medical_aid_name && (
            <div>
              <p className="text-xs text-muted-foreground">Medical Aid</p>
              <p className="font-medium">{patient.medical_aid_name} {patient.medical_aid_plan ? `(${patient.medical_aid_plan})` : ""}</p>
              {patient.medical_aid_number && <p className="text-xs">#{patient.medical_aid_number}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Flags */}
      <Collapsible open={medOpen} onOpenChange={setMedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors min-h-[48px]">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4" /> Medical Flags
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${medOpen ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3 text-sm">
              {/* Allergies */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Allergies</p>
                {medHistory?.allergies?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {medHistory.allergies.map((a, i) => (
                      <Badge key={i} variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" /> {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">NKDA</p>
                )}
              </div>

              {/* Chronic Conditions */}
              {medHistory?.chronic_conditions?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-1">
                    {medHistory.chronic_conditions.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Current Medications */}
              {medHistory?.current_medications?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Medications</p>
                  <ul className="text-xs space-y-0.5">
                    {medHistory.current_medications.map((m, i) => (
                      <li key={i}>{m.name} — {m.dosage} ({m.frequency})</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Onboarding Status */}
      {totalForms > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" /> Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground">{completedForms}/{totalForms} forms completed</p>
            <div className="space-y-1">
              {checklist?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className={item.status === "completed" ? "text-primary" : "text-muted-foreground"}>
                    {item.form_templates?.name || "Form"}
                  </span>
                  <Badge variant={item.status === "completed" ? "default" : "outline"} className="text-xs h-5">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Treatment History */}
      <TreatmentHistory patientId={patientId} />
    </div>
  );
}
