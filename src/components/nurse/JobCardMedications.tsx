import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAddMedication, useTreatmentMedications } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Pill, Plus } from "lucide-react";
import type { MedicationRoute } from "@/types/treatment";

interface JobCardMedicationsProps {
  treatmentId: string;
  isCompleted?: boolean;
}

export default function JobCardMedications({ treatmentId, isCompleted }: JobCardMedicationsProps) {
  const { user } = useAuth();
  const { data: medications } = useTreatmentMedications(treatmentId);
  const addMedication = useAddMedication();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    medication_name: "",
    dosage: "",
    route: "iv" as MedicationRoute,
    lot_number: "",
    notes: "",
    diluent: "",
    infusion_rate: "",
    infusion_method: "",
  });

  const handleSave = async () => {
    if (!user?.id || !form.medication_name || !form.dosage) return;
    try {
      await addMedication.mutateAsync({
        treatment_id: treatmentId,
        medication_name: form.medication_name,
        dosage: form.dosage,
        route: form.route,
        administered_at: new Date().toISOString(),
        administered_by: user.id,
        lot_number: form.lot_number || null,
        notes: form.notes || null,
        diluent: form.diluent || null,
        infusion_rate: form.infusion_rate || null,
        infusion_method: form.infusion_method || null,
        started_at: new Date().toISOString(),
        stopped_at: null,
        volume_infused_ml: null,
        site_assessment_pre: null,
        site_assessment_post: null,
      });
      setOpen(false);
      setForm({ medication_name: "", dosage: "", route: "iv", lot_number: "", notes: "", diluent: "", infusion_rate: "", infusion_method: "" });
      toast({ title: "Medication recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Medications</CardTitle>
        {!isCompleted && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 h-11 min-w-[44px]">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Administer Medication</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Medication Name</Label>
                  <Input className="h-12 text-lg" value={form.medication_name}
                    onChange={(e) => setForm((m) => ({ ...m, medication_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Dosage</Label>
                  <Input className="h-12 text-lg" placeholder="e.g. 500mg" value={form.dosage}
                    onChange={(e) => setForm((m) => ({ ...m, dosage: e.target.value }))} />
                </div>
                <div>
                  <Label>Route</Label>
                  <Select value={form.route} onValueChange={(v) => setForm((m) => ({ ...m, route: v as MedicationRoute }))}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iv">IV</SelectItem>
                      <SelectItem value="oral">Oral</SelectItem>
                      <SelectItem value="im">IM</SelectItem>
                      <SelectItem value="sc">SC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Diluent</Label>
                  <Input value={form.diluent} onChange={(e) => setForm((m) => ({ ...m, diluent: e.target.value }))} placeholder="e.g., 250ml Normal Saline" />
                </div>
                <div>
                  <Label>Infusion Rate</Label>
                  <Input value={form.infusion_rate} onChange={(e) => setForm((m) => ({ ...m, infusion_rate: e.target.value }))} placeholder="e.g., 125 ml/hr" />
                </div>
                <div>
                  <Label>Method</Label>
                  <Select value={form.infusion_method || "none"} onValueChange={(v) => setForm((m) => ({ ...m, infusion_method: v === "none" ? "" : v }))}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select</SelectItem>
                      <SelectItem value="continuous">Continuous</SelectItem>
                      <SelectItem value="intermittent">Intermittent</SelectItem>
                      <SelectItem value="bolus">Bolus</SelectItem>
                      <SelectItem value="push">IV Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lot Number</Label>
                  <Input value={form.lot_number} onChange={(e) => setForm((m) => ({ ...m, lot_number: e.target.value }))} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((m) => ({ ...m, notes: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full h-12 mt-2" disabled={!form.medication_name || !form.dosage || addMedication.isPending}>
                Record Administration
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {medications?.length ? (
          <div className="space-y-2">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium text-sm">{med.medication_name}</p>
                  <p className="text-xs text-muted-foreground">{med.dosage} • {med.route.toUpperCase()}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{format(new Date(med.administered_at), "HH:mm")}</p>
                  {med.lot_number && <p>Lot: {med.lot_number}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3 text-sm">No medications administered yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
