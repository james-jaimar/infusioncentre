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
import { CalendarIcon, CheckCircle2, Copy, ExternalLink, Loader2, MessageSquare, Phone, Trash2, Repeat, Send, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useAllDoctors } from "@/hooks/useDoctors";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateAppointment, useDeleteAppointment, useMarkArrived } from "@/hooks/useAppointments";
import { ensureDoctorReferral } from "@/lib/ensureDoctorReferral";
import { useQueryClient } from "@tanstack/react-query";
import { useSendAppointmentConfirmationSms, useSendAppointmentRescheduleSms } from "@/hooks/useSendSms";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment";
import { RescheduleDialog } from "./RescheduleDialog";
import SendInviteDialog from "./SendInviteDialog";
import { usePatientInvites } from "@/hooks/usePatientInvites";
import { useAppointmentSmsLog } from "@/hooks/useCommunicationLog";
import {
  usePendingChangeRequestForAppointment,
  useMarkRequestSmsSent,
} from "@/hooks/useAppointmentChangeRequests";
import { AlertCircle, RefreshCw } from "lucide-react";

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
  /** If provided, auto-opens the reschedule dialog for this pending request on mount. */
  autoOpenRescheduleRequestId?: string | null;
}

export function AppointmentQuickEditDialog({ open, onOpenChange, appointment, autoOpenRescheduleRequestId }: Props) {
  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const { data: doctors = [] } = useAllDoctors();
  const update = useUpdateAppointment();
  const queryClient = useQueryClient();
  const del = useDeleteAppointment();
  const markArrived = useMarkArrived();
  const sendSms = useSendAppointmentConfirmationSms();
  const sendRescheduleSms = useSendAppointmentRescheduleSms();
  const markSmsSent = useMarkRequestSmsSent();
  const changeRequest = usePendingChangeRequestForAppointment(appointment?.id);
  const { data: smsHistory = [] } = useAppointmentSmsLog(appointment?.id);

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [chairId, setChairId] = useState<string>("none");
  const [nurseId, setNurseId] = useState<string>("none");
  const [doctorId, setDoctorId] = useState<string>("none");
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [notes, setNotes] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const { data: invites } = usePatientInvites(appointment?.patient_id);
  const hasAcceptedInvite = !!invites?.some((i) => i.status === "accepted");

  // Auto-open reschedule dialog when the caller has deep-linked with a request id
  // and there's still work to do (either the reschedule itself, or the SMS follow-up).
  useEffect(() => {
    if (!open || !autoOpenRescheduleRequestId) return;
    if (changeRequest && changeRequest.id === autoOpenRescheduleRequestId) {
      setShowReschedule(true);
    }
  }, [open, autoOpenRescheduleRequestId, changeRequest?.id]);

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
    const refName = (appointment.patient as any)?.referring_doctor_name as string | null;
    if (!refName) {
      setDoctorId("none");
    } else {
      const match = (doctors as any[]).find(
        (d) => `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() === refName.trim()
      );
      setDoctorId(match?.id ?? "none");
    }
  }, [appointment?.id, open, doctors]);

  if (!appointment) return null;

  const handleSave = async () => {
    if (!date) {
      toast.error("Please pick a date");
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const newStart = setMinutes(setHours(date, h), m);
    const newEnd = new Date(newStart.getTime() + duration * 60_000);

    const originalStart = parseISO(appointment.scheduled_start);
    const timeChanged = newStart.getTime() !== originalStart.getTime();
    const wasConfirmed =
      !!appointment.patient_confirmed_at || appointment.status === "confirmed";
    // If admin changed the time, invalidate patient confirmation so they must re-confirm.
    const effectiveStatus =
      timeChanged && status === "confirmed" && appointment.status === "confirmed"
        ? ("scheduled" as AppointmentStatus)
        : status;
    const clearConfirmation = timeChanged;

    try {
      await update.mutateAsync({
        id: appointment.id,
        data: {
          scheduled_start: newStart.toISOString(),
          scheduled_end: newEnd.toISOString(),
          chair_id: chairId === "none" ? null : chairId,
          assigned_nurse_id: nurseId === "none" ? null : nurseId,
          status: effectiveStatus,
          notes: notes.trim() || null,
          ...(clearConfirmation ? { patient_confirmed_at: null, reschedule_reason: "Edited via appointment dialog" } : {}),
        } as any,
      });
      if (timeChanged && wasConfirmed) {
        toast.warning("Updated — patient must re-confirm. Send an SMS from this dialog.");
      } else {
        toast.success("Appointment updated");
      }
      // Write referring doctor back to the patient record so it stays in sync
      try {
        if (doctorId === "none") {
          await supabase
            .from("patients")
            .update({
              referring_doctor_name: null,
              referring_doctor_practice: null,
              referring_doctor_phone: null,
            })
            .eq("id", appointment.patient_id);
        } else {
          const doc = (doctors as any[]).find((d) => d.id === doctorId);
          if (doc) {
            const refName = `${doc.first_name ?? ""} ${doc.last_name ?? ""}`.trim();
            await supabase
              .from("patients")
              .update({
                referring_doctor_name: refName,
                referring_doctor_practice: doc.practice_name ?? null,
                referring_doctor_phone: doc.phone ?? null,
              })
              .eq("id", appointment.patient_id);
            // Structured link: ensure a referral row exists so the patient
            // appears under this doctor's Patients/Referrals.
            await ensureDoctorReferral(appointment.patient_id, doctorId);
            queryClient.invalidateQueries({ queryKey: ["referrals"] });
            queryClient.invalidateQueries({ queryKey: ["doctor-linked-patients", doctorId] });
            queryClient.invalidateQueries({ queryKey: ["doctor-detail", doctorId] });
          }
        }
      } catch (e) {
        console.error("Failed to update referring doctor on patient", e);
      }
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
  const hasOpenRescheduleRequest =
    changeRequest?.request_type === "reschedule" &&
    ["pending", "rescheduled_pending_sms"].includes(changeRequest.status);
  const smsBusy = sendSms.isPending || sendRescheduleSms.isPending || markSmsSent.isPending;
  const handleSendSms = async () => {
    if (!patientPhone) {
      toast.error("Patient has no phone number on file");
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const scheduledStartForSms = date
      ? setMinutes(setHours(date, h), m).toISOString()
      : appointment.scheduled_start;
    try {
      const sender = hasOpenRescheduleRequest ? sendRescheduleSms : sendSms;
      await sender.mutateAsync({
        appointmentId: appointment.id,
        phone: patientPhone,
        firstName: appointment.patient.first_name,
        scheduledStart: scheduledStartForSms,
        treatmentType: appointment.appointment_type.name,
        confirmationToken: (appointment as any).confirmation_token ?? null,
      });
      // If this appointment is tied to an open reschedule request, resolve it
      // so no other admin sees the SMS follow-up as still outstanding.
      if (hasOpenRescheduleRequest && changeRequest?.id) {
        try {
          await markSmsSent.mutateAsync({ id: changeRequest.id });
          toast.success("Reschedule confirmation SMS sent · marked handled");
        } catch (e) {
          console.error("Could not mark change request resolved", e);
          toast.success("SMS confirmation sent");
        }
      } else {
        toast.success("SMS confirmation sent");
      }
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
                  {appointment.patient_confirmed_at && (
                    <Badge
                      className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1"
                      title={`Patient confirmed via SMS link on ${format(parseISO(appointment.patient_confirmed_at), "EEE MMM d 'at' h:mm a")}`}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Confirmed by patient
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  Originally {format(start, "EEE, MMM d 'at' h:mm a")}
                  {(appointment as any).session_number
                    ? ` · Session #${(appointment as any).session_number}`
                    : ""}
                </DialogDescription>
                {appointment.patient_confirmed_at && (
                  <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
                    Patient tapped the SMS confirmation link on{" "}
                    {format(parseISO(appointment.patient_confirmed_at), "EEE MMM d 'at' h:mm a")}
                  </div>
                )}
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

          {changeRequest && (
            <div
              className={cn(
                "rounded-md border p-3 text-sm",
                changeRequest.status === "rescheduled_pending_sms"
                  ? "border-red-300 bg-red-50 text-red-900"
                  : "border-amber-300 bg-amber-50 text-amber-900"
              )}
            >
              <div className="flex items-start gap-2">
                {changeRequest.status === "rescheduled_pending_sms" ? (
                  <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {changeRequest.status === "rescheduled_pending_sms" ? (
                    <>
                      <p className="font-semibold">Awaiting reschedule confirmation SMS</p>
                      <p className="mt-0.5">
                        Appointment moved — patient hasn't been sent the confirmation SMS yet.
                        Use "Send reschedule confirmation SMS" below to complete this and clear it from the action list.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold">Patient requested a reschedule</p>
                      <p className="mt-0.5">
                        {changeRequest.preferred_date
                          ? `Prefers ${format(parseISO(changeRequest.preferred_date), "EEE, MMM d")}`
                          : "No preferred date"}
                        {changeRequest.preferred_time_window ? ` · ${changeRequest.preferred_time_window}` : ""}
                      </p>
                      {changeRequest.reason && (
                        <p className="italic mt-1">"{changeRequest.reason}"</p>
                      )}
                      <p className="mt-1 text-xs">
                        If this slot has already been moved, send the reschedule confirmation SMS below to clear the action item.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => setShowReschedule(true)}
                      >
                        <RefreshCw className="mr-1 h-3.5 w-3.5" />
                        Reschedule now
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {smsHistory.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 text-sm">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <MessageSquare className="h-4 w-4" /> SMS history
              </div>
              <div className="space-y-2">
                {smsHistory.slice(0, 4).map((entry) => {
                  const when = entry.sent_at ?? entry.created_at;
                  const isReschedule =
                    entry.related_entity_type === "appointment_reschedule" ||
                    entry.template === "appointment_reschedule";
                  return (
                    <div key={entry.id} className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant={entry.status === "sent" ? "secondary" : "destructive"}>
                        {entry.status === "sent" ? "Sent" : entry.status}
                      </Badge>
                      <span className="font-medium">
                        {isReschedule ? "Reschedule confirmation" : "Appointment confirmation"}
                      </span>
                      <span className="text-muted-foreground">
                        {format(parseISO(when), "MMM d, h:mm a")}
                      </span>
                      {entry.error_message && (
                        <span className="text-destructive">{entry.error_message}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
            <Label>Referring doctor</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select referring doctor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No referring doctor</SelectItem>
                {(doctors as any[]).map((d) => {
                  const name =
                    `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() ||
                    d.practice_name ||
                    "Unnamed doctor";
                  return (
                    <SelectItem key={d.id} value={d.id}>
                      {name}
                      {d.practice_name ? ` · ${d.practice_name}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
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
                variant={changeRequest?.status === "rescheduled_pending_sms" ? "default" : "outline"}
                size="sm"
                onClick={handleSendSms}
                disabled={smsBusy || !patientPhone}
                title={
                  !patientPhone
                    ? "No phone number on file"
                    : hasOpenRescheduleRequest
                      ? "Send reschedule confirmation SMS and mark this action item as handled"
                      : "Send confirmation SMS now"
                }
              >
                {smsBusy ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MessageSquare className="mr-1 h-3.5 w-3.5" />
                )}
                {hasOpenRescheduleRequest
                  ? "Send reschedule confirmation SMS"
                  : "Send SMS confirmation"}
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
          changeRequest={changeRequest ?? undefined}
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