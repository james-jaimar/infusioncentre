import { useState } from "react";
import { ScheduledAppointment } from "@/hooks/useCommandCentre";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserPlus } from "lucide-react";
import { format } from "date-fns";

interface AssignPatientPopoverProps {
  candidates: ScheduledAppointment[];
  onAssign: (appointmentId: string) => void;
}

export function AssignPatientPopover({ candidates, onAssign }: AssignPatientPopoverProps) {
  const [open, setOpen] = useState(false);

  if (candidates.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 mt-2">
          <UserPlus className="h-3.5 w-3.5" />
          Assign patient
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="center">
        <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">
          Assign a patient to this chair
        </p>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {candidates.map((a) => (
            <button
              key={a.appointmentId}
              type="button"
              onClick={() => {
                onAssign(a.appointmentId);
                setOpen(false);
              }}
              className="w-full text-left rounded-md px-2 py-2 hover:bg-accent transition-colors"
            >
              <p className="text-sm font-medium text-foreground truncate">{a.patientName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {format(new Date(a.scheduledStart), "HH:mm")} · {a.treatmentType}
              </p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}