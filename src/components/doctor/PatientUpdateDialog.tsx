import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSendMessage } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Send } from "lucide-react";

interface PatientUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  patientName: string;
  doctorId: string;
}

export function PatientUpdateDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  doctorId,
}: PatientUpdateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const sendMessage = useSendMessage();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [medicalAid, setMedicalAid] = useState("");
  const [icd10, setIcd10] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setPhone(""); setEmail(""); setMedicalAid(""); setIcd10(""); setNotes("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!phone && !email && !medicalAid && !icd10 && !notes.trim()) {
      toast({ title: "Please add at least one update", variant: "destructive" });
      return;
    }

    const lines = [`[Patient Update — ${patientName}]`];
    if (phone) lines.push(`• New phone: ${phone}`);
    if (email) lines.push(`• New email: ${email}`);
    if (medicalAid) lines.push(`• Medical aid update: ${medicalAid}`);
    if (icd10) lines.push(`• New ICD-10 / diagnosis: ${icd10}`);
    if (notes.trim()) lines.push("", notes.trim());

    setSubmitting(true);
    try {
      await sendMessage.mutateAsync({
        conversation_type: "admin_doctor",
        doctor_id: doctorId,
        sender_id: user.id,
        sender_role: "doctor",
        content: lines.join("\n"),
      });
      toast({ title: "Update sent to clinic" });
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Update to Clinic</DialogTitle>
          <DialogDescription>
            Suggest changes to {patientName}'s record. The clinic team will review and apply them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>New Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
            </div>
            <div>
              <Label>New Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div>
            <Label>Medical Aid Update</Label>
            <Input value={medicalAid} onChange={(e) => setMedicalAid(e.target.value)} placeholder="e.g. New scheme + member number" />
          </div>
          <div>
            <Label>New ICD-10 / Diagnosis</Label>
            <Input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="e.g. M05.79" />
          </div>
          <div>
            <Label>Additional Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Anything else the clinic should know..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
