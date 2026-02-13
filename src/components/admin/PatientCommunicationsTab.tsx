import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, MessageSquare, RefreshCw, Loader2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { useResendEmail, type CommunicationLogEntry } from "@/hooks/useCommunicationLog";
import { useState } from "react";

interface PatientCommunicationsTabProps {
  patientEmail: string | null;
  patientName: string;
}

function usePatientCommunications(email: string | null) {
  return useQuery({
    queryKey: ["patient_communications", email],
    queryFn: async () => {
      if (!email) return [];
      const { data, error } = await supabase
        .from("communication_log")
        .select("*")
        .eq("recipient", email)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as CommunicationLogEntry[];
    },
    enabled: !!email,
  });
}

const statusVariant = (status: string) => {
  switch (status) {
    case "sent": return "default";
    case "failed": return "destructive";
    default: return "secondary";
  }
};

const typeIcon = (type: string) => {
  switch (type) {
    case "email": return <Mail className="h-4 w-4" />;
    case "whatsapp": return <MessageSquare className="h-4 w-4" />;
    default: return <Mail className="h-4 w-4" />;
  }
};

export default function PatientCommunicationsTab({ patientEmail, patientName }: PatientCommunicationsTabProps) {
  const { data: logs, isLoading, refetch } = usePatientCommunications(patientEmail);
  const resend = useResendEmail();
  const [resendingId, setResendingId] = useState<string | null>(null);

  async function handleResend(entry: CommunicationLogEntry) {
    setResendingId(entry.id);
    try {
      await resend.mutateAsync(entry);
      toast.success("Email resent successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    } finally {
      setResendingId(null);
    }
  }

  if (!patientEmail) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No email address on file — communications can't be tracked.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="h-5 w-5" />
                Communications
              </CardTitle>
              <CardDescription>
                All emails and messages sent to {patientName} ({patientEmail})
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="py-8 text-center">
              <Inbox className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No communications sent yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcon(entry.type)}
                        <span className="capitalize text-sm">{entry.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <span className="text-sm truncate block">{entry.subject || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {entry.related_entity_type?.replace(/_/g, " ") || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(entry.status)}>
                        {entry.status}
                      </Badge>
                      {entry.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-[200px] truncate">
                          {entry.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.sent_at || entry.created_at).toLocaleDateString("en-ZA", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResend(entry)}
                        disabled={resendingId === entry.id}
                      >
                        {resendingId === entry.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-1">Resend</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
