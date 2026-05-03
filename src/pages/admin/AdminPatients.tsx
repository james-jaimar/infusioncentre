import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePatientList, type CourseStateFilter, type PatientWithCourses } from "@/hooks/usePatients";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TreatmentCourseChip } from "@/components/shared/TreatmentCourseChip";
import { cn } from "@/lib/utils";
import {
  STAGE_LABEL,
  STAGE_CLASS,
  type PatientStage,
} from "@/lib/patientPipeline";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import type { PatientStatus } from "@/types/patient";

const ACTIVE_SET = new Set(["draft", "onboarding", "ready", "active", "completing"]);

const COURSE_STATE_TABS: { value: CourseStateFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "has_active", label: "Active courses" },
  { value: "awaiting_scheduling", label: "Awaiting scheduling" },
  { value: "completed", label: "Completed" },
  { value: "no_course", label: "No course yet" },
];

const STAGE_TABS: { value: PatientStage | "all"; label: string; hint: string }[] = [
  { value: "all", label: "Everyone", hint: "All non-archived patients regardless of stage" },
  { value: "needs_invite", label: "Needs invite", hint: "Has an active course but no portal account and no live invite" },
  { value: "invite_sent", label: "Invite sent", hint: "Portal invite issued and still valid — patient hasn't logged in yet" },
  { value: "onboarding", label: "Onboarding", hint: "Account active, but onboarding forms are still outstanding (or checklist not yet generated)" },
  { value: "ready_to_schedule", label: "Ready to schedule", hint: "Onboarding complete, no appointments booked yet — needs first session scheduled" },
  { value: "scheduled", label: "Scheduled", hint: "Has upcoming appointments but no completed sessions yet" },
  { value: "in_treatment", label: "In treatment", hint: "At least one session has been completed on the active course" },
];

export default function AdminPatients() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-driven state
  const courseState = (searchParams.get("state") as CourseStateFilter) || "all";
  const treatmentTypeId = searchParams.get("type") || "all";
  const status = (searchParams.get("status") as PatientStatus | "all") || "all";
  const stage = (searchParams.get("stage") as PatientStage | "all") || "all";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: appointmentTypes } = useAppointmentTypes();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).searchTimeout);
    (window as any).searchTimeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all" || !value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
    setPage(1);
  };

  const { data, isLoading, error } = usePatientList({
    search: debouncedSearch,
    status,
    treatment_type_id: treatmentTypeId,
    course_state: courseState,
    stage,
    page,
    pageSize: 10,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [courseState, treatmentTypeId, status, stage]);

  const getStatusBadgeVariant = (s: PatientStatus) => {
    switch (s) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-ZA");
  };

  const renderCourseChips = (patient: PatientWithCourses) => {
    const courses = patient.treatment_courses ?? [];
    if (courses.length === 0) {
      return <span className="text-xs text-muted-foreground">—</span>;
    }
    // Prioritise active/scheduled/draft, then others
    const sorted = [...courses].sort((a, b) => {
      const aActive = ACTIVE_SET.has(a.status) ? 0 : 1;
      const bActive = ACTIVE_SET.has(b.status) ? 0 : 1;
      return aActive - bActive;
    });
    return (
      <div className="flex flex-wrap gap-1">
        {sorted.slice(0, 3).map((c) => (
          <TreatmentCourseChip
            key={c.id}
            typeName={c.appointment_type?.name ?? "Course"}
            color={c.appointment_type?.color}
            sessionsCompleted={c.sessions_completed}
            totalSessions={c.total_sessions_planned}
            status={c.status}
          />
        ))}
        {sorted.length > 3 && (
          <span className="text-xs text-muted-foreground self-center">
            +{sorted.length - 3}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <p className="text-muted-foreground">
            Manage patient records and medical information
          </p>
        </div>
        <Button onClick={() => navigate("/admin/patients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {/* Course state quick filter chips */}
      <div className="flex flex-wrap gap-2">
        {COURSE_STATE_TABS.map((tab) => {
          const active = courseState === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => updateParam("state", tab.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pipeline stage filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">
          Pipeline
        </span>
        {STAGE_TABS.map((tab) => {
          const active = stage === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => updateParam("stage", tab.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID number, phone, or email..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={treatmentTypeId} onValueChange={(v) => updateParam("type", v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Treatment Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Treatment Types</SelectItem>
            {appointmentTypes?.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => updateParam("status", v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead className="hidden sm:table-cell">ID Number</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Treatment Course</TableHead>
              <TableHead className="hidden lg:table-cell">Medical Aid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-destructive">
                  Error loading patients. Please try again.
                </TableCell>
              </TableRow>
            ) : data?.patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {debouncedSearch
                        ? "No patients found matching your search"
                        : "No patients match the current filters"}
                    </p>
                    {!debouncedSearch && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/admin/patients/new")}
                      >
                        Add a patient
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data?.patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/patients/${patient.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {patient.first_name[0]}
                        {patient.last_name[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {patient.first_name} {patient.last_name}
                        </div>
                        {patient.email && (
                          <div className="text-sm text-muted-foreground">
                            {patient.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {patient.id_number || "—"}
                  </TableCell>
                  <TableCell>
                    {patient.pipeline_stage ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                          STAGE_CLASS[patient.pipeline_stage]
                        )}
                      >
                        {STAGE_LABEL[patient.pipeline_stage]}
                        {patient.pipeline_stage === "onboarding" &&
                          (patient.checklist_total ?? 0) > 0 && (
                            <span className="tabular-nums opacity-80">
                              {patient.checklist_completed}/{patient.checklist_total}
                            </span>
                          )}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{renderCourseChips(patient)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {patient.medical_aid_name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(patient.status)}>
                      {patient.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(patient.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, data.totalCount)} of{" "}
            {data.totalCount} patients
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
