import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, User, Armchair } from "lucide-react";
import { differenceInYears, format } from "date-fns";

interface JobCardHeaderProps {
  patient: {
    first_name: string;
    last_name: string;
    date_of_birth?: string | null;
    phone?: string | null;
    gender?: string | null;
    medical_aid_name?: string | null;
    medical_aid_number?: string | null;
  };
  appointmentType: { name: string; color: string };
  scheduledStart: string;
  scheduledEnd: string;
  chairName?: string | null;
  allergies?: string[] | null;
  treatmentStatus?: string;
}

const statusVariantMap: Record<string, "success" | "info" | "warning" | "neutral" | "outline"> = {
  in_progress: "success",
  pre_assessment: "info",
  post_assessment: "warning",
  completed: "neutral",
  checked_in: "info",
  scheduled: "outline",
  confirmed: "outline",
};

export default function JobCardHeader({
  patient,
  appointmentType,
  scheduledStart,
  scheduledEnd,
  chairName,
  allergies,
  treatmentStatus,
}: JobCardHeaderProps) {
  const age = patient.date_of_birth
    ? differenceInYears(new Date(), new Date(patient.date_of_birth))
    : null;

  const hasAllergies = allergies && allergies.length > 0;
  const statusVariant = treatmentStatus ? statusVariantMap[treatmentStatus] || "outline" : "outline";

  return (
    <div className="space-y-2">
      {/* Allergy alert banner */}
      {hasAllergies && (
        <div className="flex items-center gap-2 rounded-lg bg-clinical-danger-soft border border-clinical-danger/20 px-4 py-2.5">
          <AlertTriangle className="h-5 w-5 text-clinical-danger shrink-0" />
          <p className="text-sm font-semibold text-clinical-danger">
            ALLERGIES: {allergies.join(", ")}
          </p>
        </div>
      )}

      <div className="rounded-lg border bg-card p-5 shadow-clinical-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {/* Patient info */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/8 shrink-0">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground leading-tight">
                {patient.first_name} {patient.last_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {age !== null ? `Age ${age}` : "DOB not recorded"}
                {patient.gender ? ` · ${patient.gender}` : ""}
                {patient.medical_aid_name ? ` · ${patient.medical_aid_name}` : ""}
              </p>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3">
            {treatmentStatus && (
              <Badge variant={statusVariant} className="text-xs px-3 py-1">
                {treatmentStatus.replace(/_/g, " ")}
              </Badge>
            )}

            <Badge variant="outline" className="text-xs px-3 py-1 font-normal">
              {appointmentType.name}
            </Badge>

            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {format(new Date(scheduledStart), "HH:mm")} – {format(new Date(scheduledEnd), "HH:mm")}
            </div>

            {chairName && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Armchair className="h-4 w-4" />
                {chairName}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
