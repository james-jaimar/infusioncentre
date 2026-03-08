import { useDoctorProfile } from "@/hooks/useDoctors";
import { useDoctorReports, useAcknowledgeReport, type DoctorReport } from "@/hooks/useDoctorReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Eye, CheckCircle, FileText } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  sent: "bg-primary/10 text-primary",
  acknowledged: "bg-green-100 text-green-800",
  review: "bg-orange-100 text-orange-800",
};

export default function DoctorReports() {
  const { data: doctor } = useDoctorProfile();
  const { data: reports, isLoading } = useDoctorReports({ doctorId: doctor?.id });
  const acknowledge = useAcknowledgeReport();
  const [previewReport, setPreviewReport] = useState<DoctorReport | null>(null);

  const handleAcknowledge = async (reportId: string) => {
    await acknowledge.mutateAsync(reportId);
    setPreviewReport(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My Reports</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Treatment Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !reports?.length ? (
            <div className="p-8 text-center text-muted-foreground">
              No reports yet. Reports will appear here as your patients progress through treatment.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Subject</TableHead>
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
                    <TableCell>{r.subject}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[r.status] || ""}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.sent_at
                        ? format(new Date(r.sent_at), "dd MMM yyyy")
                        : format(new Date(r.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => setPreviewReport(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {r.status === "sent" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(r.id)}
                          disabled={acknowledge.isPending}
                          className="gap-1"
                        >
                          <CheckCircle className="h-4 w-4" /> Acknowledge
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

      {/* Report Preview Dialog */}
      <Dialog open={!!previewReport} onOpenChange={() => setPreviewReport(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewReport?.subject}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Patient: {(previewReport?.patients as any)?.first_name} {(previewReport?.patients as any)?.last_name}</span>
              <Badge className={statusColors[previewReport?.status || ""] || ""}>{previewReport?.status}</Badge>
            </div>
            <div
              className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/30"
              dangerouslySetInnerHTML={{ __html: previewReport?.body_html || "" }}
            />
          </div>
          <DialogFooter>
            {previewReport?.status === "sent" && (
              <Button onClick={() => handleAcknowledge(previewReport.id)}>
                <CheckCircle className="h-4 w-4 mr-1" /> Acknowledge
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
