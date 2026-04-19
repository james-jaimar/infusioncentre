import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDoctorProfile } from "@/hooks/useDoctors";
import { useCreateReferral } from "@/hooks/useReferrals";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useActiveCourseTemplatesByType } from "@/hooks/useCourseTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, X, FileText, Save } from "lucide-react";

export default function DoctorNewReferral() {
  const { data: doctor } = useDoctorProfile();
  const createReferral = useCreateReferral();
  const { data: appointmentTypes } = useAppointmentTypes();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [form, setForm] = useState({
    patient_first_name: "",
    patient_last_name: "",
    patient_email: "",
    patient_phone: "",
    diagnosis: "",
    treatment_requested: "",
    prescription_notes: "",
    urgency: "routine" as "routine" | "urgent",
    // New fields
    medical_aid_scheme: "",
    medical_aid_number: "",
    medical_aid_main_member: "",
    icd10_codes: "",
    clinical_history: "",
    current_medications: "",
    reason_for_referral: "",
    treatment_type_id: "",
    course_template_id: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const addFiles = (newFiles: FileList | File[]) => {
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadAttachments = async (referralId: string) => {
    for (const file of files) {
      const filePath = `${doctor!.id}/${referralId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("referral-attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      await supabase.from("referral_attachments").insert({
        referral_id: referralId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault();
    if (!doctor?.id) {
      toast({ title: "Doctor profile not found", variant: "destructive" });
      return;
    }
    if (!asDraft && (!form.patient_first_name || !form.patient_last_name)) {
      toast({ title: "Patient name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const icd10Array = form.icd10_codes
        ? form.icd10_codes.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const referralData: any = {
        doctor_id: doctor.id,
        patient_first_name: form.patient_first_name,
        patient_last_name: form.patient_last_name,
        patient_email: form.patient_email || null,
        patient_phone: form.patient_phone || null,
        diagnosis: form.diagnosis || null,
        treatment_requested: form.treatment_requested || null,
        prescription_notes: form.prescription_notes || null,
        urgency: form.urgency,
        status: asDraft ? "draft" : "pending",
        // New fields
        medical_aid_scheme: form.medical_aid_scheme || null,
        medical_aid_number: form.medical_aid_number || null,
        medical_aid_main_member: form.medical_aid_main_member || null,
        icd10_codes: icd10Array.length > 0 ? icd10Array : null,
        clinical_history: form.clinical_history || null,
        current_medications: form.current_medications || null,
        reason_for_referral: form.reason_for_referral || null,
        treatment_type_id: form.treatment_type_id || null,
        course_template_id: form.course_template_id || null,
      };

      const result = await createReferral.mutateAsync(referralData);

      // Upload attachments
      if (files.length > 0 && result?.id) {
        await uploadAttachments(result.id);
      }

      toast({ title: asDraft ? "Draft saved" : "Referral submitted successfully" });
      navigate("/doctor/referrals");
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: string, value: string) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset variant when type changes
      if (field === "treatment_type_id") next.course_template_id = "";
      return next;
    });

  const activeTypes = appointmentTypes?.filter((t: any) => t.is_active) || [];
  const { data: variants = [] } = useActiveCourseTemplatesByType(form.treatment_type_id || undefined);

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Patient Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name *</Label>
                <Input value={form.patient_first_name} onChange={(e) => update("patient_first_name", e.target.value)} required />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.patient_last_name} onChange={(e) => update("patient_last_name", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.patient_email} onChange={(e) => update("patient_email", e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.patient_phone} onChange={(e) => update("patient_phone", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Aid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Medical Aid Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Scheme Name</Label>
                <Input value={form.medical_aid_scheme} onChange={(e) => update("medical_aid_scheme", e.target.value)} placeholder="e.g. Discovery Health" />
              </div>
              <div>
                <Label>Member Number</Label>
                <Input value={form.medical_aid_number} onChange={(e) => update("medical_aid_number", e.target.value)} />
              </div>
              <div>
                <Label>Main Member</Label>
                <Input value={form.medical_aid_main_member} onChange={(e) => update("medical_aid_main_member", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clinical Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Reason for Referral</Label>
              <Textarea value={form.reason_for_referral} onChange={(e) => update("reason_for_referral", e.target.value)} rows={2} placeholder="Primary reason for referring this patient..." />
            </div>
            <div>
              <Label>Diagnosis</Label>
              <Textarea value={form.diagnosis} onChange={(e) => update("diagnosis", e.target.value)} rows={2} />
            </div>
            <div>
              <Label>ICD-10 Codes</Label>
              <Input value={form.icd10_codes} onChange={(e) => update("icd10_codes", e.target.value)} placeholder="e.g. M05.79, M06.09 (comma-separated)" />
              <p className="text-xs text-muted-foreground mt-1">Enter ICD-10 diagnosis codes separated by commas</p>
            </div>
            <div>
              <Label>Clinical History</Label>
              <Textarea value={form.clinical_history} onChange={(e) => update("clinical_history", e.target.value)} rows={3} placeholder="Relevant medical history, previous treatments, comorbidities..." />
            </div>
            <div>
              <Label>Current Medications</Label>
              <Textarea value={form.current_medications} onChange={(e) => update("current_medications", e.target.value)} rows={2} placeholder="List current medications and dosages..." />
            </div>
          </CardContent>
        </Card>

        {/* Treatment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Treatment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTypes.length > 0 && (
              <div>
                <Label>Treatment Type</Label>
                <Select value={form.treatment_type_id} onValueChange={(v) => update("treatment_type_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select treatment type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTypes.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {form.treatment_type_id && variants.length > 0 && (
              <div>
                <Label>Treatment Variant</Label>
                <Select value={form.course_template_id} onValueChange={(v) => update("course_template_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select variant / medication..." />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        {v.default_sessions > 1 ? ` — ${v.default_sessions} sessions` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Pre-configured by the clinic. Selecting a variant pre-fills sessions, frequency and required forms.
                </p>
              </div>
            )}
            <div>
              <Label>Treatment Requested</Label>
              <Input value={form.treatment_requested} onChange={(e) => update("treatment_requested", e.target.value)} placeholder="e.g. Infliximab infusion, Iron infusion..." />
            </div>
            <div>
              <Label>Prescription / Notes</Label>
              <Textarea value={form.prescription_notes} onChange={(e) => update("prescription_notes", e.target.value)} rows={3} placeholder="Dosage, frequency, special instructions..." />
            </div>
            <div>
              <Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => update("urgency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Attachments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onClick={() => document.getElementById("file-upload")?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragEnter={() => setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              }`}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop files here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG, DOC, HEIC, WEBP — up to 10MB each</p>
            </div>
            <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileAdd} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic,.webp" />
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md bg-muted/50 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="button" variant="secondary" disabled={saving} onClick={(e) => handleSubmit(e as any, true)} className="gap-2">
            <Save className="h-4 w-4" /> Save as Draft
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit Referral"}
          </Button>
        </div>
      </form>
    </div>
  );
}
