import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ClipboardList, Download } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function PatientRecords() {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState<string>();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (!patient) { setLoading(false); return; }
      setPatientId(patient.id);

      const [subsRes, docsRes] = await Promise.all([
        supabase
          .from("form_submissions")
          .select("*, form_templates(name, category)")
          .eq("patient_id", patient.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("patient_documents")
          .select("*")
          .eq("patient_id", patient.id)
          .order("uploaded_at", { ascending: false }),
      ]);

      setSubmissions(subsRes.data || []);
      setDocuments(docsRes.data || []);
      setLoading(false);
    })();
  }, [user]);

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from("patient-documents").createSignedUrl(filePath, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (loading) return <div className="p-4 text-muted-foreground">Loading records...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">My Records</h1>
        <p className="text-muted-foreground">View your completed forms and documents</p>
      </div>

      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms">Completed Forms</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="forms" className="space-y-3 mt-4">
          {submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed forms yet.</p>
          ) : (
            submissions.map((s) => (
              <Card key={s.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{(s.form_templates as any)?.name || "Form"}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(s.created_at), "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                  <Badge variant={s.status === "submitted" ? "default" : "secondary"}>
                    {s.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-3 mt-4">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            documents.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{d.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.document_type?.replace(/_/g, " ")} · {format(new Date(d.uploaded_at), "dd MMM yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownload(d.file_path, d.file_name)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
