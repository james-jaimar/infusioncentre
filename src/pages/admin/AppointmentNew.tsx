import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addMinutes, setHours, setMinutes, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarIcon, AlertTriangle, Check, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePatients } from "@/hooks/usePatients";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useCreateAppointment, useCheckConflicts } from "@/hooks/useAppointments";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { useOnboardingReadiness } from "@/hooks/useOnboardingChecklist";
import { useGenerateChecklist } from "@/hooks/useOnboardingChecklist";

const formSchema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  appointment_type_id: z.string().min(1, "Please select an appointment type"),
  chair_id: z.string().optional(),
  assigned_nurse_id: z.string().optional(),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, "Please select a time"),
  duration_minutes: z.number().min(15, "Duration must be at least 15 minutes"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TIME_SLOTS = Array.from({ length: 22 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

export default function AppointmentNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get("patient_id") || "";
  const [patientSearch, setPatientSearch] = useState("");
  const [hasConflict, setHasConflict] = useState(false);

  const { data: patients = [], isLoading: loadingPatients } = usePatients();
  const { data: appointmentTypes = [] } = useAppointmentTypes();
  const { data: chairs = [] } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const createAppointment = useCreateAppointment();
  const checkConflicts = useCheckConflicts();
  const generateChecklist = useGenerateChecklist();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: preselectedPatientId,
      appointment_type_id: "",
      chair_id: "",
      assigned_nurse_id: "",
      time: "09:00",
      duration_minutes: 60,
      notes: "",
    },
  });

  const watchedPatientId = form.watch("patient_id");
  const watchedTypeId = form.watch("appointment_type_id");
  const readiness = useOnboardingReadiness(watchedPatientId || undefined, watchedTypeId || undefined);

  // Auto-select patient from URL param
  useEffect(() => {
    if (preselectedPatientId) {
      form.setValue("patient_id", preselectedPatientId);
    }
  }, [preselectedPatientId, form]);

  const filteredPatients = patients.filter((p) => {
    const searchLower = patientSearch.toLowerCase();
    return (
      p.first_name.toLowerCase().includes(searchLower) ||
      p.last_name.toLowerCase().includes(searchLower) ||
      p.id_number?.toLowerCase().includes(searchLower)
    );
  });

  const selectedType = appointmentTypes.find(
    (t) => t.id === form.watch("appointment_type_id")
  );

  const handleTypeChange = (typeId: string) => {
    const type = appointmentTypes.find((t) => t.id === typeId);
    if (type) {
      form.setValue("duration_minutes", type.default_duration_minutes);
    }
  };

  const handleCheckConflict = async () => {
    const chairId = form.getValues("chair_id");
    const date = form.getValues("date");
    const time = form.getValues("time");
    const duration = form.getValues("duration_minutes");

    if (!chairId || !date || !time) {
      setHasConflict(false);
      return;
    }

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledStart = setMinutes(setHours(date, hours), minutes);
    const scheduledEnd = addMinutes(scheduledStart, duration);

    const conflict = await checkConflicts.mutateAsync({
      chairId,
      scheduledStart,
      scheduledEnd,
    });

    setHasConflict(conflict);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const [hours, minutes] = data.time.split(":").map(Number);
      const scheduledStart = setMinutes(setHours(data.date, hours), minutes);

      await createAppointment.mutateAsync({
        patient_id: data.patient_id,
        appointment_type_id: data.appointment_type_id,
        chair_id: data.chair_id || null,
        assigned_nurse_id: data.assigned_nurse_id || null,
        scheduled_start: scheduledStart,
        duration_minutes: data.duration_minutes,
        notes: data.notes || "",
      });

      // Auto-generate onboarding checklist for this appointment type
      generateChecklist.mutate({
        patientId: data.patient_id,
        treatmentTypeIds: [data.appointment_type_id],
      });

      toast.success("Appointment created successfully");
      navigate("/admin/appointments");
    } catch (error) {
      toast.error("Failed to create appointment");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-semibold text-foreground">New Appointment</h1>
          <p className="text-muted-foreground">Schedule a new patient appointment</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Patient Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Patient</CardTitle>
                <CardDescription>Select the patient for this appointment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search patients by name or ID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-2">
                          {loadingPatients ? (
                            <p className="text-sm text-muted-foreground p-2">Loading...</p>
                          ) : filteredPatients.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-2">No patients found</p>
                          ) : (
                            filteredPatients.slice(0, 10).map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => field.onChange(patient.id)}
                                className={cn(
                                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                                  field.value === patient.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted"
                                )}
                              >
                                <div className="font-medium">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                {patient.id_number && (
                                  <div className="text-xs opacity-75">ID: {patient.id_number}</div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Appointment Type */}
            <Card>
              <CardHeader>
                <CardTitle>Appointment Type</CardTitle>
                <CardDescription>Select the type of treatment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="appointment_type_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          handleTypeChange(v);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {appointmentTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 rounded-full"
                                  style={{ backgroundColor: type.color }}
                                />
                                {type.name} ({type.default_duration_minutes} min)
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedType?.requires_consent && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Requires consent form
                  </Badge>
                )}

                {/* Onboarding Readiness Badge */}
                {watchedPatientId && watchedTypeId && !readiness.isLoading && readiness.required.length > 0 && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-md text-sm",
                    readiness.isReady
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  )}>
                    {readiness.isReady ? (
                      <>
                        <Check className="h-4 w-4" />
                        All {readiness.required.length} onboarding forms complete
                      </>
                    ) : (
                      <>
                        <ClipboardList className="h-4 w-4" />
                        {readiness.pending.length} of {readiness.required.length} required forms incomplete
                        <a
                          href={`/admin/patients/${watchedPatientId}#onboarding`}
                          className="underline ml-1"
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </>
                    )}
                  </div>
                )}

                {selectedType?.preparation_instructions && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    <strong>Preparation:</strong> {selectedType.preparation_instructions}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={15}
                          step={15}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Date & Time */}
            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>When should this appointment be scheduled?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              field.onChange(date);
                              handleCheckConflict();
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          handleCheckConflict();
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SLOTS.map((time) => (
                            <SelectItem key={time} value={time}>
                              {format(parseISO(`2000-01-01T${time}`), "h:mm a")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Chair Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Treatment Chair</CardTitle>
                <CardDescription>Assign a treatment chair (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="chair_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chair</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v === "none" ? "" : v);
                          handleCheckConflict();
                        }}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chair..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No chair assigned</SelectItem>
                          {chairs.map((chair) => (
                            <SelectItem key={chair.id} value={chair.id}>
                              {chair.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasConflict && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">This chair has a conflicting appointment at this time</span>
                  </div>
                )}

                {!hasConflict && form.watch("chair_id") && form.watch("date") && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-md">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Chair is available</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nurse Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Nurse</CardTitle>
                <CardDescription>Assign a nurse to this appointment (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="assigned_nurse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nurse</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select nurse..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No nurse assigned</SelectItem>
                          {nurses.map((nurse) => (
                            <SelectItem key={nurse.user_id} value={nurse.user_id}>
                              {nurse.first_name || ""} {nurse.last_name || ""} 
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Any additional notes for this appointment</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant notes..."
                        className="min-h-24"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAppointment.isPending || hasConflict}>
              {createAppointment.isPending ? "Creating..." : "Create Appointment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
