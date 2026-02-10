import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppointment, useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import { AppointmentStatus } from "@/types/appointment";

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
};

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  checked_in: "Checked In",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export default function AppointmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cancellationReason, setCancellationReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: appointment, isLoading } = useAppointment(id);
  const { data: appointmentTypes } = useAppointmentTypes(true);
  const { data: chairs } = useTreatmentChairs();
  const { data: nurses = [] } = useNurseStaff();
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const startEditing = () => {
    if (!appointment) return;
    setEditForm({
      appointment_type_id: appointment.appointment_type_id,
      chair_id: appointment.chair_id || "",
      assigned_nurse_id: appointment.assigned_nurse_id || "",
      notes: appointment.notes || "",
      scheduled_date: format(parseISO(appointment.scheduled_start), "yyyy-MM-dd"),
      scheduled_time: format(parseISO(appointment.scheduled_start), "HH:mm"),
      end_time: format(parseISO(appointment.scheduled_end), "HH:mm"),
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      const scheduled_start = new Date(`${editForm.scheduled_date}T${editForm.scheduled_time}`).toISOString();
      const scheduled_end = new Date(`${editForm.scheduled_date}T${editForm.end_time}`).toISOString();
      await updateAppointment.mutateAsync({
        id,
        data: {
          appointment_type_id: editForm.appointment_type_id,
          chair_id: editForm.chair_id || null,
          assigned_nurse_id: editForm.assigned_nurse_id || null,
          notes: editForm.notes || null,
          scheduled_start,
          scheduled_end,
        },
      });
      toast.success("Appointment updated");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update appointment");
    }
  };

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    if (!id) return;
    try {
      await updateAppointment.mutateAsync({ id, data: { status: newStatus } });
      toast.success(`Status updated to ${statusLabels[newStatus]}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    try {
      await updateAppointment.mutateAsync({
        id,
        data: { status: "cancelled", cancellation_reason: cancellationReason || "Cancelled by admin" },
      });
      toast.success("Appointment cancelled");
    } catch (error) {
      toast.error("Failed to cancel appointment");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success("Appointment deleted");
      navigate("/admin/appointments");
    } catch (error) {
      toast.error("Failed to delete appointment");
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-muted-foreground">Loading appointment...</p></div>;
  }

  if (!appointment) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button variant="outline" onClick={() => navigate("/admin/appointments")}>Back to Appointments</Button>
      </div>
    );
  }

  const scheduledStart = parseISO(appointment.scheduled_start);
  const scheduledEnd = parseISO(appointment.scheduled_end);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              {appointment.patient.first_name} {appointment.patient.last_name}
            </h1>
            <p className="text-muted-foreground">{appointment.appointment_type.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={startEditing} className="gap-2">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          )}
          <Badge className={cn("text-sm py-1 px-3", statusColors[appointment.status])}>
            {statusLabels[appointment.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Date</Label>
                    <Input type="date" value={editForm.scheduled_date} onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Start Time</Label>
                      <Input type="time" value={editForm.scheduled_time} onChange={(e) => setEditForm({ ...editForm, scheduled_time: e.target.value })} />
                    </div>
                    <div>
                      <Label>End Time</Label>
                      <Input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Appointment Type</Label>
                  <Select value={editForm.appointment_type_id} onValueChange={(v) => setEditForm({ ...editForm, appointment_type_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {appointmentTypes?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Treatment Chair</Label>
                  <Select value={editForm.chair_id || "none"} onValueChange={(v) => setEditForm({ ...editForm, chair_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
                      {chairs?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Assigned Nurse</Label>
                  <Select value={editForm.assigned_nurse_id || "none"} onValueChange={(v) => setEditForm({ ...editForm, assigned_nurse_id: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not assigned</SelectItem>
                      {nurses.map((n) => (
                        <SelectItem key={n.user_id} value={n.user_id}>{n.first_name || ""} {n.last_name || ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={3} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} className="gap-2"><Save className="h-4 w-4" /> Save</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(scheduledStart, "EEEE, MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Time</p>
                      <p className="font-medium">{format(scheduledStart, "h:mm a")} - {format(scheduledEnd, "h:mm a")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Treatment Chair</p>
                      <p className="font-medium">{appointment.chair?.name || "Not assigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full mt-0.5" style={{ backgroundColor: appointment.appointment_type.color }} />
                    <div>
                      <p className="text-sm text-muted-foreground">Treatment Type</p>
                      <p className="font-medium">{appointment.appointment_type.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned Nurse</p>
                      <p className="font-medium">
                        {appointment.assigned_nurse_id
                          ? nurses.find((n) => n.user_id === appointment.assigned_nurse_id)
                            ? `${nurses.find((n) => n.user_id === appointment.assigned_nurse_id)!.first_name || ""} ${nurses.find((n) => n.user_id === appointment.assigned_nurse_id)!.last_name || ""}`
                            : "Assigned"
                          : "Not assigned"}
                      </p>
                    </div>
                  </div>
                </div>

                {appointment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded-md">{appointment.notes}</p>
                  </div>
                )}

                {appointment.cancellation_reason && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Cancellation Reason</p>
                    <p className="text-sm bg-destructive/10 text-destructive p-3 rounded-md">{appointment.cancellation_reason}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Patient Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Patient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium text-lg">{appointment.patient.first_name} {appointment.patient.last_name}</p>
            </div>
            {appointment.patient.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${appointment.patient.phone}`} className="hover:underline">{appointment.patient.phone}</a>
              </div>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to={`/admin/patients/${appointment.patient.id}`}>View Patient Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage this appointment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {appointment.status !== "cancelled" && appointment.status !== "completed" && (
            <div className="flex flex-wrap gap-2">
              {appointment.status === "scheduled" && (
                <Button variant="outline" onClick={() => handleStatusChange("confirmed")} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" /> Confirm
                </Button>
              )}
              {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
                <Button variant="outline" onClick={() => handleStatusChange("checked_in")} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-yellow-600" /> Check In
                </Button>
              )}
              {appointment.status === "checked_in" && (
                <Button variant="outline" onClick={() => handleStatusChange("in_progress")} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-600" /> Start Treatment
                </Button>
              )}
              {appointment.status === "in_progress" && (
                <Button variant="outline" onClick={() => handleStatusChange("completed")} className="gap-2">
                  <CheckCircle className="h-4 w-4 text-gray-600" /> Complete
                </Button>
              )}
              {(appointment.status === "checked_in" || appointment.status === "in_progress") && (
                <Button variant="outline" onClick={() => navigate(`/nurse/job-card/${appointment.id}`)} className="gap-2">
                  Open Job Card
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {appointment.status !== "cancelled" && appointment.status !== "completed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                    <XCircle className="h-4 w-4" /> Cancel Appointment
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to cancel this appointment? Please provide a reason.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea placeholder="Reason for cancellation..." value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} className="min-h-24" />
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-destructive hover:bg-destructive/90">Cancel Appointment</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete this appointment. This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
