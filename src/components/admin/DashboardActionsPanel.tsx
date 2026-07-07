import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Check, X, ArrowRight, MessageSquare, UserCheck, Flag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import {
  usePendingChangeRequests,
  useResolveChangeRequest,
  useMarkRequestSmsSent,
} from "@/hooks/useAppointmentChangeRequests";
import { useSendAppointmentRescheduleSms } from "@/hooks/useSendSms";
import { useUnreadPatientMessages } from "@/hooks/useUnreadPatientMessages";
import { usePendingApprovals, useApproveAccount } from "@/hooks/usePendingApprovals";
import {
  usePendingMessageFlags,
  useResolveMessageFlag,
  FLAG_LABELS,
} from "@/hooks/useMessageFlags";
import { toast } from "sonner";
import { useState } from "react";

export default function DashboardActionsPanel() {
  const { data: requests, isLoading } = usePendingChangeRequests();
  const resolve = useResolveChangeRequest();
  const markSmsSent = useMarkRequestSmsSent();
  const sendRescheduleSms = useSendAppointmentRescheduleSms();
  const [smsBusyId, setSmsBusyId] = useState<string | null>(null);
  const { data: unreadMsgs, isLoading: msgsLoading } = useUnreadPatientMessages();
  const handleSendSmsFromList = async (req: any) => {
    const apt = req.appointment;
    const phone = req.patient?.phone ?? null;
    if (!apt) {
      toast.error("Appointment not found");
      return;
    }
    // Need phone — fall back to opening the appointment if missing on this row
    if (!phone) {
      toast.info("No phone on file — open the appointment to review.");
      return;
    }
    try {
      setSmsBusyId(req.id);
      await sendRescheduleSms.mutateAsync({
        appointmentId: apt.id,
        phone,
        firstName: req.patient?.first_name ?? "",
        scheduledStart: apt.scheduled_start,
        treatmentType: apt.appointment_type?.name ?? null,
      });
      await markSmsSent.mutateAsync({ id: req.id });
      toast.success("Reschedule SMS sent");
    } catch (e: any) {
      toast.error(e.message || "Could not send SMS");
    } finally {
      setSmsBusyId(null);
    }
  };

  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();
  const approveAccount = useApproveAccount();
  const { data: msgFlags, isLoading: flagsLoading } = usePendingMessageFlags();
  const resolveFlag = useResolveMessageFlag();

  const items = requests ?? [];
  const msgs = unreadMsgs ?? [];
  const pending = approvals ?? [];
  const flags = msgFlags ?? [];
  const totalCount = items.length + msgs.length + pending.length + flags.length;

  const handleResolveFlag = async (id: string) => {
    try {
      await resolveFlag.mutateAsync(id);
      toast.success("Flag resolved");
    } catch (e: any) {
      toast.error(e.message || "Could not resolve flag");
    }
  };

  const handleApprove = async (userId: string, patientId: string | null) => {
    try {
      await approveAccount.mutateAsync({ userId, patientId });
      toast.success("Account approved");
    } catch (e: any) {
      toast.error(e.message || "Could not approve");
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await resolve.mutateAsync({ id, status: "dismissed" });
      toast.success("Request dismissed");
    } catch (e: any) {
      toast.error(e.message || "Could not dismiss");
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolve.mutateAsync({ id, status: "resolved" });
      toast.success("Marked as handled");
    } catch (e: any) {
      toast.error(e.message || "Could not resolve");
    }
  };

  return (
    <Card className="border-clinical-warning/40 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-md bg-clinical-warning/20 text-clinical-warning flex items-center justify-center">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Action items</p>
            <p className="text-xs text-muted-foreground">Patient requests waiting on you</p>
          </div>
          <span className="ml-auto inline-flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-clinical-warning text-white text-xs font-semibold tabular-nums">
            {totalCount}
          </span>
        </div>

        <div className="divide-y divide-border rounded-md border">
          {(isLoading || msgsLoading || approvalsLoading || flagsLoading) && items.length === 0 && msgs.length === 0 && pending.length === 0 && flags.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}
          {!isLoading && !msgsLoading && !approvalsLoading && !flagsLoading && items.length === 0 && msgs.length === 0 && pending.length === 0 && flags.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              Nothing needs your attention right now. You're all caught up.
            </div>
          )}
          {flags.map((f) => {
            const patientName = [f.patient_first_name, f.patient_last_name].filter(Boolean).join(" ") || "Patient";
            const flagStyles: Record<string, string> = {
              complete_onboarding: "bg-amber-200/70 text-amber-900",
              message_patient: "bg-cyan-100 text-cyan-800",
              create_appointment: "bg-purple-100 text-purple-800",
            };
            const badgeClass = flagStyles[f.flag_type] ?? "bg-clinical-warning-soft text-clinical-warning";
            return (
              <div key={`flag-${f.id}`} className="flex items-center gap-3 p-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full ${badgeClass} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
                      <Flag className="h-3 w-3" /> {FLAG_LABELS[f.flag_type]}
                    </span>
                    <span className="font-semibold text-foreground truncate">{patientName}</span>
                    <span className="text-xs text-muted-foreground">
                      · flagged {formatDistanceToNow(new Date(f.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {f.message_content && (
                    <p className="mt-1 text-sm text-muted-foreground truncate">
                      "{f.message_content}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {f.patient_id && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/admin/patients/${f.patient_id}?tab=messages`}>
                        Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveFlag(f.id)}
                    disabled={resolveFlag.isPending}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Done
                  </Button>
                </div>
              </div>
            );
          })}
          {pending.map((a) => (
            <div key={`approval-${a.user_id}`} className="flex items-center gap-3 p-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-clinical-info-soft text-clinical-info px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    <UserCheck className="h-3 w-3" /> Account pending approval
                  </span>
                  <span className="font-semibold text-foreground truncate">
                    {a.first_name || "Unnamed"} {a.last_name || ""}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · signed up {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </span>
                </div>
                {a.email && (
                  <p className="mt-1 text-sm text-muted-foreground truncate">{a.email}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.patient_id && (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/admin/patients/${a.patient_id}?tab=account`}>
                      Review <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => handleApprove(a.user_id, a.patient_id)}
                  disabled={approveAccount.isPending}
                >
                  <Check className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ))}
          {msgs.map((m) => (
            <div key={`msg-${m.patient_id}`} className="flex items-center gap-3 p-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    <MessageSquare className="h-3 w-3" /> Unread message
                  </span>
                  <span className="font-semibold text-foreground truncate">
                    {m.patient_first_name} {m.patient_last_name}
                  </span>
                  {m.unread_count > 1 && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold tabular-nums">
                      {m.unread_count}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    · {formatDistanceToNow(new Date(m.last_created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground truncate">{m.last_content}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild size="sm">
                  <Link to={`/admin/patients/${m.patient_id}?tab=messages`}>
                    Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {items.map((req) => {
            const apt = req.appointment;
            const isAwaitingSms = req.status === "rescheduled_pending_sms";
            const rowClass = isAwaitingSms
              ? "flex items-center gap-3 p-3 flex-wrap bg-amber-50 border-l-4 border-amber-400"
              : "flex items-center gap-3 p-3 flex-wrap bg-red-50 border-l-4 border-red-400";
            const badgeClass = isAwaitingSms
              ? "bg-amber-200 text-amber-900"
              : "bg-red-200 text-red-900";
            const badgeLabel = isAwaitingSms ? "Rescheduled – SMS pending" : "Reschedule request";
            return (
              <div key={req.id} className={rowClass}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 rounded-full ${badgeClass} px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`}>
                      {badgeLabel}
                    </span>
                    <span className="font-medium text-foreground truncate">
                      {req.patient?.first_name} {req.patient?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {apt && (
                      <span>
                        {isAwaitingSms ? "New slot: " : "Current: "}
                        {format(new Date(apt.scheduled_start), "EEE dd MMM · HH:mm")}
                        {apt.appointment_type?.name ? ` · ${apt.appointment_type.name}` : ""}
                      </span>
                    )}
                    {!isAwaitingSms && (req.preferred_date || req.preferred_time_window) && (
                      <span className="ml-2">
                        → Prefers {req.preferred_date ? format(new Date(req.preferred_date), "EEE dd MMM") : ""}
                        {req.preferred_time_window ? ` (${req.preferred_time_window})` : ""}
                      </span>
                    )}
                  </div>
                  {!isAwaitingSms && req.reason && (
                    <p className="mt-1 text-xs text-muted-foreground italic">"{req.reason}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {apt && !isAwaitingSms && (
                    <Button asChild size="sm">
                      <Link to={`/admin/appointments/${apt.id}?rescheduleRequestId=${req.id}`}>
                        Reschedule <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                  {apt && isAwaitingSms && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSendSmsFromList(req)}
                        disabled={smsBusyId === req.id}
                        className="gap-1"
                      >
                        {smsBusyId === req.id ? (
                          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Sending…</>
                        ) : (
                          <><MessageSquare className="h-3.5 w-3.5" /> Send SMS</>
                        )}
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/admin/appointments/${apt.id}`}>
                          Open
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleResolve(req.id)} disabled={resolve.isPending}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Done
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDismiss(req.id)} disabled={resolve.isPending}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}