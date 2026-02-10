import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAddVitals, useTreatmentVitals } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Heart, Activity, Thermometer, Plus } from "lucide-react";
import type { VitalsPhase } from "@/types/treatment";

interface JobCardVitalsProps {
  treatmentId: string;
  phase?: VitalsPhase;
  isCompleted?: boolean;
}

export default function JobCardVitals({ treatmentId, phase = "during", isCompleted }: JobCardVitalsProps) {
  const { user } = useAuth();
  const { data: vitals } = useTreatmentVitals(treatmentId);
  const addVitals = useAddVitals();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
    respiratory_rate: "",
    pain_score: "",
    notes: "",
  });

  const latestVitals = vitals?.length ? vitals[vitals.length - 1] : null;

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      await addVitals.mutateAsync({
        treatment_id: treatmentId,
        phase,
        blood_pressure_systolic: form.blood_pressure_systolic ? Number(form.blood_pressure_systolic) : null,
        blood_pressure_diastolic: form.blood_pressure_diastolic ? Number(form.blood_pressure_diastolic) : null,
        heart_rate: form.heart_rate ? Number(form.heart_rate) : null,
        o2_saturation: form.o2_saturation ? Number(form.o2_saturation) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        weight_kg: null,
        respiratory_rate: form.respiratory_rate ? Number(form.respiratory_rate) : null,
        pain_score: form.pain_score ? Number(form.pain_score) : null,
        notes: form.notes || null,
        recorded_by: user.id,
      });
      setOpen(false);
      setForm({ blood_pressure_systolic: "", blood_pressure_diastolic: "", heart_rate: "", o2_saturation: "", temperature: "", respiratory_rate: "", pain_score: "", notes: "" });
      toast({ title: "Vitals recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Vitals</CardTitle>
        {!isCompleted && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 h-11 min-w-[44px]">
                <Plus className="h-4 w-4" /> Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Vitals</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>BP Systolic</Label>
                  <Input type="number" className="h-12 text-lg" value={form.blood_pressure_systolic}
                    onChange={(e) => setForm((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} />
                </div>
                <div>
                  <Label>BP Diastolic</Label>
                  <Input type="number" className="h-12 text-lg" value={form.blood_pressure_diastolic}
                    onChange={(e) => setForm((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} />
                </div>
                <div>
                  <Label>Heart Rate</Label>
                  <Input type="number" className="h-12 text-lg" value={form.heart_rate}
                    onChange={(e) => setForm((v) => ({ ...v, heart_rate: e.target.value }))} />
                </div>
                <div>
                  <Label>O₂ Sat (%)</Label>
                  <Input type="number" className="h-12 text-lg" value={form.o2_saturation}
                    onChange={(e) => setForm((v) => ({ ...v, o2_saturation: e.target.value }))} />
                </div>
                <div>
                  <Label>Temp (°C)</Label>
                  <Input type="number" step="0.1" className="h-12 text-lg" value={form.temperature}
                    onChange={(e) => setForm((v) => ({ ...v, temperature: e.target.value }))} />
                </div>
                <div>
                  <Label>Resp Rate</Label>
                  <Input type="number" className="h-12 text-lg" value={form.respiratory_rate}
                    onChange={(e) => setForm((v) => ({ ...v, respiratory_rate: e.target.value }))} placeholder="16" />
                </div>
                <div className="col-span-2">
                  <Label>Pain Score (0-10)</Label>
                  <Input type="number" min="0" max="10" className="h-12 text-lg" value={form.pain_score}
                    onChange={(e) => setForm((v) => ({ ...v, pain_score: e.target.value }))} placeholder="0" />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm((v) => ({ ...v, notes: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full h-12 mt-2" disabled={addVitals.isPending}>Save Vitals</Button>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {latestVitals ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">BP</p>
                <p className="font-semibold">{latestVitals.blood_pressure_systolic}/{latestVitals.blood_pressure_diastolic}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">HR</p>
                <p className="font-semibold">{latestVitals.heart_rate} bpm</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">O₂</p>
                <p className="font-semibold">{latestVitals.o2_saturation}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Temp</p>
                <p className="font-semibold">{latestVitals.temperature}°C</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recorded</p>
              <p className="text-sm">{format(new Date(latestVitals.recorded_at), "HH:mm")}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-3 text-sm">No vitals recorded yet.</p>
        )}

        {vitals && vitals.length > 1 && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">History ({vitals.length} readings)</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {vitals.map((v) => (
                <div key={v.id} className="text-xs flex gap-3 text-muted-foreground">
                  <span className="font-mono">{format(new Date(v.recorded_at), "HH:mm")}</span>
                  <span>BP {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>
                  <span>HR {v.heart_rate}</span>
                  <span>O₂ {v.o2_saturation}%</span>
                  <Badge variant="outline" className="text-xs h-5">{v.phase}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
