import { useMemo } from "react";
import { addDays, format, parseISO } from "date-fns";
import { Copy, CopyCheck, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TomorrowAppointment } from "@/hooks/useCommandCentre";

const DEFAULT_TEMPLATE =
  "Hi {{first_name}}, friendly reminder of your {{treatment_type}} appointment tomorrow at {{time}} at The Johannesburg Infusion Centre. Please reply to confirm. Thank you!";

function fillTemplate(
  tpl: string,
  apt: TomorrowAppointment,
): string {
  return tpl
    .split("{{first_name}}").join(apt.patientFirstName)
    .split("{{treatment_type}}").join(apt.treatmentType)
    .split("{{time}}").join(format(parseISO(apt.scheduledStart), "HH:mm"));
}

async function copy(text: string, label = "Copied") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Couldn't copy");
  }
}

export function TomorrowsReminderList({
  appointments,
}: {
  appointments: TomorrowAppointment[];
}) {
  const tomorrow = useMemo(() => addDays(new Date(), 1), []);
  const template = DEFAULT_TEMPLATE;

  const copyAll = () => {
    if (!appointments.length) return;
    const block = appointments
      .map(
        (a) =>
          `${format(parseISO(a.scheduledStart), "HH:mm")}  ${a.patientName}  ${
            a.patientPhone ?? "no phone"
          }  ${a.treatmentType}`,
      )
      .join("\n");
    copy(block, "Full list copied");
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm shadow-clinical-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Tomorrow's reminders
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {format(tomorrow, "EEE d MMM")} ·{" "}
            {appointments.length === 0
              ? "Nothing booked"
              : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {appointments.length > 0 && (
          <Button variant="outline" size="sm" onClick={copyAll}>
            <CopyCheck className="mr-1 h-3.5 w-3.5" />
            Copy all
          </Button>
        )}
      </div>

      {appointments.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2 text-center">
          No appointments for tomorrow.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {appointments.map((a) => (
            <li
              key={a.appointmentId}
              className="flex items-center gap-2 rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs"
            >
              <span className="font-mono font-medium text-foreground w-10 shrink-0 tabular-nums">
                {format(parseISO(a.scheduledStart), "HH:mm")}
              </span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium text-foreground">
                  {a.patientName}
                </div>
                <div className="truncate text-muted-foreground flex items-center gap-2">
                  <span>{a.treatmentType}</span>
                  {a.patientPhone && (
                    <Badge variant="outline" className="h-4 px-1 text-[10px]">
                      {a.patientPhone}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                title="Copy reminder message"
                onClick={() => copy(fillTemplate(template, a), "Reminder copied")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}