import { useState, useMemo } from "react";
import PatientReadinessBadge from "@/components/shared/PatientReadinessBadge";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import SendInviteDialog from "@/components/admin/SendInviteDialog";
import PatientPipelinePanel from "@/components/admin/PatientPipelinePanel";
import PatientAccountTab from "@/components/admin/PatientAccountTab";
import PatientCommunicationsTab from "@/components/admin/PatientCommunicationsTab";
import PatientChatThread from "@/components/admin/PatientChatThread";
import { usePatient, useUpdatePatient, useDeletePatient } from "@/hooks/usePatients";
import { usePatientMedicalHistory, useUpsertPatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { usePatientDocuments, useUploadPatientDocument, useDeletePatientDocument, useGetDocumentUrl } from "@/hooks/usePatientDocuments";
import { useOnboardingChecklist, useGenerateChecklist, useUpdateChecklistItem } from "@/hooks/useOnboardingChecklist";
import { useFormTemplate, useFormTemplates } from "@/hooks/useFormTemplates";
import { useFormSubmissions, useCreateFormSubmission, useUpdateFormSubmission, useDeleteFormSubmission } from "@/hooks/useFormSubmissions";
import { usePatientNotes, useCreatePatientNote, useDeletePatientNote } from "@/hooks/usePatientNotes";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FullScreenFormDialog from "@/components/forms/FullScreenFormDialog";
import FormRenderer from "@/components/forms/FormRenderer";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Trash2,
  Upload,
  FileText,
  Download,
  Loader2,
  User,
  Phone,
  Mail,
  MapPin,
  Heart,
  Stethoscope,
  FileCheck,
  ClipboardList,
  CheckCircle2,
  Circle,
  Ban,
  Eye,
  CalendarPlus,
  Send,
  Sparkles,
  KeyRound,
  Printer,
  StickyNote,
  Plus,
  MessageCircle,
  Layers,
} from "lucide-react";
import PatientTreatmentCoursesTab from "@/components/admin/PatientTreatmentCoursesTab";
import type { PatientStatus, DocumentType } from "@/types/patient";
import type { FormField } from "@/components/forms/FormRenderer";
import { openPrintableForm } from "@/components/forms/PrintableFormView";

