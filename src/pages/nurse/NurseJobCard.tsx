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
import { ArrowLeft, CheckCircle2, XCircle, PanelLeftOpen } from "lucide-react";

import JobCardHeader from "@/components/nurse/JobCardHeader";
import JobCardStepper, { type StageKey } from "@/components/nurse/JobCardStepper";
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
import StageHistoryStrip from "@/components/nurse/StageHistoryStrip";
import PostAssessmentPanel from "@/components/nurse/PostAssessmentPanel";

const manualChecklist = [
  "Patient identity verified (name + DOB)",
  "Allergies reviewed with patient",
  "Current medications confirmed",
  "Fasting requirements met (if applicable)",
  "IV access site assessed",
  "Patient informed of procedure and duration",
];

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
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return (
    <div className="text-center py-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Elapsed Time</p>
      <p className="text-4xl font-mono font-bold text-foreground tabular-nums tracking-tight">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </p>
    </div>
  );
}

// Map raw treatment + appointment status to a UI stage
function deriveStage(treatment: any | null, appointmentStatus: string | undefined): StageKey {
  if (!treatment) return "check_in";
  const s = treatment.status;
  if (s === "completed" || s === "cancelled") return "discharged";
  if (s === "post_assessment") return "post_assessment";
  if (s === "in_progress") return "in_progress";
  // 'checked_in' OR legacy 'pending' OR 'pre_assessment'
  return "pre_assessment";
}

