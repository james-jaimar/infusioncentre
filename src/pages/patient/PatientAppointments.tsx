import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, CalendarClock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useCreateChangeRequest } from "@/hooks/useAppointmentChangeRequests";

export default function PatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patientRow, setPatientRow] = useState<{ id: string; tenant_id: string } | null>(null);
  const [changeApt, setChangeApt] = useState<any | null>(null);
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredWindow, setPreferredWindow] = useState("");
  const [reason, setReason] = useState("");
  const createRequest = useCreateChangeRequest();

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Get patient id
      const { data: patient } = await supabase
        .from("patients")
        .select("id, tenant_id")
        .eq("user_id", user.id)
        .single();
      if (!patient) { setLoading(false); return; }
      setPatientRow({ id: patient.id, tenant_id: patient.tenant_id });

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

  const openChange = (appt: any) => {
    setChangeApt(appt);
    setPreferredDate("");
    setPreferredWindow("");
    setReason("");
  };

  const submitChange = async () => {
    if (!patientRow || !changeApt) return;
    try {
      await createRequest.mutateAsync({
        appointment_id: changeApt.id,
        patient_id: patientRow.id,
        tenant_id: patientRow.tenant_id,
        preferred_date: preferredDate || null,
        preferred_time_window: preferredWindow || null,
        reason: reason || null,
      });
      toast.success("Request sent — the clinic will be in touch");
      setChangeApt(null);
    } catch (e: any) {
      toast.error(e.message || "Could not send request");
    }
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
        {new Date(appt.scheduled_start) >= new Date() && appt.status !== "cancelled" && appt.status !== "completed" && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => openChange(appt)}>
              <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
              Request date change
            </Button>
          </div>
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

      <Dialog open={!!changeApt} onOpenChange={(o) => !o && setChangeApt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request appointment change</DialogTitle>
          </DialogHeader>
          {changeApt && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Current: <strong>{format(new Date(changeApt.scheduled_start), "EEEE, dd MMM yyyy 'at' HH:mm")}</strong>
              </p>
              <div>
                <Label htmlFor="pref-date">Preferred new date (optional)</Label>
                <Input id="pref-date" type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pref-window">Preferred time of day (optional)</Label>
                <Input id="pref-window" placeholder="e.g. morning, after 2pm" value={preferredWindow} onChange={(e) => setPreferredWindow(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea id="reason" placeholder="Anything the clinic should know" value={reason} onChange={(e) => setReason(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChangeApt(null)}>Cancel</Button>
            <Button onClick={submitChange} disabled={createRequest.isPending}>Send request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