const documentTypeLabels: Record<DocumentType, string> = {
  prescription: "Prescription",
  referral: "Referral Letter",
  consent: "Consent Form",
  id_copy: "ID Copy",
  medical_aid_card: "Medical Aid Card",
  other: "Other",
};

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showNextSteps = searchParams.get("showNextSteps") === "true";
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("other");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [activeFormTemplateId, setActiveFormTemplateId] = useState<string | undefined>();
  const [activeChecklistItemId, setActiveChecklistItemId] = useState<string | undefined>();
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);
  const [newNoteContent, setNewNoteContent] = useState("");

  const { data: patient, isLoading, error } = usePatient(id);
  const { data: medicalHistory } = usePatientMedicalHistory(id);
  const { data: documents } = usePatientDocuments(id);
  const { data: checklist } = useOnboardingChecklist(id);
  const { data: activeFormTemplate } = useFormTemplate(activeFormTemplateId);
  const { data: submissions } = useFormSubmissions(id);
  const { data: allTemplates } = useFormTemplates();
  const { user } = useAuth();
  
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const upsertMedicalHistory = useUpsertPatientMedicalHistory();
  const uploadDocument = useUploadPatientDocument();
  const deleteDocument = useDeletePatientDocument();
  const getDocumentUrl = useGetDocumentUrl();
  const generateChecklist = useGenerateChecklist();
  const updateChecklistItem = useUpdateChecklistItem();
  const createSubmission = useCreateFormSubmission();
  const updateSubmission = useUpdateFormSubmission();
  const deleteSubmission = useDeleteFormSubmission();
  const { data: patientNotes } = usePatientNotes(id);
  const createNote = useCreatePatientNote();
  const deleteNote = useDeletePatientNote();
  // Completed form submissions for dynamic tabs
  const completedSubmissions = useMemo(() => {
    if (!submissions) return [];
    return submissions.filter(
      (s: any) => s.status === 'submitted' || s.status === 'reviewed' || s.status === 'approved'
    );
  }, [submissions]);

  // Build a map of template_id -> schema for rendering
  const templateSchemaMap = useMemo(() => {
    if (!allTemplates) return {};
    const map: Record<string, FormField[]> = {};
    for (const t of allTemplates) {
      map[t.id] = t.form_schema as FormField[];
    }
    return map;
  }, [allTemplates]);

  // Build submission-to-template lookup for the View button fix
  const submissionById = useMemo(() => {
    if (!submissions) return {};
    const map: Record<string, any> = {};
    for (const s of submissions) {
      map[s.id] = s;
    }
    return map;
  }, [submissions]);

  const handleEdit = () => {
    setEditedData({ ...patient });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedData || !id) return;
    
    try {
      await updatePatient.mutateAsync({ id, ...editedData });
      toast.success("Patient updated successfully");
      setIsEditing(false);
      setEditedData(null);
    } catch (error) {
      console.error("Error updating patient:", error);
      toast.error("Failed to update patient");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    try {
      await deletePatient.mutateAsync(id);
      toast.success("Patient deleted successfully");
      navigate("/admin/patients");
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    setUploadingDoc(true);
    try {
      await uploadDocument.mutateAsync({
        patientId: id,
        file,
        documentType: selectedDocType,
      });
      toast.success("Document uploaded successfully");
      event.target.value = '';
    } catch (error) {
      console.error("Error uploading document:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    try {
      const url = await getDocumentUrl.mutateAsync(filePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (!id) return;
    
    try {
      await deleteDocument.mutateAsync({ id: docId, filePath, patientId: id });
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Patient not found</p>
        <Button variant="outline" onClick={() => navigate('/admin/patients')} className="mt-4">
          Back to Patients
        </Button>
      </div>
    );
  }

  const displayData = isEditing ? editedData : patient;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/patients')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-medium">
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">
                {patient.first_name} {patient.last_name}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                  {patient.status}
                </Badge>
                <PatientReadinessBadge patientId={patient.id} />
                {patient.id_number && (
                  <span className="text-sm text-muted-foreground">
                    ID: {patient.id_number}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updatePatient.isPending}>
                {updatePatient.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </>
          ) : (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this patient? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <SendInviteDialog
                patientId={id!}
                patientEmail={patient.email}
                patientPhone={patient.phone}
                patientName={`${patient.first_name} ${patient.last_name}`}
              />
              <Button variant="outline" onClick={() => navigate(`/admin/appointments/new?patient_id=${id}`)}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
              <Button onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Next Steps Card (shown after patient creation) */}
      {showNextSteps && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Patient Created — What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  generateChecklist.mutate({ patientId: id! });
                  setSearchParams({});
                  toast.success("Onboarding checklist generated");
                }}
                disabled={generateChecklist.isPending}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Generate Onboarding Checklist
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/appointments/new?patient_id=${id}`)}
              >
                <CalendarPlus className="mr-2 h-4 w-4" />
                Book First Appointment
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSearchParams({})}
              >
                Done for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="profile">
        {patient && (
          <PatientPipelinePanel
            patient={{
              id: patient.id,
              user_id: patient.user_id,
              email: patient.email,
              phone: patient.phone,
              first_name: patient.first_name,
            }}
          />
        )}
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Stethoscope className="mr-2 h-4 w-4" />
            Medical History
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileCheck className="mr-2 h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="treatment-course">
            <Layers className="mr-2 h-4 w-4" />
            Treatment Course
          </TabsTrigger>
          <TabsTrigger value="onboarding">
            <ClipboardList className="mr-2 h-4 w-4" />
            Onboarding
            {checklist && checklist.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {checklist.filter(c => c.status === 'completed').length}/{checklist.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="communications">
            <Mail className="mr-2 h-4 w-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="account">
            <KeyRound className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          {completedSubmissions.length > 0 && (
            <TabsTrigger value="completed-forms">
              <FileCheck className="mr-2 h-4 w-4" />
              Completed Forms
              <Badge variant="secondary" className="ml-2 text-xs">
                {completedSubmissions.length}
              </Badge>
            </TabsTrigger>
          )}
          <TabsTrigger value="notes">
            <StickyNote className="mr-2 h-4 w-4" />
            Notes
            {patientNotes && patientNotes.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {patientNotes.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="mr-2 h-4 w-4" />
            Messages
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={editedData?.first_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, first_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={editedData?.last_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, last_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">ID Number</label>
                      <Input
                        value={editedData?.id_number || ''}
                        onChange={(e) => setEditedData({ ...editedData, id_number: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Date of Birth</label>
                      <Input
                        type="date"
                        value={editedData?.date_of_birth || ''}
                        onChange={(e) => setEditedData({ ...editedData, date_of_birth: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Gender</label>
                      <Select
                        value={editedData?.gender || ''}
                        onValueChange={(value) => setEditedData({ ...editedData, gender: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select
                        value={editedData?.status || 'active'}
                        onValueChange={(value) => setEditedData({ ...editedData, status: value as PatientStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-muted-foreground">Date of Birth</dt>
                      <dd>{formatDate(displayData.date_of_birth)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Gender</dt>
                      <dd className="capitalize">{displayData.gender || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Created</dt>
                      <dd>{formatDate(displayData.created_at)}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        value={editedData?.phone || ''}
                        onChange={(e) => setEditedData({ ...editedData, phone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={editedData?.email || ''}
                        onChange={(e) => setEditedData({ ...editedData, email: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Address Line 1</label>
                      <Input
                        value={editedData?.address_line_1 || ''}
                        onChange={(e) => setEditedData({ ...editedData, address_line_1: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Address Line 2</label>
                      <Input
                        value={editedData?.address_line_2 || ''}
                        onChange={(e) => setEditedData({ ...editedData, address_line_2: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">City</label>
                      <Input
                        value={editedData?.city || ''}
                        onChange={(e) => setEditedData({ ...editedData, city: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Postal Code</label>
                      <Input
                        value={editedData?.postal_code || ''}
                        onChange={(e) => setEditedData({ ...editedData, postal_code: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <dl className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <dd>{displayData.phone || '—'}</dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <dd>{displayData.email || '—'}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <dd>
                        {displayData.address_line_1 || displayData.city ? (
                          <>
                            {displayData.address_line_1}<br />
                            {displayData.address_line_2 && <>{displayData.address_line_2}<br /></>}
                            {displayData.city} {displayData.postal_code}
                          </>
                        ) : '—'}
                      </dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Contact Name</label>
                      <Input
                        value={editedData?.emergency_contact_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Contact Phone</label>
                      <Input
                        value={editedData?.emergency_contact_phone || ''}
                        onChange={(e) => setEditedData({ ...editedData, emergency_contact_phone: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Relationship</label>
                      <Input
                        value={editedData?.emergency_contact_relationship || ''}
                        onChange={(e) => setEditedData({ ...editedData, emergency_contact_relationship: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-muted-foreground">Name</dt>
                      <dd>{displayData.emergency_contact_name || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Phone</dt>
                      <dd>{displayData.emergency_contact_phone || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Relationship</dt>
                      <dd>{displayData.emergency_contact_relationship || '—'}</dd>
                    </div>
                  </dl>
                )}
              </CardContent>
            </Card>

            {/* Medical Aid */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5" />
                  Medical Aid & Referring Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Medical Aid</label>
                      <Input
                        value={editedData?.medical_aid_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, medical_aid_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Membership Number</label>
                      <Input
                        value={editedData?.medical_aid_number || ''}
                        onChange={(e) => setEditedData({ ...editedData, medical_aid_number: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Plan</label>
                      <Input
                        value={editedData?.medical_aid_plan || ''}
                        onChange={(e) => setEditedData({ ...editedData, medical_aid_plan: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Referring Doctor</label>
                      <Input
                        value={editedData?.referring_doctor_name || ''}
                        onChange={(e) => setEditedData({ ...editedData, referring_doctor_name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Doctor Practice</label>
                      <Input
                        value={editedData?.referring_doctor_practice || ''}
                        onChange={(e) => setEditedData({ ...editedData, referring_doctor_practice: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Doctor Phone</label>
                      <Input
                        value={editedData?.referring_doctor_phone || ''}
                        onChange={(e) => setEditedData({ ...editedData, referring_doctor_phone: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">Medical Aid</dt>
                        <dd>{displayData.medical_aid_name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Membership Number</dt>
                        <dd>{displayData.medical_aid_number || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Plan</dt>
                        <dd>{displayData.medical_aid_plan || '—'}</dd>
                      </div>
                    </dl>
                    <hr />
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm text-muted-foreground">Referring Doctor</dt>
                        <dd>{displayData.referring_doctor_name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Practice</dt>
                        <dd>{displayData.referring_doctor_practice || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground">Doctor Phone</dt>
                        <dd>{displayData.referring_doctor_phone || '—'}</dd>
                      </div>
                    </dl>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedData?.notes || ''}
                  onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
                  placeholder="Add any notes about this patient..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground">
                  {displayData.notes || 'No notes added.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Allergies</h4>
                {medicalHistory?.allergies && medicalHistory.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No known allergies</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Chronic Conditions</h4>
                {medicalHistory?.chronic_conditions && medicalHistory.chronic_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalHistory.chronic_conditions.map((condition, i) => (
                      <Badge key={i} variant="secondary">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No chronic conditions recorded</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Current Medications</h4>
                {medicalHistory?.current_medications && medicalHistory.current_medications.length > 0 ? (
                  <ul className="space-y-1">
                    {medicalHistory.current_medications.map((med, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-medium">{med.name}</span>
                        {med.dosage && ` — ${med.dosage}`}
                        {med.frequency && ` (${med.frequency})`}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No medications recorded</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Previous Surgeries</h4>
                <p className={medicalHistory?.previous_surgeries ? '' : 'text-muted-foreground'}>
                  {medicalHistory?.previous_surgeries || 'No previous surgeries recorded'}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className={medicalHistory?.notes ? '' : 'text-muted-foreground'}>
                  {medicalHistory?.notes || 'No additional notes'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Documents</span>
                <div className="flex items-center gap-2">
                  <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" disabled={uploadingDoc} asChild>
                    <label className="cursor-pointer">
                      {uploadingDoc ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingDoc}
                      />
                    </label>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents && documents.length > 0 ? (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.file_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {documentTypeLabels[doc.document_type]} • Uploaded {formatDate(doc.uploaded_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Document</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{doc.file_name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDocument(doc.id, doc.file_path)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">No documents uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Treatment Course Tab */}
        <TabsContent value="treatment-course" className="space-y-4">
          <PatientTreatmentCoursesTab patientId={id!} />
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          {/* Progress */}
          {checklist && checklist.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Onboarding Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {checklist.filter(c => c.status === 'completed').length} of {checklist.length} forms completed
                  </span>
                </div>
                <Progress
                  value={(checklist.filter(c => c.status === 'completed').length / checklist.length) * 100}
                />
              </CardContent>
            </Card>
          )}

          {/* Generate Checklist */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => id && generateChecklist.mutateAsync({ patientId: id })}
              disabled={generateChecklist.isPending}
            >
              {generateChecklist.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ClipboardList className="mr-2 h-4 w-4" />
              )}
              Generate Checklist
            </Button>
          </div>

          {/* Checklist Items */}
          {!checklist || checklist.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No onboarding forms assigned yet.</p>
                <p className="text-sm">Click "Generate Checklist" to assign forms based on treatment type.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {checklist.map((item) => (
                <Card key={item.id}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : item.status === 'waived' ? (
                        <Ban className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{item.form_templates?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.form_templates?.category && (
                            <Badge variant="secondary" className="text-xs mr-2">
                              {item.form_templates.category.replace('_', ' ')}
                            </Badge>
                          )}
                          {item.status === 'completed' && item.completed_at && (
                            <span>Completed {new Date(item.completed_at).toLocaleDateString('en-ZA')}</span>
                          )}
                          {item.status === 'waived' && item.notes && (
                            <span>Waived: {item.notes}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {item.status !== 'completed' && item.status !== 'waived' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => {
                              setActiveFormTemplateId(item.form_template_id);
                              setActiveChecklistItemId(item.id);
                              setFormValues({});
                              setFormDialogOpen(true);
                            }}
                          >
                            Fill Form
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const note = prompt("Reason for waiving this form:");
                              if (note !== null) {
                                await updateChecklistItem.mutateAsync({
                                  id: item.id,
                                  status: 'waived',
                                  notes: note || 'Waived by admin',
                                });
                              }
                            }}
                          >
                            Waive
                          </Button>
                        </>
                      )}
                      {item.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Load actual submission data for the View button
                            const submission = item.form_submission_id
                              ? submissionById[item.form_submission_id]
                              : null;
                            setActiveFormTemplateId(item.form_template_id);
                            setActiveChecklistItemId(undefined);
                            setFormValues(submission?.data && typeof submission.data === 'object' ? submission.data as Record<string, any> : {});
                            setFormDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-4">
          <PatientCommunicationsTab
            patientEmail={patient.email}
            patientName={`${patient.first_name} ${patient.last_name}`}
          />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <PatientAccountTab
            patientId={id!}
            patientEmail={patient.email}
            patientUserId={patient.user_id}
            patientName={`${patient.first_name} ${patient.last_name}`}
          />
        </TabsContent>

        {/* Completed Forms Tab */}
        <TabsContent value="completed-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Completed Forms ({completedSubmissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedSubmissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No completed forms yet.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium text-muted-foreground">Form Name</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Date Submitted</th>
                        <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                        <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedSubmissions.map((sub: any) => {
                        const schema = templateSchemaMap[sub.form_template_id] || [];
                        const submissionData = (sub.data && typeof sub.data === 'object' ? sub.data : {}) as Record<string, any>;
                        return (
                          <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                {sub.form_templates?.name || "Submitted Form"}
                                {sub.admin_amendments && Object.keys(sub.admin_amendments).length > 0 && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Amended</Badge>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(sub.created_at).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="p-3">
                              <Badge variant="secondary" className="capitalize">{sub.status}</Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5"
                                  onClick={() => {
                                    setViewingSubmission(sub);
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  View
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 gap-1.5"
                                  onClick={() =>
                                    openPrintableForm({
                                      title: sub.form_templates?.name || "Submitted Form",
                                      schema,
                                      values: submissionData,
                                      patientInfo: {
                                        name: `${patient.first_name} ${patient.last_name}`,
                                        email: patient.email || undefined,
                                        idNumber: patient.id_number || undefined,
                                        phone: patient.phone || undefined,
                                      },
                                      submittedAt: sub.created_at,
                                      signatureData: sub.signature_data || undefined,
                                    })
                                  }
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                  Print
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1.5 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Form Submission</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this "{sub.form_templates?.name}" submission? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-destructive-foreground"
                                        onClick={async () => {
                                          try {
                                            await deleteSubmission.mutateAsync(sub.id);
                                            toast.success("Form submission deleted");
                                          } catch {
                                            toast.error("Failed to delete submission");
                                          }
                                        }}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Full-screen viewer for completed form submissions */}
        {viewingSubmission && (
          <FullScreenFormDialog
            open={!!viewingSubmission}
            onClose={() => setViewingSubmission(null)}
            title={viewingSubmission.form_templates?.name || "Submitted Form"}
            schema={(templateSchemaMap[viewingSubmission.form_template_id] || []) as FormField[]}
            values={(viewingSubmission.data && typeof viewingSubmission.data === 'object' ? viewingSubmission.data : {}) as Record<string, any>}
            onChange={() => {}}
            readOnly
            patientInfo={{
              name: `${patient.first_name} ${patient.last_name}`,
              email: patient.email || undefined,
              idNumber: patient.id_number || undefined,
              phone: patient.phone || undefined,
            }}
            submittedAt={viewingSubmission.created_at}
            signatureData={viewingSubmission.signature_data || undefined}
            amendments={viewingSubmission.admin_amendments || {}}
            onSaveAmendments={async (updatedData, amendments) => {
              await updateSubmission.mutateAsync({
                id: viewingSubmission.id,
                data: updatedData,
                admin_amendments: amendments,
              } as any);
              // Update local state so the viewer reflects changes
              setViewingSubmission({ ...viewingSubmission, data: updatedData, admin_amendments: amendments });
            }}
          />
        )}

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Patient Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add note form */}
              <div className="flex gap-2">
                <Textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note about this patient..."
                  className="min-h-[80px]"
                />
              </div>
              <Button
                size="sm"
                disabled={!newNoteContent.trim() || createNote.isPending}
                onClick={async () => {
                  if (!id || !newNoteContent.trim()) return;
                  await createNote.mutateAsync({
                    patient_id: id,
                    content: newNoteContent.trim(),
                    created_by: user?.id,
                  });
                  setNewNoteContent("");
                  toast.success("Note added");
                }}
              >
                {createNote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Note
              </Button>

              {/* Notes list */}
              {!patientNotes || patientNotes.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">No notes yet.</p>
              ) : (
                <div className="space-y-3 mt-4">
                  {patientNotes.map((note) => (
                    <div key={note.id} className="border rounded-lg p-4 space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(note.created_at).toLocaleString('en-ZA')}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-destructive hover:text-destructive"
                          onClick={async () => {
                            if (!id) return;
                            await deleteNote.mutateAsync({ id: note.id, patientId: id });
                            toast.success("Note deleted");
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          <Card className="flex flex-col h-[500px] overflow-hidden">
            <CardHeader className="pb-2 border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages with {patient.first_name} {patient.last_name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              <PatientChatThread patientId={id!} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full-screen Form Dialog */}
      <FullScreenFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        title={activeFormTemplate?.name || ""}
        description={activeFormTemplate?.description || undefined}
        schema={(activeFormTemplate?.form_schema as FormField[]) || []}
        values={formValues}
        onChange={setFormValues}
        readOnly={!activeChecklistItemId}
        patientInfo={{
          name: `${patient.first_name} ${patient.last_name}`,
          email: patient.email || undefined,
          idNumber: patient.id_number || undefined,
          phone: patient.phone || undefined,
        }}
        submittedAt={new Date().toISOString()}
        onSubmit={activeChecklistItemId ? async () => {
          if (!id || !activeFormTemplate || !activeChecklistItemId) return;
          try {
            const submission = await createSubmission.mutateAsync({
              form_template_id: activeFormTemplate.id,
              patient_id: id,
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
            toast.success("Form submitted successfully");
            setFormDialogOpen(false);
          } catch (err) {
            console.error(err);
            toast.error("Failed to submit form");
          }
        } : undefined}
        isSubmitting={createSubmission.isPending}
      />
    </div>
  );
}
