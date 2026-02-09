import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTodaysTreatments } from "@/hooks/useTreatments";
import { useActiveTreatments } from "@/hooks/useActiveTreatments";
import ActiveTreatmentTimer from "@/components/nurse/ActiveTreatmentTimer";
import { Users, Clock, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export default function NurseDashboard() {
  const { data: appointments, isLoading } = useTodaysTreatments();
  const { data: activeTreatments } = useActiveTreatments();
  const navigate = useNavigate();

  const waiting = appointments?.filter((a: any) => a.status === "scheduled" || a.status === "confirmed") || [];
  const inProgress = appointments?.filter((a: any) => a.status === "in_progress" || a.status === "checked_in") || [];
  const completed = appointments?.filter((a: any) => a.status === "completed") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nurse Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d MMMM yyyy")} — Welcome back!
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{waiting.length}</div>
            <p className="text-xs text-muted-foreground">patients in queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground">active treatments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completed.length}</div>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Emergency</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full" onClick={() => navigate("/nurse/emergency")}>
              View Protocol
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Treatment Timer Widget */}
      <ActiveTreatmentTimer treatments={activeTreatments || []} />

      {/* Today's Queue with time-since-arrival */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today's Queue</CardTitle>
          <Button size="sm" variant="outline" onClick={() => navigate("/nurse/patients")}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-6 text-muted-foreground">Loading...</p>
          ) : !waiting.length ? (
            <p className="text-center py-6 text-muted-foreground">No patients waiting.</p>
          ) : (
            <div className="space-y-3">
              {waiting.slice(0, 8).map((apt: any) => {
                const scheduledTime = new Date(apt.scheduled_start);
                const isPast = scheduledTime < new Date();
                return (
                  <div key={apt.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-0.5">
                      <p className="font-medium">{apt.patient.first_name} {apt.patient.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(scheduledTime, "HH:mm")} • {apt.appointment_type.name}
                      </p>
                      {isPast && (
                        <p className="text-xs text-destructive font-medium">
                          Waiting {formatDistanceToNow(scheduledTime)}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => navigate(`/nurse/checkin/${apt.id}`)}>
                      Check In
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
