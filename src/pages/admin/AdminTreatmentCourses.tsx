import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { FileText, ArrowRight, CalendarPlus } from "lucide-react";
import { useTreatmentCourses } from "@/hooks/useTreatmentCourses";
import { TreatmentCourseStatus } from "@/types/treatment";
import { ConvertReferralDialog } from "@/components/admin/ConvertReferralDialog";
import { RecurringSessionDialog } from "@/components/admin/RecurringSessionDialog";

const STATUS_CONFIG: Record<TreatmentCourseStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Draft", variant: "secondary" },
  onboarding: { label: "Onboarding", variant: "outline" },
  ready: { label: "Ready", variant: "default" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  completing: { label: "Completing", variant: "outline" },
  completed: { label: "Completed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function AdminTreatmentCourses() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [recurringCourse, setRecurringCourse] = useState<any>(null);
  const { data: courses = [], isLoading } = useTreatmentCourses(
    statusFilter === "all" ? undefined : [statusFilter as TreatmentCourseStatus]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Treatment Courses</h1>
          <p className="text-muted-foreground">Manage episodes of care</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConvertDialogOpen(true)}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Convert Referral
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No treatment courses found</p>
              <p className="text-sm text-muted-foreground">Convert a referral to create a treatment course</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course: any) => {
                  const cfg = STATUS_CONFIG[course.status as TreatmentCourseStatus] || STATUS_CONFIG.draft;
                  const canSchedule = ["onboarding", "ready", "active"].includes(course.status);
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        {course.patient?.first_name} {course.patient?.last_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: course.appointment_type?.color }}
                          />
                          {course.appointment_type?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={cfg.variant}>{cfg.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {course.sessions_completed} / {course.total_sessions_planned}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {course.doctor?.practice_name || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(course.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {canSchedule && course.sessions_completed < course.total_sessions_planned && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRecurringCourse(course)}
                            className="gap-1"
                          >
                            <CalendarPlus className="h-4 w-4" />
                            Schedule
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConvertReferralDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
      />

      {recurringCourse && (
        <RecurringSessionDialog
          open={!!recurringCourse}
          onOpenChange={(open) => !open && setRecurringCourse(null)}
          treatmentCourse={{
            id: recurringCourse.id,
            patient_id: recurringCourse.patient_id,
            treatment_type_id: recurringCourse.treatment_type_id,
            total_sessions_planned: recurringCourse.total_sessions_planned,
            sessions_completed: recurringCourse.sessions_completed,
            appointment_type: recurringCourse.appointment_type,
            patient: recurringCourse.patient,
          }}
        />
      )}
    </div>
  );
}
