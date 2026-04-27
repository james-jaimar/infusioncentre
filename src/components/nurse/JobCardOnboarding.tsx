import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClipboardList, FileText, MoreHorizontal, ScanLine, UserPen } from "lucide-react";
import { useOnboardingChecklist, useUpdateChecklistItem } from "@/hooks/useOnboardingChecklist";
import { useFormTemplate } from "@/hooks/useFormTemplates";
import { useCreateFormSubmission } from "@/hooks/useFormSubmissions";
import { usePatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { useFeatureFlags } from "@/hooks/useClinicSettings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import FullScreenFormDialog from "@/components/forms/FullScreenFormDialog";
import PatientKioskMode from "./PatientKioskMode";
import type { FormField } from "@/components/forms/FormRenderer";
import type { OverlayField } from "@/components/forms/PdfOverlayRenderer";
import { prefillFormValues } from "@/lib/prefillFormData";

interface JobCardOnboardingProps {
  patientId: string;
  patientName: string;
}

type Mode = "nurse" | "kiosk";

export default function JobCardOnboarding({ patientId, patientName }: JobCardOnboardingProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: checklist } = useOnboardingChecklist(patientId);
  const { data: medicalHistory } = usePatientMedicalHistory(patientId);
  const { data: flags } = useFeatureFlags();
  const updateChecklistItem = useUpdateChecklistItem();
  const createSubmission = useCreateFormSubmission();

  const assistEnabled =
    flags?.find((f) => f.key === "nurse_can_assist_forms")?.is_enabled ?? true;

  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [activeChecklistItemId, setActiveChecklistItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("nurse");
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});
  const [patientRecord, setPatientRecord] = useState<any>(null);
  const prefillAppliedRef = useRef<string | null>(null);

  const { data: activeTemplate } = useFormTemplate(activeTemplateId || undefined);

  // Load patient record once for prefill purposes.
  useEffect(() => {
    if (!patientId) return;
    supabase.from("patients").select("*").eq("id", patientId).single().then(({ data }) => {
      if (data) setPatientRecord(data);
    });
  }, [patientId]);

  // Apply prefill once per template when the form opens.
  useEffect(() => {
    const schema = activeTemplate?.form_schema as FormField[] | undefined;
    if (!schema || !patientRecord || !open) return;
    if (prefillAppliedRef.current === activeTemplate.id) return;
    prefillAppliedRef.current = activeTemplate.id;
    const prefilled = prefillFormValues(schema, patientRecord, medicalHistory);
    if (Object.keys(prefilled).length > 0) {
      setValues(prefilled);
    }
  }, [activeTemplate, patientRecord, medicalHistory, open]);

  if (!checklist || checklist.length === 0) return null;

  const completed = checklist.filter((c) => c.status === "completed").length;
  const total = checklist.length;
  const progressPct = Math.round((completed / total) * 100);

  const openForm = (item: any, m: Mode) => {
    if (item.status === "completed") return;
    prefillAppliedRef.current = null;
    setActiveTemplateId(item.form_template_id);
    setActiveChecklistItemId(item.id);
    setValues({});
    setMode(m);
    setOpen(true);
  };

  const closeForm = () => {
    setOpen(false);
    setActiveTemplateId(null);
    setActiveChecklistItemId(null);
  };

  const handleSubmit = async () => {
    if (!activeTemplate || !activeChecklistItemId) return;
    try {
      const submission = await createSubmission.mutateAsync({
        form_template_id: activeTemplate.id,
        patient_id: patientId,
        data: {
          ...values,
          completed_with_nurse_assistance: mode === "nurse",
          completed_via: mode === "kiosk" ? "patient_kiosk" : "nurse_assisted",
        },
        status: "submitted",
        submitted_by: user?.id,
      });
      await updateChecklistItem.mutateAsync({
        id: activeChecklistItemId,
        status: "completed",
        form_submission_id: submission.id,
        completed_at: new Date().toISOString(),
      });
      // Invalidate readiness so Start Treatment unlocks immediately.
      qc.invalidateQueries({ queryKey: ["form_submissions_readiness", patientId] });
      qc.invalidateQueries({ queryKey: ["form_submissions", patientId] });
      toast.success(mode === "kiosk" ? "Patient form submitted." : "Form completed.");
      closeForm();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit form.");
    }
  };

  const schema = (activeTemplate?.form_schema as FormField[]) || [];
  const renderMode = (activeTemplate?.render_mode as "schema" | "pdf_overlay" | "facsimile") || "schema";
  const pdfPages = (activeTemplate?.pdf_pages as string[]) || [];
  const overlayFields = (activeTemplate?.overlay_fields as OverlayField[]) || [];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Onboarding Forms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={progressPct} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{completed}/{total} forms completed</p>

          <div className="space-y-1.5">
            {checklist.map((item) => {
              const isDone = item.status === "completed";
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 min-h-[44px]">
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs truncate ${isDone ? "text-muted-foreground" : "font-medium text-foreground"}`}>
                      {item.form_templates?.name || "Form"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant={isDone ? "success" : "outline"} className="text-[10px]">
                      {isDone ? "Done" : "Pending"}
                    </Badge>
                    {!isDone && assistEnabled && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" className="h-8 px-2">
                            Help <MoreHorizontal className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => openForm(item, "nurse")}>
                            <UserPen className="mr-2 h-4 w-4" /> Complete with patient
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openForm(item, "kiosk")}>
                            <ScanLine className="mr-2 h-4 w-4" /> Hand tablet to patient
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!assistEnabled && checklist.some((c) => c.status !== "completed") && (
            <p className="text-[11px] text-muted-foreground italic flex items-start gap-1.5 pt-1">
              <ClipboardList className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Nurse-assisted form completion is disabled. Patient must complete forms in their portal.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Nurse-assisted full-screen form */}
      {mode === "nurse" && (
        <FullScreenFormDialog
          open={open}
          onClose={closeForm}
          title={activeTemplate?.name || ""}
          description={activeTemplate?.description || undefined}
          schema={schema}
          values={values}
          onChange={setValues}
          onSubmit={handleSubmit}
          isSubmitting={createSubmission.isPending || updateChecklistItem.isPending}
          submitLabel="Submit Form"
          renderMode={renderMode}
          pdfPages={pdfPages}
          overlayFields={overlayFields}
          slug={activeTemplate?.slug || undefined}
        />
      )}

      {/* Patient kiosk handoff */}
      {mode === "kiosk" && (
        <PatientKioskMode
          open={open}
          onClose={closeForm}
          onSubmit={handleSubmit}
          isSubmitting={createSubmission.isPending || updateChecklistItem.isPending}
          patientName={patientName}
          formTitle={activeTemplate?.name || ""}
          formDescription={activeTemplate?.description || undefined}
          schema={schema}
          values={values}
          onChange={setValues}
          renderMode={renderMode}
          pdfPages={pdfPages}
          overlayFields={overlayFields}
          slug={activeTemplate?.slug || undefined}
        />
      )}
    </>
  );
}
