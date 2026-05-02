import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Receipt, FilePlus2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useConvertReferralToCourse } from "@/hooks/useTreatmentCourses";
import { useActiveCourseTemplatesByType } from "@/hooks/useCourseTemplates";
import { isCustomType, isCustomRequest, stripCustomTag } from "@/lib/customReferral";
import { computeExpectedEndDate, FREQUENCY_LABEL, formatEndDateHint } from "@/lib/courseSchedule";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral?: {
    id: string;
    patient_id?: string | null;
    doctor_id?: string | null;
    patient_first_name?: string;
    patient_last_name?: string;
    diagnosis?: string | null;
    urgency?: string;
    prescription_notes?: string | null;
    treatment_requested?: string | null;
    treatment_type_id?: string | null;
    course_template_id?: string | null;
  } | null;
  patientId?: string;
}

export function ConvertReferralDialog({ open, onOpenChange, referral, patientId }: Props) {
  const navigate = useNavigate();
  const { data: appointmentTypes = [] } = useAppointmentTypes();
  const convertMutation = useConvertReferralToCourse();

  const [treatmentTypeId, setTreatmentTypeId] = useState("");
  const [courseTemplateId, setCourseTemplateId] = useState<string>("");
  const [totalSessions, setTotalSessions] = useState(1);
  const [preferredStartDate, setPreferredStartDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [touchedSessions, setTouchedSessions] = useState(false);
  const [touchedNotes, setTouchedNotes] = useState(false);
  const [otherAction, setOtherAction] = useState<"adhoc" | "promote">("adhoc");

  const { data: variants = [] } = useActiveCourseTemplatesByType(treatmentTypeId || undefined);

  const sourceType = appointmentTypes.find((t: any) => t.id === referral?.treatment_type_id);
  const isOther = isCustomType(sourceType?.name) || isCustomRequest(referral?.treatment_requested);
  const customDesc = isCustomRequest(referral?.treatment_requested)
    ? stripCustomTag(referral?.treatment_requested)
    : (referral?.treatment_requested || "");

  // Initialize / reset on open
  useEffect(() => {
    if (open && referral) {
      setTreatmentTypeId(referral.treatment_type_id || "");
      setCourseTemplateId(referral.course_template_id || "");
      setNotes(referral.prescription_notes || "");
      setTouchedSessions(false);
      setTouchedNotes(false);
    }
    if (!open) {
      setTreatmentTypeId("");
      setCourseTemplateId("");
      setTotalSessions(1);
      setPreferredStartDate(undefined);
      setNotes("");
      setTouchedSessions(false);
      setTouchedNotes(false);
    }
  }, [open, referral]);

  // Pre-fill from selected template
  useEffect(() => {
    if (!courseTemplateId) return;
    const tmpl = variants.find((v) => v.id === courseTemplateId);
    if (!tmpl) return;
    if (!touchedSessions) setTotalSessions(tmpl.default_sessions);
    if (!touchedNotes && tmpl.medication_notes) {
      const original = referral?.prescription_notes?.trim();
      const merged = [tmpl.medication_notes, original ? `\n\nDoctor's notes:\n${original}` : ""].join("");
      setNotes(merged);
    }
  }, [courseTemplateId, variants, touchedSessions, touchedNotes, referral?.prescription_notes]);

  const effectivePatientId = patientId || referral?.patient_id || undefined;
  const selectedTemplate = variants.find((v) => v.id === courseTemplateId);
  const computedEndDate = preferredStartDate
    ? computeExpectedEndDate(preferredStartDate, totalSessions, selectedTemplate?.default_frequency)
    : null;

  const handleConvert = async () => {
    if (!referral || !effectivePatientId || !treatmentTypeId) return;

    try {
      await convertMutation.mutateAsync({
        referral_id: referral.id,
        patient_id: effectivePatientId,
        doctor_id: referral.doctor_id || undefined,
        treatment_type_id: treatmentTypeId,
        course_template_id: courseTemplateId || null,
        total_sessions_planned: totalSessions,
        expected_end_date: computedEndDate ? format(computedEndDate, "yyyy-MM-dd") : undefined,
        notes: notes || undefined,
      });
      toast.success("Referral converted to treatment course");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to convert referral");
    }
  };

  const handleAdhoc = () => {
    if (!effectivePatientId) return;
    onOpenChange(false);
    toast.success("Add the work as line items on the next invoice", {
      description: "Open the patient's billing tab to record the visit.",
    });
    navigate(`/admin/patients/${effectivePatientId}?tab=billing`);
  };

  const handlePromote = () => {
    if (!referral) return;
    const shortId = referral.id.slice(0, 8);
    const name = customDesc || "Custom treatment";
    onOpenChange(false);
    window.open(
      `/admin/course-templates?from_referral=${shortId}&name=${encodeURIComponent(name)}`,
      "_blank"
    );
    toast.info("Opening Course Templates in a new tab", {
      description: "Define the treatment type, then come back to convert.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Convert Referral to Treatment Course
            {isOther && (
              <Badge variant="outline" className="gap-1 border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-700">
                <Sparkles className="h-3 w-3" /> Custom
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isOther
              ? "This referral was flagged as a custom request. Choose how to handle it."
              : "Configure the treatment course based on this referral."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {referral && (
            <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/50">
              <p><strong>Patient:</strong> {referral.patient_first_name} {referral.patient_last_name}</p>
              <p><strong>Diagnosis:</strong> {referral.diagnosis || "—"}</p>
              <p><strong>Urgency:</strong> {referral.urgency || "—"}</p>
              <p><strong>Treatment Requested:</strong> {customDesc || "—"}</p>
              <p><strong>Prescription:</strong> {referral.prescription_notes || "—"}</p>
            </div>
          )}

          {isOther ? (
            <>
              <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Doctor's request
                </p>
                <p className="text-sm whitespace-pre-wrap">{customDesc || "—"}</p>
              </div>

              <div className="space-y-2">
                <Label>How should this be handled?</Label>
                <RadioGroup value={otherAction} onValueChange={(v) => setOtherAction(v as any)} className="space-y-2">
                  <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="adhoc" id="adhoc" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <Receipt className="h-4 w-4" /> Handle as ad-hoc billable item
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Skip creating a course. You'll add the work as line items on the patient's next invoice.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="promote" id="promote" className="mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <FilePlus2 className="h-4 w-4" /> Create a new treatment type from this
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Opens Course Templates in a new tab, pre-filled. Save it, then return here to convert.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Treatment Type</Label>
                <Select
                  value={treatmentTypeId}
                  onValueChange={(v) => {
                    setTreatmentTypeId(v);
                    setCourseTemplateId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {treatmentTypeId && variants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Course Template</Label>
                    {referral?.course_template_id && courseTemplateId === referral.course_template_id && (
                      <Badge variant="secondary" className="text-xs">From doctor</Badge>
                    )}
                  </div>
                  <Select value={courseTemplateId} onValueChange={setCourseTemplateId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select variant (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} — {v.default_sessions} session{v.default_sessions === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate?.description && (
                    <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Sessions Planned</Label>
                  <Input
                    type="number"
                    min={1}
                    value={totalSessions}
                    onChange={(e) => {
                      setTouchedSessions(true);
                      setTotalSessions(parseInt(e.target.value) || 1);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preferred Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !preferredStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {preferredStartDate ? format(preferredStartDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={preferredStartDate}
                        onSelect={setPreferredStartDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {preferredStartDate && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                  {computedEndDate ? (
                    <>
                      <p>
                        <span className="text-muted-foreground">Expected end:</span>{" "}
                        <span className="font-medium text-foreground">~ {formatEndDateHint(computedEndDate)}</span>
                      </p>
                      <p className="text-muted-foreground">
                        {totalSessions} session{totalSessions === 1 ? "" : "s"}
                        {selectedTemplate?.default_frequency
                          ? `, ${FREQUENCY_LABEL[selectedTemplate.default_frequency]}`
                          : ""}
                        . You can finalise individual session dates from the course schedule.
                      </p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">
                      Pick a start date — schedule the rest of the sessions at your convenience.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => {
                    setTouchedNotes(true);
                    setNotes(e.target.value);
                  }}
                  placeholder="Optional notes for this treatment course..."
                  rows={4}
                />
              </div>
            </>
          )}

          {!effectivePatientId && (
            <p className="text-sm text-destructive">
              No patient is linked to this referral. Link a patient on the Patient Match tab first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {isOther ? (
            <Button
              onClick={otherAction === "adhoc" ? handleAdhoc : handlePromote}
              disabled={!referral || !effectivePatientId}
            >
              {otherAction === "adhoc" ? "Go to billing" : "Open template editor"}
            </Button>
          ) : (
            <Button
              onClick={handleConvert}
              disabled={!referral || !effectivePatientId || !treatmentTypeId || convertMutation.isPending}
            >
              {convertMutation.isPending ? "Converting..." : "Convert to Course"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
