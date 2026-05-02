import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format, addDays, addWeeks, setHours, setMinutes, isBefore, startOfDay, isSameDay } from "date-fns";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trash2, Plus, RefreshCw, AlertTriangle } from "lucide-react";
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
    total_sessions_planned: number | null;
    sessions_completed: number;
    appointment_type?: { name: string; color: string; default_duration_minutes: number } | null;
    patient?: { first_name: string; last_name: string } | null;
  };
  /** Pre-fill the start date (e.g. from referral conversion). */
  initialStartDate?: Date;
  /** Pre-fill cadence from a course template's default frequency. */
  initialFrequency?: Frequency;
  /** Called after the appointments are successfully created. */
  onCreated?: () => void;
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

export function RecurringSessionDialog({
  open,
  onOpenChange,
  treatmentCourse,
  initialStartDate,
  initialFrequency,
  onCreated,
}: RecurringSessionDialogProps) {
  const isOngoing = treatmentCourse.total_sessions_planned == null;
  const remainingSessions = isOngoing
    ? 12
    : Math.max(0, (treatmentCourse.total_sessions_planned ?? 0) - treatmentCourse.sessions_completed);
  const defaultDuration = treatmentCourse.appointment_type?.default_duration_minutes || 60;

  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [frequency, setFrequency] = useState<Frequency>(initialFrequency || "weekly");
  const [preferredDay, setPreferredDay] = useState<number>(1);
  const [secondDay, setSecondDay] = useState<number>(4);
  const [time, setTime] = useState("09:00");
  const [numSessions, setNumSessions] = useState(remainingSessions || 1);
  const [chairId, setChairId] = useState<string>("");
  const [nurseId, setNurseId] = useState<string>("");

  // Re-seed when dialog reopens with new initial values
  useEffect(() => {
    if (open) {
      if (initialStartDate) setStartDate(initialStartDate);
      if (initialFrequency) setFrequency(initialFrequency);
      setNumSessions(remainingSessions || 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStartDate, initialFrequency]);

  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const createBulk = useCreateBulkAppointments();

  const [sessionDates, setSessionDates] = useState<Date[]>([]);
  const [customised, setCustomised] = useState(false);

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

  // Re-seed from settings only while the user hasn't manually customised any row.
  useEffect(() => {
    if (customised) return;
    setSessionDates(generateDates());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, frequency, preferredDay, secondDay, time, numSessions, customised]);

  const updateDateAt = (index: number, newDate: Date | undefined) => {
    if (!newDate) return;
    setCustomised(true);
    setSessionDates((prev) => {
      const next = [...prev];
      const old = next[index];
      next[index] = setMinutes(setHours(newDate, old.getHours()), old.getMinutes());
      return next;
    });
  };

  const updateTimeAt = (index: number, newTime: string) => {
    const [h, m] = newTime.split(":").map(Number);
    setCustomised(true);
    setSessionDates((prev) => {
      const next = [...prev];
      next[index] = setMinutes(setHours(next[index], h), m);
      return next;
    });
  };

  const removeAt = (index: number) => {
    setCustomised(true);
    setSessionDates((prev) => prev.filter((_, i) => i !== index));
  };

  const addAnother = () => {
    setCustomised(true);
    setSessionDates((prev) => {
      if (prev.length === 0) {
        const [h, m] = time.split(":").map(Number);
        return [setMinutes(setHours(startDate ?? new Date(), h), m)];
      }
      const last = prev[prev.length - 1];
      return [...prev, addWeeks(last, 1)];
    });
  };

  const regenerate = () => {
    setCustomised(false);
    setSessionDates(generateDates());
  };

  const today = startOfDay(new Date());
  const hasPastDate = sessionDates.some((d) => isBefore(d, today));
  const hasDuplicateDay = sessionDates.some((d, i) =>
    sessionDates.some((other, j) => j !== i && isSameDay(d, other))
  );

  const handleSubmit = async () => {
    if (sessionDates.length === 0) {
      toast.error("Please select a start date");
      return;
    }
    if (hasPastDate) {
      toast.error("One or more sessions are in the past");
      return;
    }

    const sorted = [...sessionDates].sort((a, b) => a.getTime() - b.getTime());

    try {
      await createBulk.mutateAsync({
        appointments: sorted.map((date, idx) => ({
          patient_id: treatmentCourse.patient_id,
          appointment_type_id: treatmentCourse.treatment_type_id,
          treatment_course_id: treatmentCourse.id,
          chair_id: chairId || null,
          assigned_nurse_id: nurseId || null,
          scheduled_start: date,
          duration_minutes: defaultDuration,
          session_number: treatmentCourse.sessions_completed + idx + 1,
          notes: isOngoing
            ? `Session ${treatmentCourse.sessions_completed + idx + 1} (ongoing pathway)`
            : `Session ${treatmentCourse.sessions_completed + idx + 1} of ${treatmentCourse.total_sessions_planned}`,
        })),
      });
      toast.success(`${sorted.length} appointments created`);
      onOpenChange(false);
      onCreated?.();
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

        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 text-xs text-foreground">
          <p className="font-medium">Nothing is booked yet.</p>
          <p className="text-muted-foreground mt-0.5">
            These are proposed appointments. Pick a time, review each session, then click
            <span className="font-medium text-foreground"> Create appointments</span> to add them
            to the calendar. Until then, this course will stay on the “Needs session scheduling”
            to-do list.
          </p>
        </div>

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
              max={isOngoing ? undefined : remainingSessions}
              value={numSessions}
              onChange={(e) =>
                setNumSessions(
                  isOngoing
                    ? Math.max(1, parseInt(e.target.value) || 1)
                    : Math.min(remainingSessions, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
            />
            <p className="text-xs text-muted-foreground">
              {isOngoing ? "Ongoing pathway — book as many as needed" : `${remainingSessions} remaining in course`}
            </p>
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

        {/* Editable preview */}
        {sessionDates.length > 0 && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Sessions ({sessionDates.length}) — adjust any individually
              </p>
              {customised && (
                <Button type="button" variant="ghost" size="sm" onClick={regenerate} className="h-8 gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Regenerate from settings
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {sessionDates.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
                    #{treatmentCourse.sessions_completed + i + 1}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal h-9",
                          isBefore(d, today) && "border-destructive text-destructive"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {format(d, "EEE, MMM d, yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={d}
                        onSelect={(date) => updateDateAt(i, date)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Select value={format(d, "HH:mm")} onValueChange={(v) => updateTimeAt(i, v)}>
                    <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {format(new Date(`2000-01-01T${t}`), "h:mm a")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => removeAt(i)}
                    aria-label={`Remove session ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addAnother} className="w-full gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add another session
            </Button>

            {(hasPastDate || hasDuplicateDay) && (
              <div className="space-y-1 text-xs">
                {hasPastDate && (
                  <p className="flex items-center gap-1.5 text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    One or more sessions are in the past — adjust before creating.
                  </p>
                )}
                {hasDuplicateDay && !hasPastDate && (
                  <p className="flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Two or more sessions are on the same day — confirm this is intended.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createBulk.isPending || sessionDates.length === 0 || hasPastDate}>
            {createBulk.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
            ) : (
              `Create ${sessionDates.length} Appointment${sessionDates.length === 1 ? "" : "s"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
