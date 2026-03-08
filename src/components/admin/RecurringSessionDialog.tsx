import { useState } from "react";
import { toast } from "sonner";
import { format, addDays, addWeeks, setHours, setMinutes } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useCreateBulkAppointments } from "@/hooks/useAppointments";

interface RecurringSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatmentCourse: {
    id: string;
    patient_id: string;
    treatment_type_id: string;
    total_sessions_planned: number;
    sessions_completed: number;
    appointment_type?: { name: string; color: string; default_duration_minutes: number } | null;
    patient?: { first_name: string; last_name: string } | null;
  };
}

type Frequency = "weekly" | "biweekly" | "twice_weekly" | "monthly";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "twice_weekly", label: "Twice weekly" },
  { value: "monthly", label: "Monthly" },
];

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
];

export function RecurringSessionDialog({ open, onOpenChange, treatmentCourse }: RecurringSessionDialogProps) {
  const remainingSessions = treatmentCourse.total_sessions_planned - treatmentCourse.sessions_completed;
  const defaultDuration = treatmentCourse.appointment_type?.default_duration_minutes || 60;

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [preferredDay, setPreferredDay] = useState<number>(1);
  const [secondDay, setSecondDay] = useState<number>(4);
  const [time, setTime] = useState("09:00");
  const [numSessions, setNumSessions] = useState(remainingSessions);
  const [chairId, setChairId] = useState<string>("");
  const [nurseId, setNurseId] = useState<string>("");

  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const createBulk = useCreateBulkAppointments();

  const generateDates = (): Date[] => {
    if (!startDate) return [];
    const dates: Date[] = [];
    let current = startDate;
    const [h, m] = time.split(":").map(Number);

    for (let i = 0; i < numSessions; i++) {
      if (frequency === "twice_weekly") {
        // Alternate between two days
        const dayOffset = i % 2 === 0 ? preferredDay : secondDay;
        const currentDow = current.getDay() || 7; // Convert Sunday 0 to 7
        let daysToAdd = dayOffset - currentDow;
        if (daysToAdd <= 0) daysToAdd += 7;
        if (i === 0) {
          current = startDate;
        } else {
          current = addDays(dates[dates.length - 1], daysToAdd > 0 ? daysToAdd : daysToAdd + 7);
          if (current <= dates[dates.length - 1]) {
            current = addDays(dates[dates.length - 1], i % 2 === 0 ? Math.abs(secondDay - preferredDay) : 7 - Math.abs(secondDay - preferredDay));
          }
        }
        dates.push(setMinutes(setHours(current, h), m));
      } else {
        const weekMultiplier = frequency === "biweekly" ? 2 : frequency === "monthly" ? 4 : 1;
        const sessionDate = addWeeks(startDate, i * weekMultiplier);
        dates.push(setMinutes(setHours(sessionDate, h), m));
      }
    }
    return dates;
  };

  const previewDates = generateDates();

  const handleSubmit = async () => {
    if (!startDate || previewDates.length === 0) {
      toast.error("Please select a start date");
      return;
    }

    try {
      await createBulk.mutateAsync({
        appointments: previewDates.map((date, idx) => ({
          patient_id: treatmentCourse.patient_id,
          appointment_type_id: treatmentCourse.treatment_type_id,
          treatment_course_id: treatmentCourse.id,
          chair_id: chairId || null,
          assigned_nurse_id: nurseId || null,
          scheduled_start: date,
          duration_minutes: defaultDuration,
          session_number: treatmentCourse.sessions_completed + idx + 1,
          notes: `Session ${treatmentCourse.sessions_completed + idx + 1} of ${treatmentCourse.total_sessions_planned}`,
        })),
      });
      toast.success(`${previewDates.length} appointments created`);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create appointments");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Recurring Sessions</DialogTitle>
          <DialogDescription>
            Generate appointments for{" "}
            <span className="font-medium text-foreground">
              {treatmentCourse.patient?.first_name} {treatmentCourse.patient?.last_name}
            </span>{" "}
            — {treatmentCourse.appointment_type?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Start date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preferred day */}
          <div className="space-y-2">
            <Label>Preferred Day</Label>
            <Select value={String(preferredDay)} onValueChange={(v) => setPreferredDay(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((d) => (
                  <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second day for twice weekly */}
          {frequency === "twice_weekly" && (
            <div className="space-y-2">
              <Label>Second Day</Label>
              <Select value={String(secondDay)} onValueChange={(v) => setSecondDay(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.filter((d) => d.value !== preferredDay).map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={time} onValueChange={setTime}>
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

          {/* Number of sessions */}
          <div className="space-y-2">
            <Label>Sessions to schedule</Label>
            <Input
              type="number"
              min={1}
              max={remainingSessions}
              value={numSessions}
              onChange={(e) => setNumSessions(Math.min(remainingSessions, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <p className="text-xs text-muted-foreground">{remainingSessions} remaining in course</p>
          </div>

          {/* Chair */}
          <div className="space-y-2">
            <Label>Chair (optional)</Label>
            <Select value={chairId || "none"} onValueChange={(v) => setChairId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auto-assign</SelectItem>
                {chairs.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Nurse */}
          <div className="space-y-2">
            <Label>Nurse (optional)</Label>
            <Select value={nurseId || "none"} onValueChange={(v) => setNurseId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Auto-assign</SelectItem>
                {nurses.map((n) => (
                  <SelectItem key={n.user_id} value={n.user_id}>
                    {n.first_name || ""} {n.last_name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview */}
        {previewDates.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
            <p className="text-sm font-medium text-foreground">Preview ({previewDates.length} sessions)</p>
            <div className="flex flex-wrap gap-2">
              {previewDates.map((d, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  #{treatmentCourse.sessions_completed + i + 1} — {format(d, "EEE, MMM d")} at {format(d, "h:mm a")}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createBulk.isPending || !startDate}>
            {createBulk.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              `Create ${previewDates.length} Appointments`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
