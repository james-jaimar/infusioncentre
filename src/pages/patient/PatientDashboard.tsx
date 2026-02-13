import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Phone, ClipboardList, CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { Link } from "react-router-dom";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { useFormTemplate } from "@/hooks/useFormTemplates";
import { useCreateFormSubmission } from "@/hooks/useFormSubmissions";
import { useUpdateChecklistItem } from "@/hooks/useOnboardingChecklist";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FullScreenFormDialog from "@/components/forms/FullScreenFormDialog";
import type { FormField } from "@/components/forms/FormRenderer";
import { usePatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { prefillFormValues } from "@/lib/prefillFormData";
import type { Patient } from "@/types/patient";

export default function PatientDashboard() {
  const { profile, user } = useAuth();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [activeFormTemplateId, setActiveFormTemplateId] = useState<string | undefined>();
  const [activeChecklistItemId, setActiveChecklistItemId] = useState<string | undefined>();
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const firstName = profile?.first_name || "there";

  // Get the full patient record linked to this user
  const { data: patientRecord } = useQuery({
    queryKey: ["my_patient_record"],
    queryFn: async () => {
      const { data } = await supabase
        .from("patients")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      return data as Patient | null;
    },
    enabled: !!user?.id,
  });

  const { data: medicalHistory } = usePatientMedicalHistory(patientRecord?.id);

  const { data: checklist } = useOnboardingChecklist(patientRecord?.id);
  const { data: activeFormTemplate } = useFormTemplate(activeFormTemplateId);
  const createSubmission = useCreateFormSubmission();
  const updateChecklistItem = useUpdateChecklistItem();

  const pendingForms = checklist?.filter(c => c.status === 'pending' || c.status === 'in_progress') || [];
  const completedForms = checklist?.filter(c => c.status === 'completed') || [];
  const allFormsComplete = checklist && checklist.length > 0 && pendingForms.length === 0;

  // Check if this is a newly invited patient (has checklist items but hasn't completed any)
  const isNewPatient = checklist && checklist.length > 0 && completedForms.length === 0;

  const prefillAppliedRef = useRef<string | null>(null);

  const handleOpenForm = (item: any) => {
    prefillAppliedRef.current = null;
    setActiveFormTemplateId(item.form_template_id);
    setActiveChecklistItemId(item.id);
    setFormValues({});
    setFormDialogOpen(true);
  };

  // Apply prefill when form template loads and patient data is available
  useEffect(() => {
    const schema = activeFormTemplate?.form_schema as FormField[] | undefined;
    if (!schema || !patientRecord || !formDialogOpen) return;
    if (prefillAppliedRef.current === activeFormTemplate.id) return;
    prefillAppliedRef.current = activeFormTemplate.id;
    const prefilled = prefillFormValues(schema, patientRecord, medicalHistory);
    if (Object.keys(prefilled).length > 0) {
      setFormValues(prefilled);
    }
  }, [activeFormTemplate, patientRecord, medicalHistory, formDialogOpen]);

  const handleSubmitForm = async () => {
    if (!patientRecord?.id || !activeFormTemplate || !activeChecklistItemId) return;
    try {
      const submission = await createSubmission.mutateAsync({
        form_template_id: activeFormTemplate.id,
        patient_id: patientRecord.id,
        data: formValues,
        status: 'submitted',
        submitted_by: user?.id,
      });
      await updateChecklistItem.mutateAsync({
        id: activeChecklistItemId,
        status: 'completed',
        form_submission_id: submission.id,
        completed_at: new Date().toISOString(),
      });
      toast.success("Form submitted successfully!");
      setFormDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit form");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome, {firstName}!
        </h1>
        <p className="text-muted-foreground">
          Manage your appointments and view your treatment records.
        </p>
      </div>

      {/* Welcome Banner for new patients */}
      {isNewPatient && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Welcome to Johannesburg Infusion Centre!</h2>
                <p className="text-muted-foreground mt-1">
                  Please complete the forms below before your first appointment. This helps us prepare for your visit and saves time at the clinic.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Celebration */}
      {allFormsComplete && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <PartyPopper className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-green-700 dark:text-green-400">All forms complete!</h2>
                <p className="text-muted-foreground mt-1">
                  You're all set for your appointment. We look forward to seeing you!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Forms — clickable */}
      {pendingForms.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Outstanding Forms ({pendingForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingForms.map((item) => (
              <button
                key={item.id}
                onClick={() => handleOpenForm(item)}
                className="w-full flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">{item.form_templates?.name}</span>
                    {item.form_templates?.description && (
                      <span className="text-xs text-muted-foreground">{item.form_templates.description}</span>
                    )}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {item.form_templates?.category?.replace('_', ' ')}
                </Badge>
              </button>
            ))}
            <p className="text-xs text-muted-foreground pt-2">
              Click on a form to fill it in. You can also complete these at the clinic.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completed Forms */}
      {completedForms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Completed Forms ({completedForms.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {completedForms.map((item) => (
              <div key={item.id} className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                <span>{item.form_templates?.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              No upcoming appointments
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contact">Request Appointment</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Treatment Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              View your treatment history
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient/records">View Records</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Contact Us</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Questions? Get in touch
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to="/contact">Contact</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Your Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This patient portal allows you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>View your upcoming and past appointments</li>
            <li>Access your treatment records and history</li>
            <li>Update your profile and contact information</li>
            <li>Request new appointments through our contact form</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            If you have any questions or need assistance, please don't hesitate to contact us at{" "}
            <a href="tel:+27118801830" className="text-primary hover:underline">
              011 880 1830
            </a>.
          </p>
        </CardContent>
      </Card>

      {/* Full-screen Form Dialog */}
      <FullScreenFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        title={activeFormTemplate?.name || ""}
        description={activeFormTemplate?.description || undefined}
        schema={(activeFormTemplate?.form_schema as FormField[]) || []}
        values={formValues}
        onChange={setFormValues}
        onSubmit={handleSubmitForm}
        isSubmitting={createSubmission.isPending}
        submitLabel="Submit Form"
      />
    </div>
  );
}
