import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodaysTreatments } from "@/hooks/useTreatments";
import { format } from "date-fns";
import { Clock, User, ArrowRight } from "lucide-react";

const statusColors: Record<string, string> = {
  scheduled: "bg-muted text-muted-foreground",
  confirmed: "bg-blue-100 text-blue-800",
  checked_in: "bg-amber-100 text-amber-800",
  in_progress: "bg-green-100 text-green-800",
  completed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  no_show: "bg-muted text-muted-foreground",
};

export default function NurseTodaysPatients() {
  const { data: appointments, isLoading } = useTodaysTreatments();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Today's Patients</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy")} — {appointments?.length || 0} appointments
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : !appointments?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No appointments scheduled for today.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt: any) => (
            <Card key={apt.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(apt.scheduled_start), "HH:mm")} –{" "}
                        {format(new Date(apt.scheduled_end), "HH:mm")}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {apt.appointment_type.name}
                        {apt.chair ? ` • ${apt.chair.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={statusColors[apt.status] || ""}>
                      {apt.status.replace("_", " ")}
                    </Badge>
                    {(apt.status === "confirmed" || apt.status === "scheduled") && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/nurse/checkin/${apt.id}`)}
                      >
                        Check In
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {apt.status === "checked_in" && (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/nurse/checkin/${apt.id}`)}
                      >
                        Start Treatment
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                    {apt.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/nurse/treatment/${apt.id}`)}
                      >
                        View Treatment
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
