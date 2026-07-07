import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, setHours, setMinutes, addMinutes, parseISO, startOfDay } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, MessageSquare, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useRescheduleAppointment } from "@/hooks/useAppointments";
import { useSendAppointmentRescheduleSms } from "@/hooks/useSendSms";
import { AppointmentWithRelations } from "@/types/appointment";
import {
  AppointmentChangeRequest,
  useMarkRequestRescheduled,
  useMarkRequestSmsSent,
} from "@/hooks/useAppointmentChangeRequests";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations;
  changeRequest?: AppointmentChangeRequest | null;
}

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

export function RescheduleDialog({ open, onOpenChange, appointment, changeRequest }: RescheduleDialogProps) {
  const originalStart = parseISO(appointment.scheduled_start);
  const originalEnd = parseISO(appointment.scheduled_end);
  const durationMinutes = Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000);

  const initialDate = changeRequest?.preferred_date ? parseISO(changeRequest.preferred_date) : undefined;
  const [newDate, setNewDate] = useState<Date | undefined>(initialDate);
  const [newTime, setNewTime] = useState(format(originalStart, "HH:mm"));
  const [newChairId, setNewChairId] = useState(appointment.chair_id || "");
  const [reason, setReason] = useState(changeRequest?.reason ? `Patient request: ${changeRequest.reason}` : "");
  const [stage, setStage] = useState<"edit" | "sms">(
    changeRequest?.status === "rescheduled_pending_sms" ? "sms" : "edit"
  );
  const [smsPending, setSmsPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (changeRequest?.status === "rescheduled_pending_sms") {
      setStage("sms");
    } else {
      setStage("edit");
    }
    if (changeRequest?.preferred_date) {
      setNewDate(parseISO(changeRequest.preferred_date));
    }
    if (changeRequest?.reason) {
      setReason((r) => r || `Patient request: ${changeRequest.reason}`);
    }
  }, [open, changeRequest?.id, changeRequest?.status, changeRequest?.preferred_date, changeRequest?.reason]);

  const { data: chairs = [] } = useTreatmentChairs();
  const reschedule = useRescheduleAppointment();
  const sendRescheduleSms = useSendAppointmentRescheduleSms();
  const markRescheduled = useMarkRequestRescheduled();
  const markSmsSent = useMarkRequestSmsSent();

  const handleSubmit = async () => {
    if (!newDate) {
      toast.error("Please select a new date");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    const [h, m] = newTime.split(":").map(Number);
    const scheduledStart = setMinutes(setHours(newDate, h), m);
    const scheduledEnd = addMinutes(scheduledStart, durationMinutes);

    try {
      await reschedule.mutateAsync({
        originalAppointmentId: appointment.id,
        newData: {
          patient_id: appointment.patient_id,
          appointment_type_id: appointment.appointment_type_id,
          treatment_course_id: (appointment as any).treatment_course_id || null,
          chair_id: newChairId || null,
          assigned_nurse_id: appointment.assigned_nurse_id,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          session_number: (appointment as any).session_number || null,
        },
        reason,
      });
      toast.success("Appointment rescheduled");

      if (changeRequest?.id) {
        try {
          await markRescheduled.mutateAsync({
            id: changeRequest.id,
            new_appointment_id: appointment.id,
          });
        } catch (e) {
          console.error("Could not update change request", e);
        }
      }

      // Move to SMS confirmation step
      setStage("sms");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to reschedule";
      toast.error(msg);
      console.error("Reschedule failed:", error);
    }
  };

  const handleSendSms = async () => {
    const phone = appointment.patient.phone;
    if (!phone) {
      toast.info("No patient phone on file — SMS cannot be sent");
      return;
    }
    // Recompute scheduled start from state (falls back to current appointment if not edited)
    let scheduledStartIso = appointment.scheduled_start;
    if (newDate) {
      const [h, m] = newTime.split(":").map(Number);
      scheduledStartIso = setMinutes(setHours(newDate, h), m).toISOString();
    }
    try {
      setSmsPending(true);
      await sendRescheduleSms.mutateAsync({
        appointmentId: appointment.id,
        phone,
        firstName: appointment.patient.first_name,
        scheduledStart: scheduledStartIso,
        treatmentType: appointment.appointment_type?.name ?? null,
      });
      toast.success("Reschedule SMS sent to patient");
      if (changeRequest?.id) {
        try {
          await markSmsSent.mutateAsync({ id: changeRequest.id });
        } catch (e) {
          console.error("Could not mark request resolved", e);
        }
      }
      onOpenChange(false);
    } catch (smsErr) {
      const msg = smsErr instanceof Error ? smsErr.message : "Unknown error";
      toast.error(`Could not send reschedule SMS: ${msg}`);
    } finally {
      setSmsPending(false);
    }
  };

  const handleSkipSms = () => {
    if (changeRequest?.id) {
      toast.info("Reschedule saved. SMS still pending — this stays on your action list.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            {appointment.patient.first_name} {appointment.patient.last_name} —{" "}
            currently {format(originalStart, "EEE, MMM d 'at' h:mm a")}
          </DialogDescription>
        </DialogHeader>

        {stage === "edit" ? (
        <div className="space-y-4">
          {changeRequest && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              <p className="font-medium text-red-900">Patient's requested change</p>
              <p className="text-red-900/80 mt-1">
                {changeRequest.preferred_date
                  ? `Prefers ${format(parseISO(changeRequest.preferred_date), "EEE, MMM d")}`
                  : "No preferred date"}
                {changeRequest.preferred_time_window ? ` · ${changeRequest.preferred_time_window}` : ""}
              </p>
              {changeRequest.reason && (
                <p className="italic text-red-900/80 mt-1">"{changeRequest.reason}"</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>New Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start", !newDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDate ? format(newDate, "PPP") : "Pick a new date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={newDate}
                  onSelect={setNewDate}
                  disabled={(date) => startOfDay(date) < startOfDay(new Date())}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>New Time</Label>
            <Select value={newTime} onValueChange={setNewTime}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {format(new Date(`2000-01-01T${t}`), "h:mm a")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chair</Label>
            <Select value={newChairId || "none"} onValueChange={(v) => setNewChairId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No chair</SelectItem>
                {chairs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason for rescheduling *</Label>
            <Textarea
              placeholder="Why is this being rescheduled?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Rescheduled
              </div>
              <p className="mt-1">
                Now {newDate ? format(setMinutes(setHours(newDate, Number(newTime.split(":")[0])), Number(newTime.split(":")[1])), "EEE, MMM d 'at' h:mm a") : format(originalStart, "EEE, MMM d 'at' h:mm a")}.
              </p>
            </div>
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">Send the patient a confirmation SMS</p>
              <p className="text-muted-foreground mt-1">
                {appointment.patient.phone
                  ? `SMS will go to ${appointment.patient.phone}. Until sent, this stays on the action list so no one loses track.`
                  : "No phone number on file for this patient — SMS cannot be sent from here."}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {stage === "edit" ? (
          <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={reschedule.isPending || !newDate || !reason.trim()}>
            {reschedule.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rescheduling...</>
            ) : (
              "Reschedule"
            )}
          </Button>
          </>
          ) : (
          <>
            <Button variant="outline" onClick={handleSkipSms} disabled={smsPending}>
              I'll send it later
            </Button>
            <Button onClick={handleSendSms} disabled={smsPending || !appointment.patient.phone} className="gap-2">
              {smsPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><MessageSquare className="h-4 w-4" /> Send SMS confirmation</>
              )}
            </Button>
          </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
