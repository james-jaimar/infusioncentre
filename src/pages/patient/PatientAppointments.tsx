import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get patient id
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!patient) { setLoading(false); return; }

      const { data } = await supabase
        .from("appointments")
        .select("*, appointment_types(name, color, preparation_instructions)")
        .eq("patient_id", patient.id)
        .order("scheduled_start", { ascending: true });

      setAppointments(data || []);
      setLoading(false);
    })();
  }, [user]);

  const upcoming = appointments.filter(a => new Date(a.scheduled_start) >= new Date() && a.status !== "cancelled");
  const past = appointments.filter(a => new Date(a.scheduled_start) < new Date() || a.status === "cancelled");

  const statusColors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-700",
    confirmed: "bg-green-100 text-green-700",
    checked_in: "bg-yellow-100 text-yellow-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const AppointmentCard = ({ appt }: { appt: any }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="font-medium text-sm">{(appt.appointment_types as any)?.name || "Appointment"}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(appt.scheduled_start), "EEEE, dd MMM yyyy")}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(new Date(appt.scheduled_start), "HH:mm")} – {format(new Date(appt.scheduled_end), "HH:mm")}
            </div>
          </div>
          <Badge className={statusColors[appt.status] || "bg-muted"} variant="outline">
            {appt.status?.replace(/_/g, " ")}
          </Badge>
        </div>
        {(appt.appointment_types as any)?.preparation_instructions && (
          <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
            <p className="font-medium mb-1">Preparation Instructions:</p>
            <p className="text-muted-foreground">{(appt.appointment_types as any).preparation_instructions}</p>
          </div>
        )}
        {appt.notes && (
          <p className="mt-2 text-xs text-muted-foreground">{appt.notes}</p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) return <div className="p-4 text-muted-foreground">Loading appointments...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Appointments</h1>
        <p className="text-muted-foreground">View your upcoming and past appointments</p>
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-3">Past ({past.length})</h2>
          <div className="space-y-3">
            {past.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}
