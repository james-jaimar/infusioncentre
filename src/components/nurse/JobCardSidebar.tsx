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
    <div className="space-y-4">
      {/* Patient Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-muted-foreground" /> Patient Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {patient.emergency_contact_name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Emergency Contact</p>
              <p className="font-medium mt-0.5">{patient.emergency_contact_name} ({patient.emergency_contact_relationship})</p>
              {patient.emergency_contact_phone && (
                <a href={`tel:${patient.emergency_contact_phone}`} className="flex items-center gap-1.5 text-primary text-sm py-1.5 min-h-[44px]">
                  <Phone className="h-4 w-4" /> {patient.emergency_contact_phone}
                </a>
              )}
            </div>
          )}
          {patient.referring_doctor_name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Referring Doctor</p>
              <p className="font-medium mt-0.5">{patient.referring_doctor_name}</p>
            </div>
          )}
          {patient.medical_aid_name && (
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Medical Aid</p>
              <p className="font-medium mt-0.5">{patient.medical_aid_name} {patient.medical_aid_plan ? `(${patient.medical_aid_plan})` : ""}</p>
              {patient.medical_aid_number && <p className="text-xs text-muted-foreground mt-0.5">#{patient.medical_aid_number}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical Flags */}
      <Collapsible open={medOpen} onOpenChange={setMedOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors min-h-[48px]">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" /> Medical Flags
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${medOpen ? "rotate-180" : ""}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Allergies</p>
                {medHistory?.allergies?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {medHistory.allergies.map((a, i) => (
                      <Badge key={i} variant="danger" className="text-xs gap-1">
                        <AlertTriangle className="h-3 w-3" /> {a}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">NKDA</p>
                )}
              </div>

              {medHistory?.chronic_conditions?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {medHistory.chronic_conditions.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {medHistory?.current_medications?.length ? (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Current Medications</p>
                  <ul className="text-sm space-y-1">
                    {medHistory.current_medications.map((m, i) => (
                      <li key={i} className="text-muted-foreground">{m.name} — {m.dosage} ({m.frequency})</li>
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
              <FileText className="h-4 w-4 text-muted-foreground" /> Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={progressPct} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{completedForms}/{totalForms} forms completed</p>
            <div className="space-y-1.5">
              {checklist?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className={item.status === "completed" ? "text-clinical-success" : "text-muted-foreground"}>
                    {item.form_templates?.name || "Form"}
                  </span>
                  <Badge variant={item.status === "completed" ? "success" : "outline"} className="text-xs">
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
