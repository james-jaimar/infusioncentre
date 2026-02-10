import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { useCreateReferral } from "@/hooks/useReferrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function DoctorNewReferral() {
  const { data: doctor } = useDoctorProfile();
  const createReferral = useCreateReferral();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    diagnosis: "",
    treatment_requested: "",
    prescription_notes: "",
    urgency: "routine" as "routine" | "urgent",
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor?.id) {
      toast({ title: "Doctor profile not found", variant: "destructive" });
      return;
    }
    if (!form.patient_first_name || !form.patient_last_name) {
      toast({ title: "Patient name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await createReferral.mutateAsync({
        doctor_id: doctor.id,
        ...form,
      });
      toast({ title: "Referral submitted successfully" });
      navigate("/doctor/referrals");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>New Referral</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Patient Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input
                    value={form.patient_first_name}
                    onChange={(e) => update("patient_first_name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input
                    value={form.patient_last_name}
                    onChange={(e) => update("patient_last_name", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.patient_email}
                    onChange={(e) => update("patient_email", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.patient_phone}
                    onChange={(e) => update("patient_phone", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">Referral Details</h3>
              <div>
                <Label>Diagnosis</Label>
                <Textarea
                  value={form.diagnosis}
                  onChange={(e) => update("diagnosis", e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <Label>Treatment Requested</Label>
                <Input
                  value={form.treatment_requested}
                  onChange={(e) => update("treatment_requested", e.target.value)}
                />
              </div>
              <div>
                <Label>Prescription / Notes</Label>
                <Textarea
                  value={form.prescription_notes}
                  onChange={(e) => update("prescription_notes", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Urgency</Label>
                <Select
                  value={form.urgency}
                  onValueChange={(v) => update("urgency", v)}
                >
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

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Submitting..." : "Submit Referral"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
