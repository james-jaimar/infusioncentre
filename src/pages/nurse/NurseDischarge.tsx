import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useTreatment,
  useUpdateTreatment,
  useAddVitals,
  useAddAssessment,
} from "@/hooks/useTreatments";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle } from "lucide-react";

const dischargeChecklist = [
  "Post-treatment vitals within normal range",
  "No signs of adverse reaction",
  "IV site checked and dressed",
  "Patient alert and oriented",
  "Discharge instructions provided to patient",
  "Follow-up appointment discussed",
  "Patient able to mobilise safely",
  "Emergency contact information confirmed",
];

export default function NurseDischarge() {
  const { treatmentId } = useParams<{ treatmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: treatment, isLoading } = useTreatment(treatmentId);
  const updateTreatment = useUpdateTreatment();
  const updateAppointment = useUpdateAppointment();
  const addVitals = useAddVitals();
  const addAssessment = useAddAssessment();

  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(dischargeChecklist.length).fill(false));
  const [vitals, setVitals] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!treatment) return <div className="text-center py-12 text-muted-foreground">Treatment not found.</div>;

  const allChecked = checkedItems.every(Boolean);
  const hasVitals = vitals.blood_pressure_systolic && vitals.heart_rate;

  const handleDischarge = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      // Record post-treatment vitals
      if (hasVitals) {
        await addVitals.mutateAsync({
          treatment_id: treatment.id,
          phase: "post",
          blood_pressure_systolic: Number(vitals.blood_pressure_systolic),
          blood_pressure_diastolic: vitals.blood_pressure_diastolic ? Number(vitals.blood_pressure_diastolic) : null,
          heart_rate: Number(vitals.heart_rate),
          o2_saturation: vitals.o2_saturation ? Number(vitals.o2_saturation) : null,
          temperature: vitals.temperature ? Number(vitals.temperature) : null,
          weight_kg: null,
          notes: null,
          recorded_by: user.id,
        });
      }

      // Save discharge assessment
      await addAssessment.mutateAsync({
        treatment_id: treatment.id,
        assessment_type: "post_treatment",
        data: {
          checklist: dischargeChecklist.map((item, i) => ({ item, checked: checkedItems[i] })),
          discharge_notes: notes,
        },
        recorded_by: user.id,
      });

      // Update treatment status
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          status: "completed",
          ended_at: new Date().toISOString(),
          notes: treatment.notes ? `${treatment.notes}\n\nDischarge: ${notes}` : `Discharge: ${notes}`,
        },
      });

      // Complete the appointment
      await updateAppointment.mutateAsync({
        id: treatment.appointment_id,
        data: { status: "completed" },
      });

      toast({ title: "Patient discharged successfully" });
      navigate("/nurse");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate(`/nurse/treatment/${treatmentId}`)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to treatment
      </Button>

      <h1 className="text-2xl font-semibold text-foreground">Discharge Patient</h1>

      {/* Post-treatment vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Post-Treatment Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>BP Systolic</Label>
              <Input type="number" className="h-12 text-lg" value={vitals.blood_pressure_systolic}
                onChange={(e) => setVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} placeholder="120" />
            </div>
            <div>
              <Label>BP Diastolic</Label>
              <Input type="number" className="h-12 text-lg" value={vitals.blood_pressure_diastolic}
                onChange={(e) => setVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} placeholder="80" />
            </div>
            <div>
              <Label>Heart Rate</Label>
              <Input type="number" className="h-12 text-lg" value={vitals.heart_rate}
                onChange={(e) => setVitals((v) => ({ ...v, heart_rate: e.target.value }))} placeholder="72" />
            </div>
            <div>
              <Label>O₂ Sat (%)</Label>
              <Input type="number" className="h-12 text-lg" value={vitals.o2_saturation}
                onChange={(e) => setVitals((v) => ({ ...v, o2_saturation: e.target.value }))} placeholder="98" />
            </div>
            <div className="col-span-2">
              <Label>Temperature (°C)</Label>
              <Input type="number" step="0.1" className="h-12 text-lg" value={vitals.temperature}
                onChange={(e) => setVitals((v) => ({ ...v, temperature: e.target.value }))} placeholder="36.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discharge Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {dischargeChecklist.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <Checkbox
                id={`discharge-${index}`}
                checked={checkedItems[index]}
                onCheckedChange={(checked) => {
                  const next = [...checkedItems];
                  next[index] = !!checked;
                  setCheckedItems(next);
                }}
                className="mt-0.5 h-6 w-6"
              />
              <Label htmlFor={`discharge-${index}`} className="text-base cursor-pointer leading-relaxed">
                {item}
              </Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Discharge Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Discharge Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Instructions given, follow-up details, observations..."
          />
        </CardContent>
      </Card>

      {/* Discharge button */}
      <Card>
        <CardContent className="py-6">
          <Button
            onClick={handleDischarge}
            disabled={!allChecked || !hasVitals || submitting}
            size="lg"
            className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-5 w-5" /> Discharge Patient
          </Button>
          {!allChecked && (
            <p className="text-sm text-amber-600 text-center mt-2">Complete all checklist items to discharge</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
