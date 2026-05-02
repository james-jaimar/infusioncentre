import { Fragment, useMemo, useState } from "react";
import { format, parseISO, differenceInMinutes, isToday, isSameDay } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ArrowUpDown, ArrowUp, ArrowDown, Printer, Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  AppointmentWithRelations,
  AppointmentStatus,
} from "@/types/appointment";
import type { NurseStaffMember } from "@/hooks/useNurseStaff";

type SortKey = "time" | "patient" | "treatment" | "chair" | "status";
type SortDir = "asc" | "desc";

const STATUS_PILL: Record<AppointmentStatus, { label: string; cls: string }> = {
  scheduled: { label: "Scheduled", cls: "bg-muted text-muted-foreground" },
  confirmed: { label: "Confirmed", cls: "bg-clinical-info-soft text-clinical-info" },
  checked_in: { label: "Checked in", cls: "bg-clinical-warning-soft text-clinical-warning" },
  in_progress: { label: "In progress", cls: "bg-clinical-success-soft text-clinical-success" },
  completed: { label: "Completed", cls: "bg-primary/10 text-primary" },
  cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive" },
  no_show: { label: "No-show", cls: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300" },
  rescheduled: { label: "Rescheduled", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
};

function isClosedOut(status: AppointmentStatus) {
  return status === "cancelled" || status === "no_show" || status === "rescheduled";
}

interface Props {
  appointments: AppointmentWithRelations[];
  nurses: NurseStaffMember[];
  onEdit: (apt: AppointmentWithRelations) => void;
}

export function AppointmentsListView({ appointments, nurses, onEdit }: Props) {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<SortKey>("time");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);

  const nurseById = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of nurses) {
      const name = [n.first_name, n.last_name].filter(Boolean).join(" ").trim();
      if (name) m.set(n.user_id, name);
    }
    return m;
  }, [nurses]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((a) => {
      if (!showClosed && isClosedOut(a.status)) return false;
      if (!q) return true;
      const name = `${a.patient.first_name} ${a.patient.last_name}`.toLowerCase();
      return name.includes(q);
    });
  }, [appointments, search, showClosed]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case "time":
          return (
            (parseISO(a.scheduled_start).getTime() -
              parseISO(b.scheduled_start).getTime()) * dir
          );
        case "patient":
          return (
            `${a.patient.last_name} ${a.patient.first_name}`.localeCompare(
              `${b.patient.last_name} ${b.patient.first_name}`
            ) * dir
          );
        case "treatment":
          return a.appointment_type.name.localeCompare(b.appointment_type.name) * dir;
        case "chair":
          return (a.chair?.name ?? "").localeCompare(b.chair?.name ?? "") * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  // Group by day if range spans multiple
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const a of sorted) {
      const key = format(parseISO(a.scheduled_start), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) =>
      sortKey === "time" && sortDir === "desc" ? b.localeCompare(a) : a.localeCompare(b)
    );
  }, [sorted, sortKey, sortDir]);

  const showDayHeaders = grouped.length > 1;

  const SortHeader = ({ k, children, className }: { k: SortKey; children: React.ReactNode; className?: string }) => {
    const Icon = sortKey !== k ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <TableHead className={className}>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          onClick={() => toggleSort(k)}
        >
          {children}
          <Icon className="h-3 w-3 opacity-60" />
        </button>
      </TableHead>
    );
  };

  return (
    <div className="appointments-list-view">
      {/* Toolbar — hidden on print */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b print:hidden">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <Label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
          <Checkbox checked={showClosed} onCheckedChange={(v) => setShowClosed(!!v)} />
          Show cancelled / no-show
        </Label>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {sorted.length} {sorted.length === 1 ? "appointment" : "appointments"}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <p className="text-sm text-muted-foreground">No appointments for this range.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/patients")}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule from patient
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortHeader k="time" className="w-[140px]">Time</SortHeader>
              <SortHeader k="patient">Patient</SortHeader>
              <SortHeader k="treatment">Treatment</SortHeader>
              <SortHeader k="chair" className="w-[110px]">Chair</SortHeader>
              <TableHead className="w-[140px]">Nurse</TableHead>
              <TableHead className="w-[80px] text-right">Duration</TableHead>
              <SortHeader k="status" className="w-[130px]">Status</SortHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grouped.map(([dayKey, items]) => (
              <Fragment key={dayKey}>
                {showDayHeaders && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className={cn(
                        "bg-muted/40 font-semibold text-xs uppercase tracking-wide text-muted-foreground py-2",
                        isToday(parseISO(dayKey + "T00:00:00")) && "bg-primary/10 text-primary"
                      )}
                    >
                      {format(parseISO(dayKey + "T00:00:00"), "EEEE, d MMM yyyy")}
                      {isToday(parseISO(dayKey + "T00:00:00")) && " · Today"}
                      <span className="ml-2 font-normal opacity-70">({items.length})</span>
                    </TableCell>
                  </TableRow>
                )}
                {items.map((a) => {
                  const start = parseISO(a.scheduled_start);
                  const end = parseISO(a.scheduled_end);
                  const duration = differenceInMinutes(end, start);
                  const sessionNo = (a as any).session_number as number | null;
                  const nurseName = a.assigned_nurse_id
                    ? nurseById.get(a.assigned_nurse_id) ?? "Assigned"
                    : null;
                  const meta = STATUS_PILL[a.status];
                  const isInProgress = a.status === "in_progress";
                  const isClosed = isClosedOut(a.status);

                  return (
                    <TableRow
                      key={a.id}
                      onClick={() => onEdit(a)}
                      className={cn(
                        "cursor-pointer",
                        isInProgress && "bg-clinical-success-soft/30",
                        isClosed && "opacity-60"
                      )}
                    >
                      <TableCell className="font-mono text-xs tabular-nums py-2.5">
                        <div className="font-semibold text-foreground">
                          {format(start, "HH:mm")}
                        </div>
                        <div className="text-muted-foreground">
                          – {format(end, "HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="font-medium text-foreground">
                          {a.patient.first_name} {a.patient.last_name}
                        </div>
                        {a.patient.phone && (
                          <div className="text-xs text-muted-foreground">
                            {a.patient.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-sm shrink-0"
                            style={{ backgroundColor: a.appointment_type.color }}
                          />
                          <span className="text-sm">{a.appointment_type.name}</span>
                          {sessionNo ? (
                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                              #{sessionNo}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="py-2.5 text-sm">
                        {a.chair?.name ?? <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="py-2.5 text-sm">
                        {nurseName ?? <span className="text-muted-foreground italic">—</span>}
                      </TableCell>
                      <TableCell className="py-2.5 text-right text-sm tabular-nums text-muted-foreground">
                        {duration}m
                      </TableCell>
                      <TableCell className="py-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            meta.cls
                          )}
                        >
                          {meta.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}