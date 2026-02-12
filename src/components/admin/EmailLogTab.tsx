import { useState } from "react";
import { useCommunicationLog, useResendEmail, useSendAdHocEmail } from "@/hooks/useCommunicationLog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  Search,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
  sent: { icon: CheckCircle2, className: "bg-green-100 text-green-800 border-green-200", label: "Sent" },
  failed: { icon: XCircle, className: "bg-destructive/10 text-destructive border-destructive/20", label: "Failed" },
  pending: { icon: Clock, className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending" },
};

export default function EmailLogTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const { data: logs, isLoading, refetch } = useCommunicationLog({
    status: statusFilter,
    search: search || undefined,
  });

  const resend = useResendEmail();
  const sendAdHoc = useSendAdHocEmail();

  const handleResend = async (entry: any) => {
    try {
      await resend.mutateAsync(entry);
      toast.success("Email resent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    }
  };

  const handleCompose = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("All fields are required");
      return;
    }
    try {
      await sendAdHoc.mutateAsync({
        to: composeTo,
        subject: composeSubject,
        html: composeBody.replace(/\n/g, "<br/>"),
        text: composeBody,
      });
      toast.success("Email sent successfully");
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    }
  };

  const counts = {
    total: logs?.length || 0,
    sent: logs?.filter((l) => l.status === "sent").length || 0,
    failed: logs?.filter((l) => l.status === "failed").length || 0,
    pending: logs?.filter((l) => l.status === "pending").length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, icon: Send, color: "text-foreground" },
          { label: "Sent", value: counts.sent, icon: CheckCircle2, color: "text-green-600" },
          { label: "Failed", value: counts.failed, icon: XCircle, color: "text-destructive" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "text-yellow-600" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by recipient or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input
                  placeholder="recipient@example.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                />
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  placeholder="Email body (plain text, line breaks will be converted to HTML)"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  rows={8}
                />
              </div>
              <Button
                onClick={handleCompose}
                disabled={sendAdHoc.isPending}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                {sendAdHoc.isPending ? "Sending…" : "Send Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Log table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading…</div>
          ) : !logs?.length ? (
            <div className="p-8 text-center text-muted-foreground">No emails found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((entry) => {
                    const sc = statusConfig[entry.status] || statusConfig.pending;
                    const Icon = sc.icon;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <Badge variant="outline" className={`gap-1 ${sc.className}`}>
                            <Icon className="h-3 w-3" />
                            {sc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {entry.recipient}
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {entry.subject || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{entry.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(entry.created_at), "yyyy/MM/dd HH:mm")}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {entry.error_message ? (
                            <span className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span className="truncate">{entry.error_message}</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleResend(entry)}
                              disabled={resend.isPending}
                              title="Resend"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
