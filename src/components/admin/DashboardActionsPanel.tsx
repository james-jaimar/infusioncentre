import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, Check, X, ArrowRight, MessageSquare, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { usePendingChangeRequests, useResolveChangeRequest } from "@/hooks/useAppointmentChangeRequests";
import { useUnreadPatientMessages } from "@/hooks/useUnreadPatientMessages";
import { usePendingApprovals, useApproveAccount } from "@/hooks/usePendingApprovals";
import { toast } from "sonner";

export default function DashboardActionsPanel() {
  const { data: requests, isLoading } = usePendingChangeRequests();
  const resolve = useResolveChangeRequest();
  const { data: unreadMsgs, isLoading: msgsLoading } = useUnreadPatientMessages();
  const { data: approvals, isLoading: approvalsLoading } = usePendingApprovals();
  const approveAccount = useApproveAccount();

  const items = requests ?? [];
  const msgs = unreadMsgs ?? [];
  const pending = approvals ?? [];
  const totalCount = items.length + msgs.length + pending.length;

  const handleApprove = async (userId: string) => {
    try {
      await approveAccount.mutateAsync(userId);
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
          {(isLoading || msgsLoading || approvalsLoading) && items.length === 0 && msgs.length === 0 && pending.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          )}
          {!isLoading && !msgsLoading && !approvalsLoading && items.length === 0 && msgs.length === 0 && pending.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              Nothing needs your attention right now. You're all caught up.
            </div>
          )}
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
                  onClick={() => handleApprove(a.user_id)}
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
            const dateStr = apt
              ? `${new Date(apt.scheduled_start).getFullYear()}-${String(new Date(apt.scheduled_start).getMonth() + 1).padStart(2, "0")}-${String(new Date(apt.scheduled_start).getDate()).padStart(2, "0")}`
              : null;
            return (
              <div key={req.id} className="flex items-center gap-3 p-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-clinical-warning-soft text-clinical-warning px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      Reschedule request
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
                        Current: {format(new Date(apt.scheduled_start), "EEE dd MMM · HH:mm")}
                        {apt.appointment_type?.name ? ` · ${apt.appointment_type.name}` : ""}
                      </span>
                    )}
                    {(req.preferred_date || req.preferred_time_window) && (
                      <span className="ml-2">
                        → Prefers {req.preferred_date ? format(new Date(req.preferred_date), "EEE dd MMM") : ""}
                        {req.preferred_time_window ? ` (${req.preferred_time_window})` : ""}
                      </span>
                    )}
                  </div>
                  {req.reason && (
                    <p className="mt-1 text-xs text-muted-foreground italic">"{req.reason}"</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {apt && dateStr && (
                    <Button asChild size="sm">
                      <Link to={`/admin/appointments?view=day&date=${dateStr}&apt=${apt.id}`}>
                        Open <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
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