import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import {
  useTreatmentByAppointment,
  useCreateTreatment,
  useUpdateTreatment,
  useAddVitals,
  useAddAssessment,
} from "@/hooks/useTreatments";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, AlertTriangle } from "lucide-react";

import JobCardHeader from "@/components/nurse/JobCardHeader";
import JobCardStepper from "@/components/nurse/JobCardStepper";
import JobCardSidebar from "@/components/nurse/JobCardSidebar";
import JobCardVitals from "@/components/nurse/JobCardVitals";
import JobCardMedications from "@/components/nurse/JobCardMedications";
import JobCardActions from "@/components/nurse/JobCardActions";
import JobCardBilling from "@/components/nurse/JobCardBilling";
import JobCardIVAccess from "@/components/nurse/JobCardIVAccess";
import JobCardReactions from "@/components/nurse/JobCardReactions";

// ── Pre-treatment checklist items ──
const preChecklist = [
  "Patient identity verified (name + DOB)",
  "Consent form signed and on file",
  "Allergies reviewed with patient",
  "Current medications confirmed",
  "Fasting requirements met (if applicable)",
  "IV access site assessed",
  "Patient informed of procedure and duration",
];

// ── Treatment Timer ──
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
      <p className="text-xs text-muted-foreground mb-1">Elapsed Time</p>
      <p className="text-4xl font-mono font-bold text-foreground tabular-nums">
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}

