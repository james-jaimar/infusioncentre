import { useState } from "react";
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
import { useReferrals } from "@/hooks/useReferrals";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useConvertReferralToCourse } from "@/hooks/useTreatmentCourses";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertReferralDialog({ open, onOpenChange }: Props) {
  const { data: referrals = [] } = useReferrals();
  const { data: appointmentTypes = [] } = useAppointmentTypes();
  const convertMutation = useConvertReferralToCourse();

  const pendingReferrals = referrals.filter(
    (r: any) => r.status === "pending" || r.status === "accepted"
  );

  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [treatmentTypeId, setTreatmentTypeId] = useState("");
  const [totalSessions, setTotalSessions] = useState(1);
  const [expectedEndDate, setExpectedEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const selectedReferral = pendingReferrals.find((r: any) => r.id === selectedReferralId);

  const handleConvert = async () => {
    if (!selectedReferral || !treatmentTypeId) return;

    try {
      await convertMutation.mutateAsync({
        referral_id: selectedReferral.id,
        patient_id: selectedReferral.patient_id,
        doctor_id: selectedReferral.doctor_id,
        treatment_type_id: treatmentTypeId,
        total_sessions_planned: totalSessions,
        expected_end_date: expectedEndDate || undefined,
        notes: notes || undefined,
      });
      toast.success("Referral converted to treatment course");
      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast.error("Failed to convert referral");
    }
  };

  const resetForm = () => {
    setSelectedReferralId("");
    setTreatmentTypeId("");
    setTotalSessions(1);
    setExpectedEndDate("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert Referral to Treatment Course</DialogTitle>
          <DialogDescription>
            Select a pending referral and configure the treatment course.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Referral</Label>
            <Select value={selectedReferralId} onValueChange={setSelectedReferralId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a referral..." />
              </SelectTrigger>
              <SelectContent>
                {pendingReferrals.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No pending referrals</div>
                ) : (
                  pendingReferrals.map((r: any) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.patient_first_name} {r.patient_last_name} — {r.treatment_requested || "Unspecified"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedReferral && (
            <div className="rounded-md border p-3 text-sm space-y-1 bg-muted/50">
              <p><strong>Patient:</strong> {selectedReferral.patient_first_name} {selectedReferral.patient_last_name}</p>
              <p><strong>Diagnosis:</strong> {selectedReferral.diagnosis || "—"}</p>
              <p><strong>Urgency:</strong> {selectedReferral.urgency}</p>
              <p><strong>Prescription:</strong> {selectedReferral.prescription_notes || "—"}</p>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConvert}
            disabled={!selectedReferralId || !treatmentTypeId || convertMutation.isPending}
          >
            {convertMutation.isPending ? "Converting..." : "Convert to Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
