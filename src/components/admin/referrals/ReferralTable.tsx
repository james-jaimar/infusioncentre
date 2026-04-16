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
import { format } from "date-fns";

interface Props {
  referrals: any[];
  isLoading: boolean;
  onReview: (referral: any) => void;
}

export function ReferralTable({ referrals, isLoading, onReview }: Props) {
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
              return (
                <TableRow key={ref.id} className={ref.urgency === "urgent" && ref.status === "pending" ? "bg-clinical-danger-soft/30" : ""}>
                  <TableCell className="font-medium">
                    {ref.patient_first_name} {ref.patient_last_name}
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
                    <Button variant="outline" size="sm" onClick={() => onReview(ref)}>
                      Review
                    </Button>
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
