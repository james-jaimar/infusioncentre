import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  useDoctorReports,
  useDoctorReportTemplates,
  useSendReport,
  useUpdateReport,
  useCreateReportTemplate,
  useUpdateReportTemplate,
  useDeleteReportTemplate,
  type DoctorReport,
  type DoctorReportTemplate,
} from "@/hooks/useDoctorReports";
import { format } from "date-fns";
import {
  Send, Eye, FileText, Edit, Trash2, Plus, CheckCircle, Clock, AlertCircle, Mail,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  generating: "bg-blue-100 text-blue-800",
  review: "bg-orange-100 text-orange-800",
  sent: "bg-primary/10 text-primary",
  acknowledged: "bg-green-100 text-green-800",
};

const milestoneLabels: Record<string, string> = {
  course_started: "Course Started",
  session_completed: "Session Completed",
  course_completed: "Course Completed",
  manual: "Manual Report",
};

export default function AdminDoctorReports() {
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: reports, isLoading } = useDoctorReports({ status: statusFilter });
  const { data: templates } = useDoctorReportTemplates();
  const sendReport = useSendReport();
  const updateReport = useUpdateReport();

  const [previewReport, setPreviewReport] = useState<DoctorReport | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<DoctorReportTemplate | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const handleSend = async (report: DoctorReport) => {
    try {
      await sendReport.mutateAsync(report);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const pendingCount = reports?.filter(r => r.status === "review").length || 0;
  const sentCount = reports?.filter(r => r.status === "sent").length || 0;
  const ackedCount = reports?.filter(r => r.status === "acknowledged").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Doctor Reports</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 shrink-0">
              <Edit className="h-6 w-6 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Awaiting Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sentCount}</p>
              <p className="text-sm text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 shrink-0">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{ackedCount}</p>
              <p className="text-sm text-muted-foreground">Acknowledged</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports Queue</TabsTrigger>
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
              ) : !reports?.length ? (
                <div className="p-8 text-center text-muted-foreground">No reports found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Milestone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {(r.patients as any)?.first_name} {(r.patients as any)?.last_name}
                        </TableCell>
                        <TableCell>{(r.doctors as any)?.practice_name || (r.doctors as any)?.email || "—"}</TableCell>
                        <TableCell>{milestoneLabels[r.milestone] || r.milestone}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => setPreviewReport(r)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === "review" && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSend(r)}
                              disabled={sendReport.isPending}
                            >
                              <Send className="h-4 w-4 mr-1" /> Send
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <ReportTemplatesTab
            templates={templates || []}
            editingTemplate={editingTemplate}
            setEditingTemplate={setEditingTemplate}
            showNewTemplate={showNewTemplate}
            setShowNewTemplate={setShowNewTemplate}
          />
        </TabsContent>
      </Tabs>

      {/* Report Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewReport?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>To: {(previewReport?.doctors as any)?.email || "No email"}</span>
              <Badge className={statusColors[previewReport?.status || ""] || ""}>{previewReport?.status}</Badge>
            </div>
            <div
              className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/30"
              dangerouslySetInnerHTML={{ __html: previewReport?.body_html || "" }}
            />
            {previewReport?.sent_at && (
              <p className="text-xs text-muted-foreground">
                Sent: {format(new Date(previewReport.sent_at), "dd MMM yyyy HH:mm")}
              </p>
            )}
            {previewReport?.acknowledged_at && (
              <p className="text-xs text-muted-foreground">
                Acknowledged: {format(new Date(previewReport.acknowledged_at), "dd MMM yyyy HH:mm")}
              </p>
            )}
          </div>
          <DialogFooter>
            {previewReport?.status === "review" && (
              <Button onClick={() => { handleSend(previewReport); setPreviewReport(null); }}>
                <Send className="h-4 w-4 mr-1" /> Send Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Templates Sub-Tab ───

function ReportTemplatesTab({
  templates,
  editingTemplate,
  setEditingTemplate,
  showNewTemplate,
  setShowNewTemplate,
}: {
  templates: DoctorReportTemplate[];
  editingTemplate: DoctorReportTemplate | null;
  setEditingTemplate: (t: DoctorReportTemplate | null) => void;
  showNewTemplate: boolean;
  setShowNewTemplate: (v: boolean) => void;
}) {
  const createTemplate = useCreateReportTemplate();
  const updateTemplate = useUpdateReportTemplate();
  const deleteTemplate = useDeleteReportTemplate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    milestone_trigger: "manual",
    subject_template: "Treatment Update: {{patient_name}}",
    body_template: "",
  });

  const openEdit = (t: DoctorReportTemplate) => {
    setForm({
      name: t.name,
      description: t.description || "",
      milestone_trigger: t.milestone_trigger,
      subject_template: t.subject_template,
      body_template: t.body_template,
    });
    setEditingTemplate(t);
  };

  const openNew = () => {
    setForm({
      name: "",
      description: "",
      milestone_trigger: "manual",
      subject_template: "Treatment Update: {{patient_name}}",
      body_template: "",
    });
    setShowNewTemplate(true);
  };

  const handleSave = async () => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, ...form });
      setEditingTemplate(null);
    } else {
      await createTemplate.mutateAsync(form as any);
      setShowNewTemplate(false);
    }
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {!templates.length ? (
            <div className="p-8 text-center text-muted-foreground">No report templates yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{milestoneLabels[t.milestone_trigger] || t.milestone_trigger}</TableCell>
                    <TableCell>
                      <Badge variant={t.is_active ? "default" : "secondary"}>
                        {t.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteTemplate.mutate(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit / New Template Dialog */}
      <Dialog open={!!editingTemplate || showNewTemplate} onOpenChange={() => { setEditingTemplate(null); setShowNewTemplate(false); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "New Report Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Milestone Trigger</Label>
              <Select value={form.milestone_trigger} onValueChange={(v) => setForm({ ...form, milestone_trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="course_started">Course Started</SelectItem>
                  <SelectItem value="session_completed">Session Completed</SelectItem>
                  <SelectItem value="course_completed">Course Completed</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject Template</Label>
              <Input value={form.subject_template} onChange={(e) => setForm({ ...form, subject_template: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Body Template (HTML)</Label>
              <Textarea
                className="min-h-[200px] font-mono text-xs"
                value={form.body_template}
                onChange={(e) => setForm({ ...form, body_template: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Variables: {"{{patient_name}}, {{doctor_name}}, {{treatment_type}}, {{total_sessions}}, {{sessions_completed}}, {{start_date}}, {{end_date}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingTemplate(null); setShowNewTemplate(false); }}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.name}>
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
