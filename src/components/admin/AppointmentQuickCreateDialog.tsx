import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format, setHours, setMinutes } from "date-fns";
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
import { Check, ChevronsUpDown, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/usePatients";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useCreateAppointment } from "@/hooks/useAppointments";

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

  const [patientId, setPatientId] = useState("");
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [typeId, setTypeId] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState(60);
  const [chairId, setChairId] = useState<string>("none");
  const [nurseId, setNurseId] = useState<string>("none");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setTime(format(defaultDate, "HH:mm"));
    setChairId(defaultChairId || "none");
    setPatientId("");
    setNotes("");
  }, [open, defaultDate, defaultChairId]);

  const selectedType = useMemo(
    () => types.find((t) => t.id === typeId),
    [types, typeId]
  );

  useEffect(() => {
    if (selectedType) setDuration(selectedType.default_duration_minutes);
  }, [selectedType]);

  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleCreate = async () => {
    if (!patientId) {
      toast.error("Pick a patient");
      return;
    }
    if (!typeId) {
      toast.error("Pick a treatment type");
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
                  <CommandInput placeholder="Search patients…" />
                  <CommandList>
                    <CommandEmpty>No patient found.</CommandEmpty>
                    <CommandGroup>
                      {patients.map((p) => (
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
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
            <Button onClick={handleCreate} disabled={create.isPending}>
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