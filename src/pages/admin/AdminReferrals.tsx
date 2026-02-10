import { useReferrals, useUpdateReferralStatus } from "@/hooks/useReferrals";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useState } from "react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function AdminReferrals() {
  const { data: referrals, isLoading } = useReferrals();
  const updateStatus = useUpdateReferralStatus();
  const { user } = useAuth();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const filtered = referrals?.filter((r: any) =>
    statusFilter === "all" ? true : r.status === statusFilter
  );

  const openReview = (referral: any) => {
    setSelectedReferral(referral);
    setNewStatus(referral.status);
    setReviewNotes(referral.notes || "");
    setReviewOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedReferral) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedReferral.id,
        status: newStatus,
        reviewed_by: user?.id,
        notes: reviewNotes,
      });
      toast({ title: "Referral updated" });
      setReviewOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Referrals</h1>
        <p className="text-muted-foreground">{referrals?.length || 0} referrals</p>
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
                  <TableHead>Referring Doctor</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
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
                    <TableCell className="text-sm">
                      {(ref.doctors as any)?.practice_name || "—"}
                      {(ref.doctors as any)?.specialisation && (
                        <span className="block text-xs text-muted-foreground">
                          {(ref.doctors as any).specialisation}
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
                      <Badge className={statusColors[ref.status] || ""}>{ref.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ref.created_at), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => openReview(ref)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Referral</DialogTitle>
          </DialogHeader>
          {selectedReferral && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>Patient:</strong> {selectedReferral.patient_first_name} {selectedReferral.patient_last_name}</p>
                {selectedReferral.patient_email && <p><strong>Email:</strong> {selectedReferral.patient_email}</p>}
                {selectedReferral.patient_phone && <p><strong>Phone:</strong> {selectedReferral.patient_phone}</p>}
                {selectedReferral.diagnosis && <p><strong>Diagnosis:</strong> {selectedReferral.diagnosis}</p>}
                {selectedReferral.treatment_requested && <p><strong>Treatment:</strong> {selectedReferral.treatment_requested}</p>}
                {selectedReferral.prescription_notes && <p><strong>Prescription:</strong> {selectedReferral.prescription_notes}</p>}
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatus.isPending}>
              {updateStatus.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
