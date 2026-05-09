import { format } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StageHistoryStripProps {
  treatment: any | null;
}

interface Person {
  id: string;
  name: string;
}

export default function StageHistoryStrip({ treatment }: StageHistoryStripProps) {
  const [people, setPeople] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!treatment) return;
    const ids = [
      treatment.checked_in_by,
      treatment.pre_assessment_by,
      treatment.nurse_id,
      treatment.post_assessment_by,
      treatment.discharged_by,
    ].filter(Boolean) as string[];
    if (!ids.length) return;
    supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        (data || []).forEach((p: any) => {
          map[p.user_id] = [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || "Unknown";
        });
        setPeople(map);
      });
  }, [treatment]);

  if (!treatment) return null;

  const items: { label: string; by: string | null; at: string | null }[] = [
    { label: "Check-in", by: treatment.checked_in_by, at: treatment.checked_in_at },
    { label: "Pre-assess", by: treatment.pre_assessment_by, at: treatment.pre_assessment_completed_at },
    { label: "Post-assess", by: treatment.post_assessment_by, at: treatment.post_assessment_completed_at },
    { label: "Discharged", by: treatment.discharged_by, at: treatment.discharged_at },
  ].filter((i) => i.at);

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
      {items.map((i, idx) => (
        <span key={idx}>
          <span className="font-medium text-foreground">{i.label}:</span>{" "}
          {i.by ? people[i.by] || "…" : "—"} · {format(new Date(i.at!), "HH:mm")}
        </span>
      ))}
    </div>
  );
}
