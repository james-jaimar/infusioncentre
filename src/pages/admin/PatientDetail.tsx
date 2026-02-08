import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePatient, useUpdatePatient, useDeletePatient } from "@/hooks/usePatients";
import { usePatientMedicalHistory, useUpsertPatientMedicalHistory } from "@/hooks/usePatientMedicalHistory";
import { usePatientDocuments, useUploadPatientDocument, useDeletePatientDocument, useGetDocumentUrl } from "@/hooks/usePatientDocuments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import type { PatientStatus, DocumentType } from "@/types/patient";

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
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>("other");

  const { data: patient, isLoading, error } = usePatient(id);
  const { data: medicalHistory } = usePatientMedicalHistory(id);
  const { data: documents } = usePatientDocuments(id);
  
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();
  const upsertMedicalHistory = useUpsertPatientMedicalHistory();
  const uploadDocument = useUploadPatientDocument();
  const deleteDocument = useDeletePatientDocument();
  const getDocumentUrl = useGetDocumentUrl();

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
              <Button onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
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
      </Tabs>
    </div>
  );
}
