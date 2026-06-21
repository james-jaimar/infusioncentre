import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, setHours, setMinutes, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertTriangle, Check, ChevronsUpDown, ExternalLink, Loader2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients, useCreatePatientQuick } from "@/hooks/usePatients";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useCreateAppointment, useAppointments } from "@/hooks/useAppointments";
import { startOfDay, endOfDay } from "date-fns";

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: Date;
  defaultChairId?: string | null;
}

export function AppointmentQuickCreateDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultChairId,
}: Props) {
  const navigate = useNavigate();
  const { data: patients = [] } = usePatients();
  const { data: types = [] } = useAppointmentTypes();
  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const create = useCreateAppointment();
  const createPatient = useCreatePatientQuick();
  // For conflict detection — only fetch the appointments on this day
  const { data: dayAppts = [] } = useAppointments(
    startOfDay(defaultDate),
    endOfDay(defaultDate)
  );

  const [patientId, setPatientId] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [typeId, setTypeId] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [chairId, setChairId] = useState<string>("none");
  const [nurseId, setNurseId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  // Inline "+ new patient" mini-form
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    if (!open) return;
    setTime(format(defaultDate, "HH:mm"));
    setChairId(defaultChairId || "none");
    setPatientId("");
    setNotes("");
    setShowNewPatient(false);
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setPatientSearch("");
  }, [open, defaultDate, defaultChairId]);

  const selectedType = useMemo(
    () => types.find((t) => t.id === typeId),
    [types, typeId]
  );

  useEffect(() => {
    if (selectedType) setDuration(selectedType.default_duration_minutes);
  }, [selectedType]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  // Live conflict detection for the chosen chair/time/duration
  const conflict = useMemo(() => {
    if (chairId === "none") return null;
    const [h, m] = time.split(":").map(Number);
    const start = setMinutes(setHours(defaultDate, h), m);
    const end = new Date(start.getTime() + duration * 60_000);
    return dayAppts.find(
      (a) =>
        a.chair_id === chairId &&
        a.status !== "cancelled" &&
        a.status !== "no_show" &&
        a.status !== "rescheduled" &&
        parseISO(a.scheduled_start) < end &&
        parseISO(a.scheduled_end) > start
    );
  }, [chairId, time, duration, defaultDate, dayAppts]);

  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients.slice(0, 50);
    return patients
      .filter((p) =>
        `${p.first_name} ${p.last_name} ${p.phone ?? ""} ${p.email ?? ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 50);
  }, [patients, patientSearch]);

  const handleCreateQuickPatient = async () => {
    if (!newFirstName.trim() || !newLastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }
    try {
      const p = await createPatient.mutateAsync({
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail || null,
        phone: newPhone || null,
      });
      setPatientId(p.id);
      setShowNewPatient(false);
      toast.success(`Added ${p.first_name} ${p.last_name}`);
    } catch (e) {
      toast.error("Couldn't create patient");
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!patientId) {
      toast.error("Pick a patient");
      return;
    }
    if (!typeId) {
      toast.error("Pick a treatment type");
      return;
    }
    if (conflict) {
      toast.error("That chair is busy at the selected time");
      return;
    }
    const [h, m] = time.split(":").map(Number);
    const start = setMinutes(setHours(defaultDate, h), m);

    try {
      await create.mutateAsync({
        patient_id: patientId,
        appointment_type_id: typeId,
        chair_id: chairId === "none" ? null : chairId,
        assigned_nurse_id: nurseId === "none" ? null : nurseId,
        scheduled_start: start,
        duration_minutes: duration,
        notes,
      });
      toast.success("Appointment created");
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to create");
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            {format(defaultDate, "EEEE, MMM d, yyyy")}
            {defaultChairId && chairs.find((c) => c.id === defaultChairId)
              ? ` · ${chairs.find((c) => c.id === defaultChairId)?.name}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Patient</Label>
            {showNewPatient ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Add new patient
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => setShowNewPatient(false)}
                  >
                    Cancel
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First name"
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                  />
                  <Input
                    placeholder="Last name"
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                  />
                  <Input
                    placeholder="Mobile"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={handleCreateQuickPatient}
                  disabled={createPatient.isPending}
                >
                  {createPatient.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="mr-1 h-3.5 w-3.5" />
                      Save patient
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Full patient file can be completed later from the patient page.
                </p>
              </div>
            ) : (
            <Popover open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  {selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : "Search patient…"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput
                    placeholder="Search patients…"
                    value={patientSearch}
                    onValueChange={setPatientSearch}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
                        onClick={() => {
                          // Pre-fill name from the search box if it looks like a name
                          const parts = patientSearch.trim().split(/\s+/);
                          setNewFirstName(parts[0] || "");
                          setNewLastName(parts.slice(1).join(" ") || "");
                          setShowNewPatient(true);
                          setPatientPickerOpen(false);
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Add &ldquo;{patientSearch || "new patient"}&rdquo;
                      </button>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__add_new__"
                        onSelect={() => {
                          const parts = patientSearch.trim().split(/\s+/);
                          setNewFirstName(parts[0] || "");
                          setNewLastName(parts.slice(1).join(" ") || "");
                          setShowNewPatient(true);
                          setPatientPickerOpen(false);
                        }}
                        className="text-primary"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add new patient…
                      </CommandItem>
                      {filteredPatients.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.first_name} ${p.last_name}`}
                          onSelect={() => {
                            setPatientId(p.id);
                            setPatientPickerOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              patientId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {p.first_name} {p.last_name}
                          {p.phone && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {p.phone}
                            </span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Treatment type</Label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>Duration (mins)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value) || 60)}
              />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2 col-span-2">
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

          {conflict && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">
                  {chairs.find((c) => c.id === chairId)?.name ?? "That chair"} is busy
                </div>
                <div>
                  {format(parseISO(conflict.scheduled_start), "h:mm a")}–
                  {format(parseISO(conflict.scheduled_end), "h:mm a")} ·{" "}
                  {conflict.patient.first_name} {conflict.patient.last_name} (
                  {conflict.appointment_type.name})
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              navigate("/admin/appointments/new");
            }}
          >
            <ExternalLink className="mr-1 h-3.5 w-3.5" />
            Open full form
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={create.isPending || !!conflict}>
              {create.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create appointment"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}