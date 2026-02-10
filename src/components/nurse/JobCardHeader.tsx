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

  return (
    <div className="space-y-2">
      {/* Allergy alert banner */}
      {hasAllergies && (
        <div className="flex items-center gap-2 rounded bg-destructive/10 border border-destructive/30 px-4 py-2">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <p className="text-sm font-semibold text-destructive">
            ALLERGIES: {allergies.join(", ")}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded border bg-card p-4">
        {/* Patient info */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground leading-tight">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {age !== null ? `Age ${age}` : "DOB not recorded"}
              {patient.gender ? ` • ${patient.gender}` : ""}
              {patient.medical_aid_name ? ` • ${patient.medical_aid_name}` : ""}
            </p>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            style={{ backgroundColor: appointmentType.color, color: "#fff" }}
            className="text-sm px-3 py-1"
          >
            {appointmentType.name}
          </Badge>

          {treatmentStatus && (
            <Badge variant="outline" className="text-sm">
              {treatmentStatus.replace(/_/g, " ")}
            </Badge>
          )}

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {format(new Date(scheduledStart), "HH:mm")} – {format(new Date(scheduledEnd), "HH:mm")}
          </div>

          {chairName && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Armchair className="h-4 w-4" />
              {chairName}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
