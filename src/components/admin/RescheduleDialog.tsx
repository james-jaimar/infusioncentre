import { useState } from "react";
import { toast } from "sonner";
import { format, setHours, setMinutes, addMinutes, parseISO } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useRescheduleAppointment } from "@/hooks/useAppointments";
import { AppointmentWithRelations } from "@/types/appointment";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations;
}

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

export function RescheduleDialog({ open, onOpenChange, appointment }: RescheduleDialogProps) {
  const originalStart = parseISO(appointment.scheduled_start);
  const originalEnd = parseISO(appointment.scheduled_end);
  const durationMinutes = Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000);

  const [newDate, setNewDate] = useState<Date | undefined>();
  const [newTime, setNewTime] = useState(format(originalStart, "HH:mm"));
  const [newChairId, setNewChairId] = useState(appointment.chair_id || "");
  const [reason, setReason] = useState("");

  const { data: chairs = [] } = useTreatmentChairs();
  const reschedule = useRescheduleAppointment();

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
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reschedule");
      console.error(error);
    }
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

        <div className="space-y-4">
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
                  disabled={(date) => date < new Date()}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={reschedule.isPending || !newDate || !reason.trim()}>
            {reschedule.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rescheduling...</>
            ) : (
              "Reschedule"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
