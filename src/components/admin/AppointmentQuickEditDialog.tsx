import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { format, parseISO, setHours, setMinutes, differenceInMinutes } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarIcon, Copy, ExternalLink, Loader2, MessageSquare, Phone, Trash2, Repeat, Send, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useUpdateAppointment, useDeleteAppointment, useMarkArrived } from "@/hooks/useAppointments";
import { useSendAppointmentConfirmationSms } from "@/hooks/useSendSms";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment";
import { RescheduleDialog } from "./RescheduleDialog";
import SendInviteDialog from "./SendInviteDialog";
import { usePatientInvites } from "@/hooks/usePatientInvites";

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "confirmed", label: "Confirmed" },
  { value: "arrived", label: "Arrived" },
  { value: "checked_in", label: "Checked in" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: AppointmentWithRelations | null;
}

export function AppointmentQuickEditDialog({ open, onOpenChange, appointment }: Props) {
  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const update = useUpdateAppointment();
  const del = useDeleteAppointment();
  const markArrived = useMarkArrived();
  const sendSms = useSendAppointmentConfirmationSms();

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [chairId, setChairId] = useState<string>("none");
  const [nurseId, setNurseId] = useState<string>("none");
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const { data: invites } = usePatientInvites(appointment?.patient_id);
  const hasAcceptedInvite = !!invites?.some((i) => i.status === "accepted");

  useEffect(() => {
    if (!appointment) return;
    const start = parseISO(appointment.scheduled_start);
    const end = parseISO(appointment.scheduled_end);
    setDate(start);
    setTime(format(start, "HH:mm"));
    setDuration(differenceInMinutes(end, start));
    setChairId(appointment.chair_id || "none");
    setNurseId(appointment.assigned_nurse_id || "none");
    setStatus(appointment.status);
    setNotes(appointment.notes || "");
  }, [appointment?.id, open]);

  if (!appointment) return null;

  const handleSave = async () => {
    if (!date) {
      toast.error("Please pick a date");
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const newStart = setMinutes(setHours(date, h), m);
    const newEnd = new Date(newStart.getTime() + duration * 60_000);

    try {
      await update.mutateAsync({
        id: appointment.id,
        data: {
          scheduled_start: newStart.toISOString(),
          scheduled_end: newEnd.toISOString(),
          chair_id: chairId === "none" ? null : chairId,
          assigned_nurse_id: nurseId === "none" ? null : nurseId,
          status,
          notes: notes.trim() || null,
        },
      });
      toast.success("Appointment updated");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to update");
      console.error(e);
    }
  };

  const handleCancel = async () => {
    try {
      await update.mutateAsync({
        id: appointment.id,
        data: { status: "cancelled" },
      });
      toast.success("Appointment cancelled");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to cancel");
    }
  };

  const handleDelete = async () => {
    try {
      await del.mutateAsync(appointment.id);
      toast.success("Appointment deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const start = parseISO(appointment.scheduled_start);
  const canMarkArrived =
    appointment.status === "scheduled" || appointment.status === "confirmed";

  const handleMarkArrived = async () => {
    try {
      await markArrived.mutateAsync({
        id: appointment.id,
        chairId: chairId === "none" ? null : chairId,
      });
      toast.success("Marked as arrived");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to mark arrived");
      console.error(e);
    }
  };

  const patientPhone = (appointment.patient as any).phone as string | null;
  const handleSendSms = async () => {
    if (!patientPhone) {
      toast.error("Patient has no phone number on file");
      return;
    }
    try {
      await sendSms.mutateAsync({
        appointmentId: appointment.id,
        phone: patientPhone,
        firstName: appointment.patient.first_name,
        scheduledStart: appointment.scheduled_start,
        treatmentType: appointment.appointment_type.name,
        confirmationToken: (appointment as any).confirmation_token ?? null,
      });
      toast.success("SMS confirmation sent");
    } catch (e: any) {
      toast.error(e?.message || "Failed to send SMS");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Link
                    to={`/admin/patients/${appointment.patient_id}`}
                    className="hover:underline"
                  >
                    {appointment.patient.first_name} {appointment.patient.last_name}
                  </Link>
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: appointment.appointment_type.color + "20",
                      borderColor: appointment.appointment_type.color,
                    }}
                  >
                    {appointment.appointment_type.name}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Originally {format(start, "EEE, MMM d 'at' h:mm a")}
                  {(appointment as any).session_number
                    ? ` · Session #${(appointment as any).session_number}`
                    : ""}
                </DialogDescription>
                {(appointment.patient as any).phone && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{(appointment.patient as any).phone}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-5 px-1"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          String((appointment.patient as any).phone)
                        );
                        toast.success("Phone copied");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="shrink-0"
              >
                <Link to={`/admin/appointments/${appointment.id}`} target="_blank">
                  <ExternalLink className="mr-1 h-3.5 w-3.5" />
                  Full page
                </Link>
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 min-w-0">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {format(new Date(`2000-01-01T${t}`), "h:mm a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Duration (mins)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 60)}
              />
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as AppointmentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Chair</Label>
              <Select value={chairId} onValueChange={setChairId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No chair</SelectItem>
                  {chairs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 min-w-0">
              <Label>Assigned nurse</Label>
              <Select value={nurseId} onValueChange={setNurseId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {nurses.map((n) => (
                    <SelectItem key={n.user_id} value={n.user_id}>
                      {n.first_name} {n.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes for this session…"
            />
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {canMarkArrived && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleMarkArrived}
                  disabled={markArrived.isPending}
                >
                  <UserCheck className="mr-1 h-3.5 w-3.5" />
                  Mark arrived
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendSms}
                disabled={sendSms.isPending || !patientPhone}
                title={!patientPhone ? "No phone number on file" : "Send confirmation SMS now"}
              >
                {sendSms.isPending ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="mr-1 h-3.5 w-3.5" />
                )}
                Send SMS confirmation
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReschedule(true)}
              >
                <Repeat className="mr-1 h-3.5 w-3.5" />
                Reschedule…
              </Button>
              {!hasAcceptedInvite && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvite(true)}
                >
                  <Send className="mr-1 h-3.5 w-3.5" />
                  Send portal login
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the appointment. To keep an audit
                      trail, set status to "Cancelled" instead.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showReschedule && (
        <RescheduleDialog
          open={showReschedule}
          onOpenChange={setShowReschedule}
          appointment={appointment}
        />
      )}

      {showInvite && (
        <SendInviteDialog
          patientId={appointment.patient_id}
          patientEmail={(appointment.patient as any).email ?? null}
          patientPhone={(appointment.patient as any).phone ?? null}
          patientName={`${appointment.patient.first_name} ${appointment.patient.last_name}`}
          open={showInvite}
          onOpenChange={setShowInvite}
          hideTrigger
        />
      )}
    </>
  );
}