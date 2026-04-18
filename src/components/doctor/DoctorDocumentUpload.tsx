import { useState } from "react";
import { format } from "date-fns";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
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
import {
  usePatientDocuments,
  useUploadPatientDocument,
  useGetDocumentUrl,
} from "@/hooks/usePatientDocuments";
import type { DocumentType } from "@/types/patient";
import { useToast } from "@/hooks/use-toast";

const DOC_TYPES: { value: DocumentType; label: string }[] = [
  { value: "referral", label: "Referral letter" },
  { value: "prescription", label: "Prescription" },
  { value: "consent", label: "Consent form" },
  { value: "id_copy", label: "ID copy" },
  { value: "medical_aid_card", label: "Medical aid card" },
  { value: "other", label: "Other" },
];

interface Props {
  patientId: string;
}

export function DoctorDocumentUpload({ patientId }: Props) {
  const { toast } = useToast();
  const { data: documents = [], isLoading } = usePatientDocuments(patientId);
  const upload = useUploadPatientDocument();
  const getUrl = useGetDocumentUrl();

  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>("referral");
  const [notes, setNotes] = useState("");

  const handleUpload = async () => {
    if (!file) {
      toast({ title: "Please choose a file", variant: "destructive" });
      return;
    }
    try {
      await upload.mutateAsync({ patientId, file, documentType: docType, notes: notes || undefined });
      toast({ title: "Document uploaded", description: "The clinic team can now see it." });
      setFile(null);
      setNotes("");
      setDocType("referral");
      const input = document.getElementById("doctor-doc-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const url = await getUrl.mutateAsync(filePath);
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = fileName;
      a.click();
    } catch (e: any) {
      toast({ title: "Could not open document", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload a document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="doctor-doc-file">File</Label>
              <Input
                id="doctor-doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-1">
              <Label>Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Updated prescription, additional pathology results…"
              rows={2}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={upload.isPending || !file} className="gap-2">
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Documents on file
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-4">Loading…</p>
          ) : documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-6 text-sm">
              No documents uploaded yet.
            </p>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between py-3 gap-3">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOC_TYPES.find((t) => t.value === doc.document_type)?.label || doc.document_type}
                      {" · "}
                      {format(new Date(doc.uploaded_at), "dd MMM yyyy HH:mm")}
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{doc.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                    className="gap-1 shrink-0"
                  >
                    <Download className="h-4 w-4" /> Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
