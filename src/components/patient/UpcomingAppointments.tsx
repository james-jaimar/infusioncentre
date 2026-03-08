import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Props {
  patientId: string | undefined;
}

export default function UpcomingAppointments({ patientId }: Props) {
  const { data: appointments, isLoading } = useQuery({
    queryKey: ["patient_upcoming_appointments", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, scheduled_start, scheduled_end, status, notes,
          appointment_types!appointments_appointment_type_id_fkey(name, color, preparation_instructions),
          treatment_chairs!appointments_chair_id_fkey(name)
        `)
        .eq("patient_id", patientId)
        .gte("scheduled_start", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"])
        .order("scheduled_start", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!patientId,
  });

  if (isLoading || !appointments?.length) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No upcoming appointments scheduled.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.map((apt) => {
          const prepInstructions = apt.appointment_types?.preparation_instructions;
          return (
            <div key={apt.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{apt.appointment_types?.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {apt.status}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(apt.scheduled_start), "EEE, d MMM yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {format(new Date(apt.scheduled_start), "HH:mm")}
                </span>
              </div>
              {apt.treatment_chairs?.name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {apt.treatment_chairs.name}
                </div>
              )}
              {prepInstructions && (
                <div className="bg-accent/50 rounded p-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Preparation:</span> {prepInstructions}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
