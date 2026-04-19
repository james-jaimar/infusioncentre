import { useReferralAuditTrail } from "@/hooks/useReferrals";
import { useStatusDisplay } from "@/hooks/useStatusDictionaries";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface Props {
  referralId: string;
  createdAt?: string;
}

export function ReferralStatusTimeline({ referralId, createdAt }: Props) {
  const { data: events = [], isLoading } = useReferralAuditTrail(referralId);
  const getStatus = useStatusDisplay("referral");

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Loading history…</p>;
  }

  const items: { at: string; label: string; note?: string | null }[] = [];

  if (createdAt) {
    items.push({ at: createdAt, label: "Submitted" });
  }

  for (const e of events as any[]) {
    const to = e.details?.to_status as string | undefined;
    if (!to) continue;
    items.push({
      at: e.created_at,
      label: getStatus(to).label || to,
      note: e.details?.notes,
    });
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No history recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-3 text-xs">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-primary mt-1" />
            {i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="flex-1 pb-2">
            <p className="font-medium text-foreground">{it.label}</p>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(it.at), "dd MMM yyyy HH:mm")}
            </p>
            {it.note && <p className="text-muted-foreground italic mt-0.5">"{it.note}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