export default function NurseJobCard() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();

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

  const readiness = useOnboardingReadiness(
    appointment?.patient?.id,
    appointment?.appointment_type?.id
  );

  const [fullPatient, setFullPatient] = useState<any>(null);
  const [allergies, setAllergies] = useState<string[] | null>(null);
  const [paperConsentOverride, setPaperConsentOverride] = useState(false);

  // Pre-assessment state
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

  const stage = deriveStage(treatment, appointment?.status);
  const consentReady = readiness.required.length === 0 || readiness.isReady || paperConsentOverride;
  const allChecked = checkedItems.every(Boolean);
  const hasPreVitals = !!(preVitals.blood_pressure_systolic && preVitals.heart_rate);
  const isKetamine = appointment?.appointment_type?.name?.toLowerCase().includes("ketamine");
  const isCompleted = stage === "discharged";

  // ── Stage handlers ──

  const handleConfirmCheckIn = useCallback(async () => {
    if (!user?.id || !appointment) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      // Create treatment row at checked_in stage
      const t = await createTreatment.mutateAsync({
        appointment_id: appointment.id,
        patient_id: appointment.patient.id,
        nurse_id: user.id,
        treatment_type_id: appointment.appointment_type.id,
      });
      await updateTreatment.mutateAsync({
        id: t.id,
        data: { status: "checked_in", checked_in_by: user.id, checked_in_at: now } as any,
      });
      await updateAppointment.mutateAsync({ id: appointment.id, data: { status: "checked_in" } });
      toast({ title: "Patient checked in" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [user, appointment, createTreatment, updateTreatment, updateAppointment]);

  const handleStartTreatment = useCallback(async () => {
    if (!user?.id || !appointment || !treatment) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      if (hasPreVitals) {
        await addVitals.mutateAsync({
          treatment_id: treatment.id,
          phase: "pre",
          blood_pressure_systolic: Number(preVitals.blood_pressure_systolic) || null,
          blood_pressure_diastolic: preVitals.blood_pressure_diastolic ? Number(preVitals.blood_pressure_diastolic) : null,
          heart_rate: Number(preVitals.heart_rate) || null,
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
        treatment_id: treatment.id,
        assessment_type: "pre_treatment",
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
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          status: "in_progress",
          started_at: now,
          pre_assessment_by: user.id,
          pre_assessment_completed_at: now,
        } as any,
      });
      await updateAppointment.mutateAsync({ id: appointment.id, data: { status: "in_progress" } });
      toast({ title: "Treatment started" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [user, appointment, treatment, hasPreVitals, preVitals, preNotes, checkedItems, paperConsentOverride, readiness, addVitals, addAssessment, updateTreatment, updateAppointment]);

  const handleEndTreatment = useCallback(async () => {
    if (!treatment) return;
    setSubmitting(true);
    try {
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: { status: "post_assessment", ended_at: new Date().toISOString() } as any,
      });
      toast({ title: "Treatment ended — proceed with post-assessment" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [treatment, updateTreatment]);

  // ── Step-back handler ──
  const handleStepBack = useCallback(async () => {
    if (!treatment || !user?.id) return;
    let targetStatus: string | null = null;
    let targetLabel = "";
    const patch: any = {};
    if (stage === "pre_assessment") {
      targetStatus = "checked_in";
      targetLabel = "Check-In";
    } else if (stage === "in_progress") {
      targetStatus = "pre_assessment";
      targetLabel = "Pre-Assessment";
    } else if (stage === "post_assessment") {
      targetStatus = "in_progress";
      targetLabel = "In Progress";
      patch.ended_at = null;
    }
    if (!targetStatus) return;
    setSubmitting(true);
    try {
      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: { status: targetStatus, ...patch } as any,
      });
      if (appointment) {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          data: { status: targetStatus === "checked_in" ? "checked_in" : targetStatus === "in_progress" ? "in_progress" : "checked_in" },
        });
      }
      await addAssessment.mutateAsync({
        treatment_id: treatment.id,
        assessment_type: "stage_reverted",
        data: { from: stage, to: targetStatus, at: new Date().toISOString() },
        recorded_by: user.id,
      });
      toast({ title: `Returned to ${targetLabel}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }, [stage, treatment, appointment, user, updateTreatment, updateAppointment, addAssessment]);

  // ── Loading ──
  if (loadingApt || loadingTreatment) {
    return <div className="text-center py-12 text-muted-foreground">Loading job card...</div>;
  }
  if (!appointment) {
    return <div className="text-center py-12 text-muted-foreground">Appointment not found.</div>;
  }

  const patient = fullPatient || appointment.patient;
  const useSheetSidebar = isMobile || (typeof window !== "undefined" && window.innerWidth < 1024);
  const sidebarContent = <JobCardSidebar patientId={appointment.patient.id} patient={patient} />;

  // ── Determine action bar config per stage ──
  let primaryLabel: string | undefined;
  let primaryDisabled = false;
  let onPrimary: (() => void) | undefined;
  let hint: string | undefined;

  if (stage === "check_in") {
    primaryLabel = "Confirm Check-In";
    primaryDisabled = !consentReady;
    onPrimary = handleConfirmCheckIn;
    if (!consentReady) hint = "Required consent forms not yet complete";
  } else if (stage === "pre_assessment") {
    primaryLabel = "Start Treatment";
    primaryDisabled = !allChecked || !hasPreVitals;
    onPrimary = handleStartTreatment;
    if (!allChecked) hint = "Tick every safety checklist item";
    else if (!hasPreVitals) hint = "Record BP and heart rate to proceed";
  } else if (stage === "in_progress") {
    primaryLabel = "End Treatment";
    onPrimary = handleEndTreatment;
  }

  // Secondary "step back" button — only when there's a previous stage and treatment exists
  let secondaryLabel: string | undefined;
  if (treatment && stage === "pre_assessment") secondaryLabel = "Back to Check-In";
  else if (treatment && stage === "in_progress") secondaryLabel = "Back to Pre-Assessment";
  else if (treatment && stage === "post_assessment") secondaryLabel = "Back to In Progress";
  // post_assessment: no bar primary; the panel has its own discharge button
  // discharged: nothing

  return (
    <div className="pb-28">
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

      <JobCardHeader
        patient={patient}
        appointmentType={appointment.appointment_type}
        scheduledStart={appointment.scheduled_start}
        scheduledEnd={appointment.scheduled_end}
        chairName={appointment.chair?.name}
        allergies={allergies}
        treatmentStatus={stage}
      />

      <div className="mt-3">
        <JobCardStepper currentStage={stage} />
      </div>

      <div className="mt-2">
        <StageHistoryStrip treatment={treatment} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[300px_1fr]">
        {!useSheetSidebar && <div className="order-1">{sidebarContent}</div>}

        <div className={`${useSheetSidebar ? "order-1" : "order-2"} space-y-4`}>
          {/* ─── Stage: Check-In ─── */}
          {stage === "check_in" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verify Identity & Consent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Confirm patient identity, review allergies, and check that all consent &amp; onboarding forms are in order before checking the patient in.
                </p>
                {readiness.required.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Consent &amp; Onboarding Forms</p>
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
                            <span className={done ? "text-muted-foreground" : "font-medium"}>{form.name}</span>
                            {done && (
                              <span className="text-sm text-muted-foreground ml-2">
                                ✓ {new Date(done.completedAt).toLocaleDateString("en-ZA")}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
              </CardContent>
            </Card>
          )}

          {/* ─── Stage: Pre-Assessment ─── */}
          {stage === "pre_assessment" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pre-Treatment Safety Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
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

              {/* IV access can be recorded here too */}
              {treatment && <JobCardIVAccess treatmentId={treatment.id} isCompleted={false} />}
            </>
          )}

          {/* ─── Stage: In Progress ─── */}
          {stage === "in_progress" && treatment && (
            <>
              <Card>
                <CardContent className="py-4 flex items-center justify-center">
                  <TreatmentTimer startedAt={treatment.started_at} />
                </CardContent>
              </Card>
              <ProtocolMonitoringBanner
                treatmentTypeId={appointment.appointment_type.id}
                treatmentId={treatment.id}
                treatmentStartedAt={treatment.started_at}
              />
              <ClinicalAlerts
                treatmentId={treatment.id}
                treatmentTypeId={appointment.appointment_type.id}
                treatmentStartedAt={treatment.started_at}
              />
              <JobCardVitals
                treatmentId={treatment.id}
                phase="during"
                isCompleted={false}
                treatmentStartedAt={treatment.started_at}
              />
              <JobCardIVAccess treatmentId={treatment.id} isCompleted={false} />
              <JobCardMedications treatmentId={treatment.id} isCompleted={false} />
              <JobCardReactions treatmentId={treatment.id} treatmentStartedAt={treatment.started_at} isCompleted={false} />
              {isKetamine && (
                <JobCardKetaminePanel treatmentId={treatment.id} treatmentStartedAt={treatment.started_at} />
              )}
            </>
          )}

          {/* ─── Stage: Post-Assessment ─── */}
          {stage === "post_assessment" && treatment && (
            <PostAssessmentPanel
              treatment={treatment}
              appointment={appointment}
            />
          )}

          {/* ─── Stage: Discharged (read-only summary) ─── */}
          {stage === "discharged" && treatment && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Treatment Complete</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">This treatment has been completed and the patient discharged.</p>
                  {treatment.notes && (
                    <p className="whitespace-pre-wrap pt-2">{treatment.notes}</p>
                  )}
                </CardContent>
              </Card>
              <JobCardVitals treatmentId={treatment.id} phase="post" isCompleted treatmentStartedAt={treatment.started_at} />
              <JobCardMedications treatmentId={treatment.id} isCompleted />
              <JobCardBilling
                treatmentId={treatment.id}
                appointmentTypeId={appointment.appointment_type?.id}
                isCompleted
              />
            </>
          )}
        </div>
      </div>

      <JobCardActions
        stage={stage}
        primaryLabel={primaryLabel}
        primaryDisabled={primaryDisabled}
        onPrimary={onPrimary}
        isSubmitting={submitting}
        hint={hint}
        secondaryLabel={secondaryLabel}
        onSecondary={secondaryLabel ? handleStepBack : undefined}
      />
    </div>
  );
}
