import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppointment, useUpdateAppointment } from "@/hooks/useAppointments";
import {
  useTreatmentByAppointment,
  useCreateTreatment,
  useUpdateTreatment,
  useAddVitals,
  useAddAssessment,
} from "@/hooks/useTreatments";
import { useOnboardingReadiness } from "@/hooks/useOnboardingChecklist";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle, PanelLeftOpen } from "lucide-react";

import JobCardHeader from "@/components/nurse/JobCardHeader";
import JobCardStepper from "@/components/nurse/JobCardStepper";
import JobCardSidebar from "@/components/nurse/JobCardSidebar";
import JobCardVitals from "@/components/nurse/JobCardVitals";
import JobCardMedications from "@/components/nurse/JobCardMedications";
import JobCardActions from "@/components/nurse/JobCardActions";
import JobCardBilling from "@/components/nurse/JobCardBilling";
import JobCardIVAccess from "@/components/nurse/JobCardIVAccess";
import JobCardReactions from "@/components/nurse/JobCardReactions";
import JobCardKetaminePanel from "@/components/nurse/JobCardKetaminePanel";
import ClinicalAlerts from "@/components/nurse/ClinicalAlerts";
import ProtocolMonitoringBanner from "@/components/nurse/ProtocolMonitoringBanner";

// ── Manual pre-treatment checklist items (non-form items) ──
const manualChecklist = [
  "Patient identity verified (name + DOB)",
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
    <div className="text-center py-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Elapsed Time</p>
      <p className="text-4xl font-mono font-bold text-foreground tabular-nums tracking-tight">
        {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </p>
    </div>
  );
}

