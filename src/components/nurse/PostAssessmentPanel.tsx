import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useUpdateTreatment,
  useAddVitals,
  useAddAssessment,
  useTreatmentVitals,
  useTreatmentMedications,
} from "@/hooks/useTreatments";
import { useIVAccess } from "@/hooks/useIVAccess";
import { useTreatmentReactions } from "@/hooks/useTreatmentReactions";
import { useUpdateAppointment } from "@/hooks/useAppointments";
import {
  useTreatmentProtocol,
  useDischargeCriteria,
  evaluateDischargeReadiness,
  useGenerateTreatmentSummary,
  generateNarrativeSummary,
} from "@/hooks/useTreatmentProtocols";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  treatment: any;
  appointment: any;
  onCompleted?: () => void;
}

export default function PostAssessmentPanel({ treatment, appointment, onCompleted }: Props) {
  const { user } = useAuth();
  const updateTreatment = useUpdateTreatment();
  const updateAppointment = useUpdateAppointment();
  const addVitals = useAddVitals();
  const addAssessment = useAddAssessment();
  const generateSummary = useGenerateTreatmentSummary();

  const { data: protocol } = useTreatmentProtocol(treatment?.treatment_type_id);
  const { data: criteria = [] } = useDischargeCriteria(protocol?.id);
  const { data: vitals = [] } = useTreatmentVitals(treatment?.id);
  const { data: medications = [] } = useTreatmentMedications(treatment?.id);
  const { data: ivAccessRecords = [] } = useIVAccess(treatment?.id);
  const { data: reactions = [] } = useTreatmentReactions(treatment?.id);

  const latestVitals = vitals.length > 0 ? vitals[vitals.length - 1] : null;
  const hasActiveReactions = reactions.some((r: any) => r.outcome === "ongoing" || r.outcome === "escalated");
  const ivRemoved = ivAccessRecords.length === 0 || ivAccessRecords.every((iv: any) => iv.removed_at !== null);

  const dischargeReadiness = criteria.length > 0
    ? evaluateDischargeReadiness(criteria, {
        latestVitals,
        treatmentStartedAt: treatment?.started_at,
        infusionEndedAt: null,
        hasActiveReactions,
        ivRemoved,
        dissociationScore: null,
      })
    : null;

  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [postVitals, setPostVitals] = useState({
    blood_pressure_systolic: "",
    blood_pressure_diastolic: "",
    heart_rate: "",
    o2_saturation: "",
    temperature: "",
  });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasPostVitals = !!(postVitals.blood_pressure_systolic && postVitals.heart_rate);

  const canDischarge = (() => {
    if (!hasPostVitals) return false;
    if (dischargeReadiness && !dischargeReadiness.isReady) {
      return dischargeReadiness.criteria
        .filter((c) => !c.met)
        .every((c) => manualOverrides[c.criterion.id]);
    }
    return true;
  })();

  const handleDischarge = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    try {
      if (hasPostVitals) {
        await addVitals.mutateAsync({
          treatment_id: treatment.id,
          phase: "post",
          blood_pressure_systolic: Number(postVitals.blood_pressure_systolic),
          blood_pressure_diastolic: postVitals.blood_pressure_diastolic ? Number(postVitals.blood_pressure_diastolic) : null,
          heart_rate: Number(postVitals.heart_rate),
          o2_saturation: postVitals.o2_saturation ? Number(postVitals.o2_saturation) : null,
          temperature: postVitals.temperature ? Number(postVitals.temperature) : null,
          weight_kg: null,
          respiratory_rate: null,
          pain_score: null,
          notes: null,
          recorded_by: user.id,
        });
      }

      const criteriaResults = dischargeReadiness?.criteria.map((c) => ({
        criterion: c.criterion.display_label,
        met: c.met || !!manualOverrides[c.criterion.id],
        autoEvaluated: c.met,
        manualOverride: !!manualOverrides[c.criterion.id],
        reason: c.reason,
      })) || [];

      await addAssessment.mutateAsync({
        treatment_id: treatment.id,
        assessment_type: "post_treatment",
        data: {
          discharge_criteria: criteriaResults,
          discharge_notes: notes,
          protocol_name: protocol?.name,
        },
        recorded_by: user.id,
      });

      const dischargedAt = new Date().toISOString();
      const durationMins = treatment.started_at
        ? Math.round((Date.now() - new Date(treatment.started_at).getTime()) / 60000)
        : 0;

      const patientName = appointment?.patient
        ? `${appointment.patient.first_name} ${appointment.patient.last_name}`
        : "Patient";
      const treatmentType = appointment?.appointment_type?.name || "Treatment";
      const medNames = medications.map((m: any) => `${m.medication_name} ${m.dosage}`);
      const criteriaMet = criteriaResults.filter((c) => c.met).map((c) => c.criterion);

      const summaryData = {
        duration_mins: durationMins,
        vitals_count: vitals.length,
        medications_count: medications.length,
        reactions_count: reactions.length,
        iv_access_type: ivAccessRecords[0]?.access_type,
        final_vitals: {
          bp_systolic: postVitals.blood_pressure_systolic ? Number(postVitals.blood_pressure_systolic) : null,
          bp_diastolic: postVitals.blood_pressure_diastolic ? Number(postVitals.blood_pressure_diastolic) : null,
          heart_rate: postVitals.heart_rate ? Number(postVitals.heart_rate) : null,
          o2_sat: postVitals.o2_saturation ? Number(postVitals.o2_saturation) : null,
          temperature: postVitals.temperature ? Number(postVitals.temperature) : null,
        },
        discharge_criteria_met: criteriaMet,
      };

      const narrative = generateNarrativeSummary({
        patientName,
        treatmentType,
        startedAt: treatment.started_at || dischargedAt,
        endedAt: treatment.ended_at || dischargedAt,
        durationMins,
        vitalsCount: vitals.length,
        medicationsAdministered: medNames,
        reactionsCount: reactions.length,
        ivAccessType: ivAccessRecords[0]?.access_type,
        dischargeCriteriaMet: criteriaMet,
        notes: notes || undefined,
      });

      await generateSummary.mutateAsync({
        treatmentId: treatment.id,
        userId: user.id,
        summaryData,
        narrativeSummary: narrative,
      });

      await updateTreatment.mutateAsync({
        id: treatment.id,
        data: {
          status: "completed",
          post_assessment_by: user.id,
          post_assessment_completed_at: dischargedAt,
          discharged_by: user.id,
          discharged_at: dischargedAt,
          notes: treatment.notes ? `${treatment.notes}\n\nDischarge: ${notes}` : `Discharge: ${notes}`,
        } as any,
      });

      await updateAppointment.mutateAsync({
        id: treatment.appointment_id,
        data: { status: "completed" },
      });

      toast({ title: "Patient discharged successfully" });
      onCompleted?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {protocol && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Protocol: <span className="font-medium text-foreground">{protocol.name}</span>
        </div>
      )}

      {dischargeReadiness && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Discharge Criteria
              {dischargeReadiness.isReady ? (
                <Badge className="bg-clinical-success text-white">All Met</Badge>
              ) : (
                <Badge variant="destructive">{dischargeReadiness.blockers.length} Not Met</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dischargeReadiness.criteria.map((item) => (
              <div
                key={item.criterion.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg p-3 min-h-[48px]",
                  item.met ? "bg-clinical-success-soft/50" : "bg-clinical-danger-soft/30"
                )}
              >
                {item.met ? (
                  <CheckCircle className="h-5 w-5 text-clinical-success mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-5 w-5 text-clinical-danger mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.criterion.display_label}</p>
                  {item.reason && <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>}
                  {item.criterion.description && (
                    <p className="text-xs text-muted-foreground">{item.criterion.description}</p>
                  )}
                </div>
                {!item.met && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Checkbox
                      id={`override-${item.criterion.id}`}
                      checked={manualOverrides[item.criterion.id] || false}
                      onCheckedChange={(checked) =>
                        setManualOverrides((prev) => ({ ...prev, [item.criterion.id]: !!checked }))
                      }
                      className="h-6 w-6"
                    />
                    <Label htmlFor={`override-${item.criterion.id}`} className="text-xs text-muted-foreground">
                      Override
                    </Label>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post-Treatment Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>BP Systolic</Label>
              <Input type="number" className="h-12 text-lg" value={postVitals.blood_pressure_systolic}
                onChange={(e) => setPostVitals((v) => ({ ...v, blood_pressure_systolic: e.target.value }))} placeholder="120" />
            </div>
            <div>
              <Label>BP Diastolic</Label>
              <Input type="number" className="h-12 text-lg" value={postVitals.blood_pressure_diastolic}
                onChange={(e) => setPostVitals((v) => ({ ...v, blood_pressure_diastolic: e.target.value }))} placeholder="80" />
            </div>
            <div>
              <Label>Heart Rate</Label>
              <Input type="number" className="h-12 text-lg" value={postVitals.heart_rate}
                onChange={(e) => setPostVitals((v) => ({ ...v, heart_rate: e.target.value }))} placeholder="72" />
            </div>
            <div>
              <Label>O₂ Sat (%)</Label>
              <Input type="number" className="h-12 text-lg" value={postVitals.o2_saturation}
                onChange={(e) => setPostVitals((v) => ({ ...v, o2_saturation: e.target.value }))} placeholder="98" />
            </div>
            <div className="col-span-2">
              <Label>Temperature (°C)</Label>
              <Input type="number" step="0.1" className="h-12 text-lg" value={postVitals.temperature}
                onChange={(e) => setPostVitals((v) => ({ ...v, temperature: e.target.value }))} placeholder="36.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discharge Notes</CardTitle>
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

      {dischargeReadiness && !dischargeReadiness.isReady && !canDischarge && (
        <div className="flex items-start gap-2 text-sm text-clinical-warning px-1">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Some discharge criteria are not met. Override each to proceed.</span>
        </div>
      )}

      <Card>
        <CardContent className="py-6">
          <Button
            onClick={handleDischarge}
            disabled={!canDischarge || submitting}
            size="lg"
            className="w-full h-14 text-lg bg-clinical-success hover:bg-clinical-success/90 text-white"
          >
            <CheckCircle className="mr-2 h-5 w-5" /> Discharge Patient
          </Button>
          {!hasPostVitals && (
            <p className="text-sm text-clinical-warning text-center mt-2">Record post-treatment vitals to proceed</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
