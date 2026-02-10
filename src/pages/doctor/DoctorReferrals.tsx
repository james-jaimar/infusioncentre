import { useDoctorProfile } from "@/hooks/useDoctors";
import { useReferrals } from "@/hooks/useReferrals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function DoctorReferrals() {
  const { data: doctor } = useDoctorProfile();
  const { data: referrals, isLoading } = useReferrals(doctor?.id);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = referrals?.filter((r: any) =>
    statusFilter === "all" ? true : r.status === statusFilter
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">My Referrals</h1>
        <Button onClick={() => navigate("/doctor/referrals/new")} className="gap-2">
          <PlusCircle className="h-4 w-4" /> New Referral
        </Button>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !filtered?.length ? (
            <div className="p-8 text-center text-muted-foreground">No referrals found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ref: any) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">
                      {ref.patient_first_name} {ref.patient_last_name}
                      {ref.patient_email && (
                        <span className="block text-xs text-muted-foreground">{ref.patient_email}</span>
                      )}
                    </TableCell>
                    <TableCell>{ref.treatment_requested || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={ref.urgency === "urgent" ? "destructive" : "secondary"}>
                        {ref.urgency}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ref.status] || ""}>{ref.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ref.created_at), "dd MMM yyyy")}
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