export default function NurseJobCard() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const isMobile = useIsMobile();

  // Determine back destination based on role/referrer
  const backPath = location.pathname.startsWith("/admin")
    ? "/admin/command-centre"
    : "/nurse/command-centre";

  const { data: appointment, isLoading: loadingApt } = useAppointment(appointmentId);
  const { data: treatment, isLoading: loadingTreatment } = useTreatmentByAppointment(appointmentId);
  const updateAppointment = useUpdateAppointment();
  const createTreatment = useCreateTreatment();
  const updateTreatment = useUpdateTreatment();
  const addVitals = useAddVitals();
  const addAssessment = useAddAssessment();

  // Onboarding readiness for auto-verified consent checks
  const readiness = useOnboardingReadiness(
    appointment?.patient?.id,
    appointment?.appointment_type?.id
  );

  // Full patient record for sidebar
  const [fullPatient, setFullPatient] = useState<any>(null);
  const [allergies, setAllergies] = useState<string[] | null>(null);
  const [paperConsentOverride, setPaperConsentOverride] = useState(false);

  // Check-in / pre-assessment state
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(manualChecklist.length).fill(false));
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

  const consentReady = readiness.required.length === 0 || readiness.isReady || paperConsentOverride;
  const allChecked = checkedItems.every(Boolean) && consentReady;
  const hasPreVitals = !!(preVitals.blood_pressure_systolic && preVitals.heart_rate);
  const treatmentStatus = treatment?.status || "";
  const isCompleted = treatmentStatus === "completed" || treatmentStatus === "cancelled";
  const isKetamine = appointment?.appointment_type?.name?.toLowerCase().includes("ketamine");
  // A treatment row in `pending` with no started_at is a half-created record from a
  // previously-failed Start Treatment attempt. Treat it as recoverable: show the
  // pre-assessment UI again and reuse the existing row when re-submitting.
  const isRecoverablePending = !!treatment && treatment.status === "pending" && !treatment.started_at;

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
      // Reuse a pending treatment row if one already exists (recovery from a prior
      // failed attempt); otherwise create a new one.
      const t = treatment
        ? treatment
        : await createTreatment.mutateAsync({
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
          checklist: manualChecklist.map((item, i) => ({ item, checked: checkedItems[i] })),
          consentForms: readiness.required.map((f) => ({
            name: f.name,
            completed: readiness.completed.some((c) => c.id === f.id),
          })),
          paperConsentOverride,
          notes: preNotes,
        },
        recorded_by: user.id,
      });

      // Transition treatment to in_progress with started_at
      await updateTreatment.mutateAsync({
        id: t.id,
        data: { status: "in_progress", started_at: new Date().toISOString() },
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
  const showPreAssessment =
    appointment.status === "checked_in" && (!treatment || isRecoverablePending);

  // Use <=1024 as "tablet or smaller" — sidebar becomes a sheet
  const useSheetSidebar = isMobile || typeof window !== "undefined" && window.innerWidth < 1024;

  const sidebarContent = (
    <JobCardSidebar patientId={appointment.patient.id} patient={patient} />
  );

  return (
    <div className="pb-24">
      {/* Back button + sidebar toggle for tablet */}
      <div className="flex items-center gap-2 mb-3">
        <Button variant="ghost" onClick={() => navigate(backPath)} className="gap-2 h-12 min-w-[48px]">
          <ArrowLeft className="h-5 w-5" /> Back
        </Button>
        {useSheetSidebar && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 h-12 min-w-[48px]">
                <PanelLeftOpen className="h-5 w-5" /> Patient Info
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[340px] overflow-y-auto p-4">
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}
      </div>

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

      {/* Main grid: sidebar (desktop only) + content */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Sidebar - only visible on large screens */}
        {!useSheetSidebar && (
          <div className="order-1">
            {sidebarContent}
          </div>
        )}

        {/* Main content */}
        <div className={`${useSheetSidebar ? "order-1" : "order-2"} space-y-4`}>
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
              {isRecoverablePending && (
                <div className="rounded-lg border border-clinical-warning/40 bg-clinical-warning-soft/40 px-4 py-3 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-clinical-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Resuming previous attempt</p>
                    <p className="text-muted-foreground">
                      A treatment was started but didn't complete. Re-submit the pre-assessment to continue — your prior progress will be reused.
                    </p>
                  </div>
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pre-Treatment Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Auto-verified consent forms */}
                  {readiness.required.length > 0 && (
                    <div className="space-y-2 pb-3 border-b">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Consent & Onboarding Forms</p>
                      {readiness.required.map((form) => {
                        const done = readiness.completed.find((c) => c.id === form.id);
                        return (
                          <div key={form.id} className="flex items-center gap-3 min-h-[48px]">
                            {done ? (
                              <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                            )}
                            <div className="text-sm leading-relaxed">
                              <span className={done ? "text-muted-foreground" : "font-medium"}>
                                {form.name}
                              </span>
                              {done && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  ✓ {new Date(done.completedAt).toLocaleDateString("en-ZA")}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Paper consent override */}
                      {!readiness.isReady && (
                        <div className="flex items-center gap-3 pt-2 min-h-[48px]">
                          <Switch
                            id="paper-consent"
                            checked={paperConsentOverride}
                            onCheckedChange={setPaperConsentOverride}
                          />
                          <Label htmlFor="paper-consent" className="text-sm cursor-pointer">
                            Paper consent obtained (manual override)
                          </Label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual checklist items */}
                  {manualChecklist.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 min-h-[48px]">
                      <Checkbox
                        id={`pre-${index}`}
                        checked={checkedItems[index]}
                        onCheckedChange={(checked) => {
                          const next = [...checkedItems];
                          next[index] = !!checked;
                          setCheckedItems(next);
                        }}
                        className="mt-0.5 h-7 w-7"
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
                      <Label className="text-sm">BP Systolic</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.blood_pressure_systolic}
                        onChange={(e) => setPreVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} placeholder="120" />
                    </div>
                    <div>
                      <Label className="text-sm">BP Diastolic</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.blood_pressure_diastolic}
                        onChange={(e) => setPreVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} placeholder="80" />
                    </div>
                    <div>
                      <Label className="text-sm">Heart Rate</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.heart_rate}
                        onChange={(e) => setPreVitals((v) => ({ ...v, heart_rate: e.target.value }))} placeholder="72" />
                    </div>
                    <div>
                      <Label className="text-sm">O₂ Sat (%)</Label>
                      <Input type="number" className="h-12 text-lg" value={preVitals.o2_saturation}
                        onChange={(e) => setPreVitals((v) => ({ ...v, o2_saturation: e.target.value }))} placeholder="98" />
                    </div>
                    <div>
                      <Label className="text-sm">Temp (°C)</Label>
                      <Input type="number" step="0.1" className="h-12 text-lg" value={preVitals.temperature}
                        onChange={(e) => setPreVitals((v) => ({ ...v, temperature: e.target.value }))} placeholder="36.5" />
                    </div>
                    <div>
                      <Label className="text-sm">Weight (kg)</Label>
                      <Input type="number" step="0.1" className="h-12 text-lg" value={preVitals.weight_kg}
                        onChange={(e) => setPreVitals((v) => ({ ...v, weight_kg: e.target.value }))} placeholder="70" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="text-sm">Notes</Label>
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
              {/* Protocol monitoring banner */}
              <ProtocolMonitoringBanner
                treatmentTypeId={appointment.appointment_type.id}
                treatmentId={treatment.id}
                treatmentStartedAt={treatment.started_at}
              />

              {/* Clinical alerts */}
              <ClinicalAlerts
                treatmentId={treatment.id}
                treatmentTypeId={appointment.appointment_type.id}
                treatmentStartedAt={treatment.started_at}
              />

              <JobCardVitals
                treatmentId={treatment.id}
                phase={treatment.status === "in_progress" ? "during" : "post"}
                isCompleted={isCompleted}
                treatmentStartedAt={treatment.started_at}
              />
              <JobCardIVAccess treatmentId={treatment.id} isCompleted={isCompleted} />
              <JobCardMedications treatmentId={treatment.id} isCompleted={isCompleted} />
              <JobCardReactions treatmentId={treatment.id} treatmentStartedAt={treatment.started_at} isCompleted={isCompleted} />

              {/* Inline Ketamine Monitoring */}
              {isKetamine && !isCompleted && (
                <JobCardKetaminePanel
                  treatmentId={treatment.id}
                  treatmentStartedAt={treatment.started_at}
                />
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