export default function NurseJobCard() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: appointment, isLoading: loadingApt } = useAppointment(appointmentId);
  const { data: treatment, isLoading: loadingTreatment } = useTreatmentByAppointment(appointmentId);
  const updateAppointment = useUpdateAppointment();
  const createTreatment = useCreateTreatment();
  const updateTreatment = useUpdateTreatment();
  const addVitals = useAddVitals();
  const addAssessment = useAddAssessment();

  // Full patient record for sidebar
  const [fullPatient, setFullPatient] = useState<any>(null);
  const [allergies, setAllergies] = useState<string[] | null>(null);

  // Check-in / pre-assessment state
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(preChecklist.length).fill(false));
  const [preVitals, setPreVitals] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
    weight_kg: "",
  });
  const [preNotes, setPreNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch full patient record + medical history for allergy flags
  useEffect(() => {
    if (!appointment?.patient?.id) return;
    const fetchPatient = async () => {
      const [{ data: pat }, { data: med }] = await Promise.all([
        supabase.from("patients").select("*").eq("id", appointment.patient.id).single(),
        supabase.from("patient_medical_history").select("allergies").eq("patient_id", appointment.patient.id).maybeSingle(),
      ]);
      setFullPatient(pat);
      setAllergies(med?.allergies || null);
    };
    fetchPatient();
  }, [appointment?.patient?.id]);

  const allChecked = checkedItems.every(Boolean);
  const hasPreVitals = !!(preVitals.blood_pressure_systolic && preVitals.heart_rate);
  const treatmentStatus = treatment?.status || "";
  const isCompleted = treatmentStatus === "completed" || treatmentStatus === "cancelled";
  const isKetamine = appointment?.appointment_type?.name?.toLowerCase().includes("ketamine");

  // Determine effective stepper status
  const getStepperStatus = useCallback(() => {
    if (treatment) return treatment.status;
    if (appointment?.status === "checked_in") return "pending";
    return "pending";
  }, [treatment, appointment]);

  // ── Handlers ──

  const handleCheckIn = async () => {
    setSubmitting(true);
    try {
      await updateAppointment.mutateAsync({ id: appointment!.id, data: { status: "checked_in" } });
      toast({ title: "Patient checked in successfully" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartTreatment = async () => {
    if (!user?.id || !appointment) return;
    setSubmitting(true);
    try {
      const t = await createTreatment.mutateAsync({
        appointment_id: appointment.id,
        patient_id: appointment.patient.id,
        nurse_id: user.id,
        treatment_type_id: appointment.appointment_type.id,
      });

      if (hasPreVitals) {
        await addVitals.mutateAsync({
          treatment_id: t.id,
          phase: "pre" as const,
          blood_pressure_systolic: preVitals.blood_pressure_systolic ? Number(preVitals.blood_pressure_systolic) : null,
          blood_pressure_diastolic: preVitals.blood_pressure_diastolic ? Number(preVitals.blood_pressure_diastolic) : null,
          heart_rate: preVitals.heart_rate ? Number(preVitals.heart_rate) : null,
          o2_saturation: preVitals.o2_saturation ? Number(preVitals.o2_saturation) : null,
          temperature: preVitals.temperature ? Number(preVitals.temperature) : null,
          weight_kg: preVitals.weight_kg ? Number(preVitals.weight_kg) : null,
          respiratory_rate: null,
          pain_score: null,
          notes: preNotes || null,
          recorded_by: user.id,
        });
      }

      await addAssessment.mutateAsync({
        treatment_id: t.id,
        assessment_type: "pre_treatment" as const,
        data: {
          checklist: preChecklist.map((item, i) => ({ item, checked: checkedItems[i] })),
          notes: preNotes,
        },
        recorded_by: user.id,
      });

      await updateAppointment.mutateAsync({ id: appointment.id, data: { status: "in_progress" } });
      toast({ title: "Treatment started!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndTreatment = () => {
    if (treatment) {
      navigate(`/nurse/discharge/${treatment.id}`);
    }
  };

  // ── Loading ──
  if (loadingApt || loadingTreatment) {
    return <div className="text-center py-12 text-muted-foreground">Loading job card...</div>;
  }
  if (!appointment) {
    return <div className="text-center py-12 text-muted-foreground">Appointment not found.</div>;
  }

  const patient = fullPatient || appointment.patient;
  const showPreAssessment = appointment.status === "checked_in" && !treatment;

  return (
    <div className="pb-24">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/nurse/patients")} className="gap-2 mb-3">
        <ArrowLeft className="h-4 w-4" /> Back to patients
      </Button>

      {/* Header strip */}
      <JobCardHeader
        patient={patient}
        appointmentType={appointment.appointment_type}
        scheduledStart={appointment.scheduled_start}
        scheduledEnd={appointment.scheduled_end}
        chairName={appointment.chair?.name}
        allergies={allergies}
        treatmentStatus={treatmentStatus || appointment.status}
      />

      {/* Stepper */}
      <div className="mt-3">
        <JobCardStepper currentStatus={getStepperStatus()} />
      </div>

      {/* Main grid: sidebar + content */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <div className="order-2 lg:order-1">
          <JobCardSidebar patientId={appointment.patient.id} patient={patient} />
        </div>

        {/* Main content */}
        <div className="order-1 lg:order-2 space-y-4">
          {/* Timer (when treatment active) */}
          {treatment && treatment.status !== "pending" && (
            <Card>
              <CardContent className="py-4 flex items-center justify-center">
                <TreatmentTimer startedAt={treatment.started_at} />
              </CardContent>
            </Card>
          )}

          {/* Pre-Assessment (check-in stage) */}
          {showPreAssessment && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pre-Treatment Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {preChecklist.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Checkbox
                        id={`pre-${index}`}
                        checked={checkedItems[index]}
                        onCheckedChange={(checked) => {
                          const next = [...checkedItems];
                          next[index] = !!checked;
                          setCheckedItems(next);
                        }}
                        className="mt-0.5 h-6 w-6"
                      />
                      <Label htmlFor={`pre-${index}`} className="text-sm cursor-pointer leading-relaxed">
                        {item}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Initial Vitals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">BP Systolic</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.blood_pressure_systolic}
                        onChange={(e) => setPreVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} placeholder="120" />
                    </div>
                    <div>
                      <Label className="text-xs">BP Diastolic</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.blood_pressure_diastolic}
                        onChange={(e) => setPreVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} placeholder="80" />
                    </div>
                    <div>
                      <Label className="text-xs">Heart Rate</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.heart_rate}
                        onChange={(e) => setPreVitals((v) => ({ ...v, heart_rate: e.target.value }))} placeholder="72" />
                    </div>
                    <div>
                      <Label className="text-xs">O₂ Sat (%)</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.o2_saturation}
                        onChange={(e) => setPreVitals((v) => ({ ...v, o2_saturation: e.target.value }))} placeholder="98" />
                    </div>
                    <div>
                      <Label className="text-xs">Temp (°C)</Label>
                      <Input type="number" step="0.1" className="h-12 text-lg" value={preVitals.temperature}
                        onChange={(e) => setPreVitals((v) => ({ ...v, temperature: e.target.value }))} placeholder="36.5" />
                    </div>
                    <div>
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input type="number" step="0.1" className="h-12 text-lg" value={preVitals.weight_kg}
                        onChange={(e) => setPreVitals((v) => ({ ...v, weight_kg: e.target.value }))} placeholder="70" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="text-xs">Notes</Label>
                    <Textarea value={preNotes} onChange={(e) => setPreNotes(e.target.value)} placeholder="Any observations..." />
                  </div>
                </CardContent>
              </Card>

              {!allChecked && (
                <div className="flex items-center gap-2 text-amber-600 text-sm px-1">
                  <AlertTriangle className="h-4 w-4" />
                  Complete all checklist items before starting treatment
                </div>
              )}
            </>
          )}

          {/* Active treatment panels */}
          {treatment && (
            <>
              <JobCardVitals
                treatmentId={treatment.id}
                phase={treatment.status === "in_progress" ? "during" : "post"}
                isCompleted={isCompleted}
              />
              <JobCardIVAccess treatmentId={treatment.id} isCompleted={isCompleted} />
              <JobCardMedications treatmentId={treatment.id} isCompleted={isCompleted} />
              <JobCardReactions treatmentId={treatment.id} treatmentStartedAt={treatment.started_at} isCompleted={isCompleted} />

              {/* Ketamine protocol link */}
              {isKetamine && !isCompleted && (
                <Card className="border-amber-300 bg-amber-50">
                  <CardContent className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-foreground text-sm">Ketamine Protocol Active</p>
                        <p className="text-xs text-muted-foreground">Monitor every 15 minutes</p>
                      </div>
                    </div>
                    <Button variant="outline" className="border-amber-500 h-11 min-w-[44px]" onClick={() => navigate(`/nurse/ketamine/${treatment.id}`)}>
                      Open Monitoring
                    </Button>
                  </CardContent>
                </Card>
              )}

              <JobCardBilling
                treatmentId={treatment.id}
                appointmentTypeId={appointment.appointment_type?.id}
                isCompleted={isCompleted}
              />

              {/* Treatment notes */}
              {treatment.notes && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Treatment Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{treatment.notes}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky action bar */}
      <JobCardActions
        treatmentId={treatment?.id || null}
        treatmentStatus={treatmentStatus}
        appointmentId={appointment.id}
        appointmentStatus={appointment.status}
        onCheckIn={handleCheckIn}
        onStartTreatment={handleStartTreatment}
        onEndTreatment={handleEndTreatment}
        onRecordVitals={() => {}}
        onAddMedication={() => {}}
        isSubmitting={submitting}
        checklistComplete={allChecked}
        hasPreVitals={hasPreVitals}
      />
    </div>
  );
}
