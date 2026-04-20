import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateReferral } from "@/hooks/useReferrals";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { FilePlus2 } from "lucide-react";
import { isCustomType, tagCustomRequest } from "@/lib/customReferral";

interface FollowUpReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    phone?: string | null;
    medical_aid_name?: string | null;
    medical_aid_number?: string | null;
    medical_aid_main_member?: string | null;
  };
  doctorId: string;
}

export function FollowUpReferralDialog({
  open,
  onOpenChange,
  patient,
  doctorId,
}: FollowUpReferralDialogProps) {
  const { toast } = useToast();
  const createReferral = useCreateReferral();
  const { data: appointmentTypes } = useAppointmentTypes();
  const activeTypes = appointmentTypes?.filter((t: any) => t.is_active) || [];

  const [diagnosis, setDiagnosis] = useState("");
  const [icd10, setIcd10] = useState("");
  const [treatmentRequested, setTreatmentRequested] = useState("");
  const [treatmentTypeId, setTreatmentTypeId] = useState("");
  const [prescription, setPrescription] = useState("");
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<"routine" | "urgent">("routine");
  const [customDescription, setCustomDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedType = activeTypes.find((t: any) => t.id === treatmentTypeId);
  const isOther = isCustomType(selectedType?.name);

  const handleSubmit = async () => {
    if (isOther && !customDescription.trim()) {
      toast({ title: "Please describe the requested treatment", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const icdArr = icd10 ? icd10.split(",").map(s => s.trim()).filter(Boolean) : [];
      const treatmentRequestedFinal = isOther
        ? tagCustomRequest(customDescription.trim() + (treatmentRequested ? ` — ${treatmentRequested}` : ""))
        : (treatmentRequested || undefined);
      await createReferral.mutateAsync({
        doctor_id: doctorId,
        patient_first_name: patient.first_name,
        patient_last_name: patient.last_name,
        patient_email: patient.email || undefined,
        patient_phone: patient.phone || undefined,
        diagnosis: diagnosis || undefined,
        treatment_requested: treatmentRequestedFinal,
        prescription_notes: prescription || undefined,
        urgency,
        status: "pending",
        medical_aid_scheme: patient.medical_aid_name || null,
        medical_aid_number: patient.medical_aid_number || null,
        medical_aid_main_member: patient.medical_aid_main_member || null,
        icd10_codes: icdArr.length ? icdArr : null,
        reason_for_referral: reason || null,
        treatment_type_id: treatmentTypeId || null,
      } as any);

      toast({ title: "Follow-up referral submitted" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Follow-up Referral</DialogTitle>
          <DialogDescription>
            New treatment request for <strong>{patient.first_name} {patient.last_name}</strong>. Patient demographics are pre-filled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Reason for Follow-up</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Why is this follow-up needed?" />
          </div>
          <div>
            <Label>Diagnosis</Label>
            <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>ICD-10 Codes</Label>
            <Input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="Comma-separated, e.g. M05.79, M06.09" />
          </div>
          {activeTypes.length > 0 && (
            <div>
              <Label>Treatment Type</Label>
              <Select value={treatmentTypeId} onValueChange={setTreatmentTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select treatment type..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTypes.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isOther && (
                <p className="text-xs text-muted-foreground mt-1">
                  Use this if the treatment isn't listed. Our team will contact you to confirm.
                </p>
              )}
            </div>
          )}
          {isOther && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
              <Label>Describe the requested treatment *</Label>
              <Textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
                placeholder="Tell us what you need — medication, indication, anything specific..."
              />
            </div>
          )}
          <div>
            <Label>Treatment Requested</Label>
            <Input value={treatmentRequested} onChange={(e) => setTreatmentRequested(e.target.value)} placeholder="e.g. Infliximab infusion" />
          </div>
          <div>
            <Label>Prescription / Notes</Label>
            <Textarea value={prescription} onChange={(e) => setPrescription(e.target.value)} rows={3} placeholder="Dosage, frequency, special instructions..." />
          </div>
          <div>
            <Label>Urgency</Label>
            <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine">Routine</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            {submitting ? "Submitting..." : "Submit Referral"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
