import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useStatusDisplay } from "@/hooks/useStatusDictionaries";
import { isCustomRequest } from "@/lib/customReferral";
import { format } from "date-fns";
import { Sparkles, AlertCircle } from "lucide-react";
import { getReferralAttention, ATTENTION_LABEL } from "@/lib/referralProgress";

interface Props {
  referrals: any[];
  isLoading: boolean;
  onReview: (referral: any) => void;
  onSetupCourse?: (referral: any) => void;
  onScheduleSessions?: (referral: any) => void;
}

export function ReferralTable({ referrals, isLoading, onReview, onSetupCourse, onScheduleSessions }: Props) {
  const getStatus = useStatusDisplay("referral");

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent>
      </Card>
    );
  }

  if (!referrals.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">No referrals found.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Referring Doctor</TableHead>
              <TableHead>Treatment</TableHead>
              <TableHead>Urgency</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {referrals.map((ref: any) => {
              const status = getStatus(ref.status);
              const attention = getReferralAttention(ref, ref.course_count || 0, {
                appointmentCount: ref.appointment_count || 0,
                totalSessionsPlanned: ref.total_sessions_planned || 0,
              });
              const needsAttention = attention !== "complete";
              const rowTint =
                ref.urgency === "urgent" && ref.status === "pending"
                  ? "bg-clinical-danger-soft/30"
                  : needsAttention && attention !== "awaiting_triage"
                    ? "bg-clinical-warning-soft/30"
                    : "";
              return (
                <TableRow key={ref.id} className={rowTint}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span>{ref.patient_first_name} {ref.patient_last_name}</span>
                      {isCustomRequest(ref.treatment_requested) && (
                        <Badge variant="outline" className="gap-1 border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-700 text-[10px] px-1.5 py-0">
                          <Sparkles className="h-2.5 w-2.5" /> Custom request
                        </Badge>
                      )}
                      {needsAttention && attention !== "awaiting_triage" && (
                        <Badge
                          variant="outline"
                          className="gap-1 border-clinical-warning/60 bg-clinical-warning-soft text-clinical-warning text-[10px] px-1.5 py-0"
                        >
                          <AlertCircle className="h-2.5 w-2.5" /> {ATTENTION_LABEL[attention]}
                        </Badge>
                      )}
                    </div>
                    {ref.patient_email && (
                      <span className="block text-xs text-muted-foreground">{ref.patient_email}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {ref.doctor_display_name || "—"}
                    {(ref.doctors as any)?.specialisation && (
                      <span className="block text-xs text-muted-foreground">
                        {(ref.doctors as any).specialisation}
                      </span>
                    )}
                    {(ref.doctors as any)?.email && (
                      <span className="block text-xs text-muted-foreground">
                        {(ref.doctors as any).email}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{ref.treatment_requested || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ref.urgency === "urgent" ? "destructive" : "secondary"}>
                      {ref.urgency}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      style={{ backgroundColor: status.color + "20", color: status.color, borderColor: status.color }}
                      className="border"
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(ref.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell>
                    {attention === "needs_scheduling" && onScheduleSessions ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onScheduleSessions(ref)}
                      >
                        Schedule sessions
                      </Button>
                    ) : attention === "needs_course" && onSetupCourse ? (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onSetupCourse(ref)}
                      >
                        Set up course
                      </Button>
                    ) : attention === "needs_patient" ? (
                      <Button variant="default" size="sm" onClick={() => onReview(ref)}>
                        Link patient
                      </Button>
                    ) : attention === "awaiting_triage" ? (
                      <Button variant="default" size="sm" onClick={() => onReview(ref)}>
                        Review
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onReview(ref)}>
                        View
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
