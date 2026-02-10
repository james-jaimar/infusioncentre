import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  useTreatment,
  useUpdateTreatment,
  useTreatmentVitals,
  useAddVitals,
  useTreatmentMedications,
  useAddMedication,
} from "@/hooks/useTreatments";
import { useAppointment } from "@/hooks/useAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInMinutes } from "date-fns";
import {
  ArrowLeft,
  Clock,
  Heart,
  Activity,
  Thermometer,
  Pill,
  Plus,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { MedicationRoute } from "@/types/treatment";

function TreatmentTimer({ startedAt }: { startedAt: string | null }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="text-center">
      <p className="text-sm text-muted-foreground mb-1">Elapsed Time</p>
      <p className="text-4xl font-mono font-bold text-foreground tabular-nums">
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}

export default function NurseActiveTreatment() {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: treatment, isLoading } = useTreatment(treatmentId);
  const updateTreatment = useUpdateTreatment();
  const { data: vitals } = useTreatmentVitals(treatmentId);
  const addVitals = useAddVitals();
  const { data: medications } = useTreatmentMedications(treatmentId);
  const addMedication = useAddMedication();
  const { data: appointment } = useAppointment(treatment?.appointment_id);

  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [medsOpen, setMedsOpen] = useState(false);
  const [newVitals, setNewVitals] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
    notes: "",
  });
  const [newMed, setNewMed] = useState({
    medication_name: "",
    dosage: "",
    route: "iv" as MedicationRoute,
    lot_number: "",
    notes: "",
  });

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!treatment) return <div className="text-center py-12 text-muted-foreground">Treatment not found.</div>;

  const latestVitals = vitals?.length ? vitals[vitals.length - 1] : null;
  const isKetamine = appointment?.appointment_type?.name?.toLowerCase().includes("ketamine");
  const isCompleted = treatment.status === "completed" || treatment.status === "cancelled";

  const handleStartTreatment = async () => {
    try {
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: { status: "in_progress", started_at: new Date().toISOString() },
      });
      toast({ title: "Treatment started" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddVitals = async () => {
    if (!user?.id) return;
    try {
      await addVitals.mutateAsync({
        treatment_id: treatment.id,
        phase: "during",
        blood_pressure_systolic: newVitals.blood_pressure_systolic ? Number(newVitals.blood_pressure_systolic) : null,
        blood_pressure_diastolic: newVitals.blood_pressure_diastolic ? Number(newVitals.blood_pressure_diastolic) : null,
        heart_rate: newVitals.heart_rate ? Number(newVitals.heart_rate) : null,
        o2_saturation: newVitals.o2_saturation ? Number(newVitals.o2_saturation) : null,
        temperature: newVitals.temperature ? Number(newVitals.temperature) : null,
        weight_kg: null,
        respiratory_rate: null,
        pain_score: null,
        notes: newVitals.notes || null,
        recorded_by: user.id,
      });
      setVitalsOpen(false);
      setNewVitals({ blood_pressure_systolic: "", blood_pressure_diastolic: "", heart_rate: "", o2_saturation: "", temperature: "", notes: "" });
      toast({ title: "Vitals recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleAddMedication = async () => {
    if (!user?.id || !newMed.medication_name || !newMed.dosage) return;
    try {
      await addMedication.mutateAsync({
        treatment_id: treatment.id,
        medication_name: newMed.medication_name,
        dosage: newMed.dosage,
        route: newMed.route,
        administered_at: new Date().toISOString(),
        administered_by: user.id,
        lot_number: newMed.lot_number || null,
        notes: newMed.notes || null,
        diluent: null,
        infusion_rate: null,
        infusion_method: null,
        started_at: null,
        stopped_at: null,
        volume_infused_ml: null,
        site_assessment_pre: null,
        site_assessment_post: null,
      });
      setMedsOpen(false);
      setNewMed({ medication_name: "", dosage: "", route: "iv", lot_number: "", notes: "" });
      toast({ title: "Medication recorded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleEndTreatment = () => {
    navigate(`/nurse/discharge/${treatment.id}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/nurse/patients")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Button>

      {/* Header + Timer */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="py-6">
            <p className="font-semibold text-lg text-foreground">
              {appointment?.patient?.first_name} {appointment?.patient?.last_name}
            </p>
            <p className="text-muted-foreground">{appointment?.appointment_type?.name}</p>
            <div className="mt-2 flex gap-2">
              <Badge>{treatment.status.replace("_", " ")}</Badge>
              {isKetamine && <Badge variant="outline" className="border-amber-500 text-amber-600">Ketamine Protocol</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card className="flex items-center justify-center">
          <CardContent className="py-6">
            {treatment.status === "pending" ? (
              <Button onClick={handleStartTreatment} size="lg" className="h-14 text-lg px-8">
                Start Treatment Timer
              </Button>
            ) : (
              <TreatmentTimer startedAt={treatment.started_at} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latest Vitals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Current Vitals</CardTitle>
          {!isCompleted && (
            <Dialog open={vitalsOpen} onOpenChange={setVitalsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 h-11 min-w-[44px]">
                  <Plus className="h-4 w-4" /> Record Vitals
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Record Vitals</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>BP Systolic</Label>
                    <Input type="number" className="h-12 text-lg" value={newVitals.blood_pressure_systolic}
                      onChange={(e) => setNewVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} />
                  </div>
                  <div>
                    <Label>BP Diastolic</Label>
                    <Input type="number" className="h-12 text-lg" value={newVitals.blood_pressure_diastolic}
                      onChange={(e) => setNewVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Heart Rate</Label>
                    <Input type="number" className="h-12 text-lg" value={newVitals.heart_rate}
                      onChange={(e) => setNewVitals((v) => ({ ...v, heart_rate: e.target.value }))} />
                  </div>
                  <div>
                    <Label>O₂ Sat (%)</Label>
                    <Input type="number" className="h-12 text-lg" value={newVitals.o2_saturation}
                      onChange={(e) => setNewVitals((v) => ({ ...v, o2_saturation: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Temp (°C)</Label>
                    <Input type="number" step="0.1" className="h-12 text-lg" value={newVitals.temperature}
                      onChange={(e) => setNewVitals((v) => ({ ...v, temperature: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <Textarea value={newVitals.notes} onChange={(e) => setNewVitals((v) => ({ ...v, notes: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAddVitals} className="w-full h-12 mt-2">Save Vitals</Button>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {latestVitals ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <p className="text-muted-foreground text-center py-4">No vitals recorded yet.</p>
          )}
          {vitals && vitals.length > 1 && (
            <div className="mt-4 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">History ({vitals.length} readings)</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {vitals.map((v) => (
                  <div key={v.id} className="text-sm flex gap-4 text-muted-foreground">
                    <span className="font-mono">{format(new Date(v.recorded_at), "HH:mm")}</span>
                    <span>BP {v.blood_pressure_systolic}/{v.blood_pressure_diastolic}</span>
                    <span>HR {v.heart_rate}</span>
                    <span>O₂ {v.o2_saturation}%</span>
                    <Badge variant="outline" className="text-xs">{v.phase}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Medications</CardTitle>
          {!isCompleted && (
            <Dialog open={medsOpen} onOpenChange={setMedsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1 h-11 min-w-[44px]">
                  <Pill className="h-4 w-4" /> Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Administer Medication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Medication Name</Label>
                    <Input className="h-12 text-lg" value={newMed.medication_name}
                      onChange={(e) => setNewMed((m) => ({ ...m, medication_name: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Dosage</Label>
                    <Input className="h-12 text-lg" placeholder="e.g. 500mg" value={newMed.dosage}
                      onChange={(e) => setNewMed((m) => ({ ...m, dosage: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Route</Label>
                    <Select value={newMed.route} onValueChange={(v) => setNewMed((m) => ({ ...m, route: v as MedicationRoute }))}>
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
                    <Label>Lot Number</Label>
                    <Input value={newMed.lot_number} onChange={(e) => setNewMed((m) => ({ ...m, lot_number: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={newMed.notes} onChange={(e) => setNewMed((m) => ({ ...m, notes: e.target.value }))} />
                  </div>
                </div>
                <Button onClick={handleAddMedication} className="w-full h-12 mt-2" disabled={!newMed.medication_name || !newMed.dosage}>
                  Record Administration
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {medications?.length ? (
            <div className="space-y-3">
              {medications.map((med) => (
                <div key={med.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{med.medication_name}</p>
                    <p className="text-sm text-muted-foreground">{med.dosage} • {med.route.toUpperCase()}</p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{format(new Date(med.administered_at), "HH:mm")}</p>
                    {med.lot_number && <p className="text-xs">Lot: {med.lot_number}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No medications administered yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Ketamine link */}
      {isKetamine && !isCompleted && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-foreground">Ketamine Protocol Active</p>
                <p className="text-sm text-muted-foreground">Monitor every 15 minutes</p>
              </div>
            </div>
            <Button variant="outline" className="border-amber-500" onClick={() => navigate(`/nurse/ketamine/${treatment.id}`)}>
              Open Monitoring
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {!isCompleted && treatment.status === "in_progress" && (
        <div className="flex gap-3">
          <Button variant="destructive" size="lg" className="flex-1 h-14 text-lg" onClick={handleEndTreatment}>
            <CheckCircle className="mr-2 h-5 w-5" /> End Treatment & Discharge
          </Button>
        </div>
      )}
    </div>
  );
}
