import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useConvertReferralToCourse } from "@/hooks/useTreatmentCourses";

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
  } | null;
  patientId?: string;
}

export function ConvertReferralDialog({ open, onOpenChange, referral, patientId }: Props) {
  const { data: appointmentTypes = [] } = useAppointmentTypes();
  const convertMutation = useConvertReferralToCourse();

  const [treatmentTypeId, setTreatmentTypeId] = useState("");
  const [totalSessions, setTotalSessions] = useState(1);
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Pre-fill treatment type from referral when opening
  useEffect(() => {
    if (open && referral) {
      setTreatmentTypeId(referral.treatment_type_id || "");
      setNotes(referral.prescription_notes || "");
    }
    if (!open) {
      setTreatmentTypeId("");
      setTotalSessions(1);
      setExpectedEndDate("");
      setNotes("");
    }
  }, [open, referral]);

  const effectivePatientId = patientId || referral?.patient_id || undefined;

  const handleConvert = async () => {
    if (!referral || !effectivePatientId || !treatmentTypeId) return;

    try {
      await convertMutation.mutateAsync({
        referral_id: referral.id,
        patient_id: effectivePatientId,
        doctor_id: referral.doctor_id || undefined,
        treatment_type_id: treatmentTypeId,
        total_sessions_planned: totalSessions,
        expected_end_date: expectedEndDate || undefined,
        notes: notes || undefined,
      });
      toast.success("Referral converted to treatment course");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to convert referral");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert Referral to Treatment Course</DialogTitle>
          <DialogDescription>
            Configure the treatment course based on this referral.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {referral && (
            <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/50">
              <p><strong>Patient:</strong> {referral.patient_first_name} {referral.patient_last_name}</p>
              <p><strong>Diagnosis:</strong> {referral.diagnosis || "—"}</p>
              <p><strong>Urgency:</strong> {referral.urgency || "—"}</p>
              <p><strong>Treatment Requested:</strong> {referral.treatment_requested || "—"}</p>
              <p><strong>Prescription:</strong> {referral.prescription_notes || "—"}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Treatment Type</Label>
            <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Sessions Planned</Label>
              <Input
                type="number"
                min={1}
                value={totalSessions}
                onChange={(e) => setTotalSessions(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>Expected End Date</Label>
              <Input
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for this treatment course..."
              rows={3}
            />
          </div>

          {!effectivePatientId && (
            <p className="text-sm text-destructive">
              No patient is linked to this referral. Link a patient on the Patient Match tab first.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConvert}
            disabled={!referral || !effectivePatientId || !treatmentTypeId || convertMutation.isPending}
          >
            {convertMutation.isPending ? "Converting..." : "Convert to Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
