import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import { useCreateTreatment, useAddVitals, useAddAssessment, useTreatmentByAppointment } from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { format, differenceInYears } from "date-fns";
import { ArrowLeft, User, AlertTriangle, CheckCircle } from "lucide-react";

const preChecklist = [
  "Patient identity verified (name + DOB)",
  "Consent form signed and on file",
  "Allergies reviewed with patient",
  "Current medications confirmed",
  "Fasting requirements met (if applicable)",
  "IV access site assessed",
  "Patient informed of procedure and duration",
];

export default function NurseCheckIn() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: appointment, isLoading } = useAppointment(appointmentId);
  const { data: existingTreatment } = useTreatmentByAppointment(appointmentId);
  const updateAppointment = useUpdateAppointment();
  const createTreatment = useCreateTreatment();
  const addVitals = useAddVitals();
  const addAssessment = useAddAssessment();

  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(preChecklist.length).fill(false));
  const [vitals, setVitals] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
    weight_kg: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!appointment) return <div className="text-center py-12 text-muted-foreground">Appointment not found.</div>;

  const patient = appointment.patient;
  const allChecked = checkedItems.every(Boolean);
  const hasVitals = vitals.blood_pressure_systolic && vitals.heart_rate;
  const patientDob = (patient as any).date_of_birth;
  const age = patientDob
    ? differenceInYears(new Date(), new Date(patientDob))
    : null;

  const handleCheckIn = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      // Update appointment status
      await updateAppointment.mutateAsync({
        id: appointment.id,
        data: { status: "checked_in" },
      });

      toast({ title: "Patient checked in successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTreatment = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      // Create treatment record
      const treatment = await createTreatment.mutateAsync({
        appointment_id: appointment.id,
        patient_id: appointment.patient.id,
        nurse_id: user.id,
        treatment_type_id: appointment.appointment_type.id,
      });

      // Save pre-assessment vitals
      if (hasVitals) {
        await addVitals.mutateAsync({
          treatment_id: treatment.id,
          phase: "pre" as const,
          blood_pressure_systolic: vitals.blood_pressure_systolic ? Number(vitals.blood_pressure_systolic) : null,
          blood_pressure_diastolic: vitals.blood_pressure_diastolic ? Number(vitals.blood_pressure_diastolic) : null,
          heart_rate: vitals.heart_rate ? Number(vitals.heart_rate) : null,
          o2_saturation: vitals.o2_saturation ? Number(vitals.o2_saturation) : null,
          temperature: vitals.temperature ? Number(vitals.temperature) : null,
          weight_kg: vitals.weight_kg ? Number(vitals.weight_kg) : null,
          respiratory_rate: null,
          pain_score: null,
          notes: notes || null,
          recorded_by: user.id,
        });
      }

      // Save pre-treatment checklist
      await addAssessment.mutateAsync({
        treatment_id: treatment.id,
        assessment_type: "pre_treatment" as const,
        data: {
          checklist: preChecklist.map((item, i) => ({ item, checked: checkedItems[i] })),
          notes,
        },
        recorded_by: user.id,
      });

      // Update appointment status
      await updateAppointment.mutateAsync({
        id: appointment.id,
        data: { status: "in_progress" },
      });

      toast({ title: "Treatment started!" });
      navigate(`/nurse/treatment/${treatment.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckedIn = appointment.status === "checked_in";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Button variant="ghost" onClick={() => navigate("/nurse/patients")} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Button>

      {/* Patient Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl">{patient.first_name} {patient.last_name}</p>
              <p className="text-sm font-normal text-muted-foreground">
                {age !== null ? `Age ${age}` : "DOB not recorded"}
                {patient.phone ? ` • ${patient.phone}` : ""}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{appointment.appointment_type.name}</Badge>
            <Badge variant="outline">
              {format(new Date(appointment.scheduled_start), "HH:mm")} –{" "}
              {format(new Date(appointment.scheduled_end), "HH:mm")}
            </Badge>
            {appointment.chair && <Badge variant="outline">{appointment.chair.name}</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Check-in button if not yet checked in */}
      {!isCheckedIn && appointment.status !== "in_progress" && (
        <Card>
          <CardContent className="py-6">
            <Button onClick={handleCheckIn} disabled={submitting} size="lg" className="w-full h-14 text-lg">
              <CheckCircle className="mr-2 h-5 w-5" />
              Check In Patient
            </Button>
          </CardContent>
        </Card>
      )}

      {/* If already has a treatment, go to it */}
      {existingTreatment && (
        <Card className="border-primary">
          <CardContent className="py-6 text-center">
            <p className="mb-3 text-muted-foreground">Treatment already started.</p>
            <Button onClick={() => navigate(`/nurse/treatment/${existingTreatment.id}`)}>
              Go to Treatment Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pre-treatment only shows after check-in */}
      {isCheckedIn && !existingTreatment && (
        <>
          {/* Pre-treatment Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Pre-Treatment Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {preChecklist.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Checkbox
                    id={`check-${index}`}
                    checked={checkedItems[index]}
                    onCheckedChange={(checked) => {
                      const next = [...checkedItems];
                      next[index] = !!checked;
                      setCheckedItems(next);
                    }}
                    className="mt-0.5 h-6 w-6"
                  />
                  <Label htmlFor={`check-${index}`} className="text-base cursor-pointer leading-relaxed">
                    {item}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Initial Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Initial Vitals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">BP Systolic (mmHg)</Label>
                  <Input
                    type="number"
                    value={vitals.blood_pressure_systolic}
                    onChange={(e) => setVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label className="text-sm">BP Diastolic (mmHg)</Label>
                  <Input
                    type="number"
                    value={vitals.blood_pressure_diastolic}
                    onChange={(e) => setVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="80"
                  />
                </div>
                <div>
                  <Label className="text-sm">Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={vitals.heart_rate}
                    onChange={(e) => setVitals((v) => ({ ...v, heart_rate: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="72"
                  />
                </div>
                <div>
                  <Label className="text-sm">O₂ Saturation (%)</Label>
                  <Input
                    type="number"
                    value={vitals.o2_saturation}
                    onChange={(e) => setVitals((v) => ({ ...v, o2_saturation: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="98"
                  />
                </div>
                <div>
                  <Label className="text-sm">Temperature (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitals.temperature}
                    onChange={(e) => setVitals((v) => ({ ...v, temperature: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="36.5"
                  />
                </div>
                <div>
                  <Label className="text-sm">Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={vitals.weight_kg}
                    onChange={(e) => setVitals((v) => ({ ...v, weight_kg: e.target.value }))}
                    className="h-12 text-lg"
                    placeholder="70"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label className="text-sm">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations..." />
              </div>
            </CardContent>
          </Card>

          {/* Start Treatment */}
          <Card>
            <CardContent className="py-6">
              {!allChecked && (
                <div className="flex items-center gap-2 mb-4 text-amber-600 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Complete all checklist items before starting treatment
                </div>
              )}
              <Button
                onClick={handleStartTreatment}
                disabled={!allChecked || !hasVitals || submitting}
                size="lg"
                className="w-full h-14 text-lg"
              >
                Start Treatment
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
