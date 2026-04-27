import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  parseISO,
  setHours,
  setMinutes,
  differenceInMinutes,
  isToday,
} from "date-fns";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Layers,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointments, useMoveAppointment } from "@/hooks/useAppointments";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { useNurseStaff } from "@/hooks/useNurseStaff";
import {
  AppointmentWithRelations,
  AppointmentStatus,
} from "@/types/appointment";
import { cn } from "@/lib/utils";
import { AppointmentQuickEditDialog } from "@/components/admin/AppointmentQuickEditDialog";
import { useNavigate } from "react-router-dom";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm
const SLOT_MINUTES = 30; // drag snap
const DAY_START_MIN = 7 * 60;

type ViewMode = "day" | "week" | "month";
type Density = "compact" | "comfortable";

const DENSITY_PX: Record<Density, number> = {
  compact: 48,
  comfortable: 80,
};

const STATUS_BG: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-50 dark:bg-blue-950/40",
  confirmed: "bg-emerald-50 dark:bg-emerald-950/40",
  checked_in: "bg-amber-50 dark:bg-amber-950/40",
  in_progress: "bg-violet-50 dark:bg-violet-950/40",
  completed: "bg-muted",
  cancelled: "bg-red-50 dark:bg-red-950/40 line-through opacity-60",
  no_show: "bg-orange-50 dark:bg-orange-950/40 opacity-70",
  rescheduled: "bg-indigo-50 dark:bg-indigo-950/40 opacity-60",
};

function CalendarEventCard({
  apt,
  pxPerHour,
  isDragging,
  compact,
  innerRef,
  style: extraStyle,
  listeners,
  attributes,
  onPointerDown,
  onClick,
}: {
  apt: AppointmentWithRelations;
  pxPerHour: number;
  isDragging?: boolean;
  compact?: boolean;
  innerRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  listeners?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  onPointerDown?: (e: React.PointerEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const start = parseISO(apt.scheduled_start);
  const end = parseISO(apt.scheduled_end);
  const startMin = start.getHours() * 60 + start.getMinutes();
  const durationMin = differenceInMinutes(end, start);
  const top = ((startMin - DAY_START_MIN) / 60) * pxPerHour;
  const height = Math.max(28, (durationMin / 60) * pxPerHour);
  const sessionNo = (apt as any).session_number as number | null;

  return (
    <div
      ref={innerRef}
      onPointerDown={onPointerDown}
      onClick={onClick}
      {...(listeners ?? {})}
      {...(attributes ?? {})}
      className={cn(
        "absolute left-1 right-1 rounded-md border-l-4 px-2 py-1 text-xs cursor-grab overflow-hidden shadow-sm hover:shadow-md transition-shadow select-none touch-none",
        STATUS_BG[apt.status],
        isDragging && "opacity-50 cursor-grabbing"
      )}
      style={{
        top: `${Math.max(0, top)}px`,
        height: `${height}px`,
        borderLeftColor: apt.appointment_type.color,
        ...extraStyle,
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="font-medium truncate text-foreground">
          {apt.patient.first_name} {apt.patient.last_name}
        </div>
        {sessionNo ? (
          <Badge variant="outline" className="h-4 px-1 text-[9px] shrink-0">
            #{sessionNo}
          </Badge>
        ) : null}
      </div>
      {!compact && height > 36 && (
        <>
          <div className="truncate text-muted-foreground">
            {apt.appointment_type.name}
          </div>
          <div className="truncate text-muted-foreground">
            {format(start, "h:mm a")} – {format(end, "h:mm a")}
          </div>
        </>
      )}
      <div className="absolute right-1 top-1 flex gap-0.5">
        {apt.assigned_nurse_id && (
          <Stethoscope className="h-3 w-3 text-emerald-600" />
        )}
        {apt.appointment_type.requires_consent && (
          <AlertTriangle className="h-3 w-3 text-amber-600" />
        )}
      </div>
    </div>
  );
}

function DraggableEvent({
  apt,
  pxPerHour,
  onClick,
}: {
  apt: AppointmentWithRelations;
  pxPerHour: number;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: apt.id,
    data: { apt },
  });

  const downRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <CalendarEventCard
            apt={apt}
            pxPerHour={pxPerHour}
            isDragging={isDragging}
            innerRef={setNodeRef}
            listeners={listeners as Record<string, unknown>}
            attributes={attributes as unknown as Record<string, unknown>}
            style={{
              transform: CSS.Translate.toString(transform),
              zIndex: isDragging ? 50 : 1,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              downRef.current = { x: e.clientX, y: e.clientY };
            }}
            onClick={(e) => {
              e.stopPropagation();
              const d = downRef.current;
              downRef.current = null;
              if (isDragging) return;
              if (d) {
                const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
                if (moved > 4) return;
              }
              onClick();
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="font-medium">
            {apt.patient.first_name} {apt.patient.last_name}
          </div>
          <div className="text-xs text-muted-foreground">
            {apt.appointment_type.name} · {apt.chair?.name ?? "No chair"}
          </div>
          <div className="text-xs">
            {format(parseISO(apt.scheduled_start), "EEE MMM d, h:mm a")} –{" "}
            {format(parseISO(apt.scheduled_end), "h:mm a")}
          </div>
          {apt.notes && (
            <div className="text-xs mt-1 italic line-clamp-3">{apt.notes}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DroppableCell({
  day,
  chairId,
  pxPerHour,
  onSlotClick,
  children,
  showNowLine,
  nowLineHeightPx,
}: {
  day: Date;
  chairId: string;
  pxPerHour: number;
  onSlotClick: (date: Date) => void;
  children: React.ReactNode;
  showNowLine?: boolean;
  nowLineHeightPx?: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${chairId}|${day.toISOString()}`,
    data: { day, chairId },
  });

  const handleSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only fire when the click landed on the dedicated background layer.
    const target = e.target as HTMLElement;
    if (!target.dataset || target.dataset.slotBg !== "1") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const yPx = e.clientY - rect.top;
    const minutes = Math.round((yPx / pxPerHour) * 60);
    const snapped = Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;
    const totalMin = DAY_START_MIN + snapped;
    const slot = setMinutes(setHours(day, Math.floor(totalMin / 60)), totalMin % 60);
    onSlotClick(slot);
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleSlotClick}
      className={cn(
        "relative flex-1 border-r min-w-[120px]",
        isToday(day) && "bg-primary/5",
        isOver && "bg-primary/10 ring-1 ring-inset ring-primary"
      )}
      style={{ height: `${HOURS.length * pxPerHour}px` }}
    >
      {/* Dedicated click surface — clicks here mean "create at this time". */}
      <div
        data-slot-bg="1"
        className="absolute inset-0"
        aria-hidden
      />
      {/* Hour grid lines */}
      {HOURS.map((hour, i) => (
        <div
          key={hour}
          className="absolute left-0 right-0 border-t border-dashed border-muted/60 pointer-events-none"
          style={{ top: `${i * pxPerHour}px` }}
        />
      ))}
      {/* Now line — rendered once per day column, on the top chair row, spanning all chair rows */}
      {showNowLine && isToday(day) && (
        <NowLine pxPerHour={pxPerHour} spanHeightPx={nowLineHeightPx} />
      )}
      {children}
    </div>
  );
}

function NowLine({
  pxPerHour,
  spanHeightPx,
}: {
  pxPerHour: number;
  spanHeightPx?: number;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const min = now.getHours() * 60 + now.getMinutes();
  if (min < DAY_START_MIN || min > DAY_START_MIN + HOURS.length * 60) return null;
  const top = ((min - DAY_START_MIN) / 60) * pxPerHour;
  return (
    <div
      className="absolute left-0 right-0 z-20 border-t-2 border-red-500 pointer-events-none overflow-visible"
      style={{ top: `${top}px`, height: spanHeightPx ? `${spanHeightPx}px` : undefined }}
    >
      <div className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-red-500" />
    </div>
  );
}

export default function AdminAppointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "week"
  );
  const [density, setDensity] = useState<Density>(
    (searchParams.get("density") as Density) || "comfortable"
  );
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filters
  const [chairFilter, setChairFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<Set<AppointmentStatus>>(new Set());

  // Modal state
  const [editingApt, setEditingApt] = useState<AppointmentWithRelations | null>(null);
  const [createSlot, setCreateSlot] = useState<{ date: Date; chairId: string | null } | null>(null);
  const [activeDragApt, setActiveDragApt] = useState<AppointmentWithRelations | null>(null);

  const pxPerHour = DENSITY_PX[density];

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("view", viewMode);
    next.set("density", density);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, density]);

  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return { start: startOfDay(currentDate), end: endOfDay(currentDate) };
    }
    if (viewMode === "month") {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [viewMode, currentDate]);

  const { data: rawAppointments = [], isLoading } = useAppointments(
    dateRange.start,
    dateRange.end
  );
  const { data: chairs = [] } = useTreatmentChairs();
  const { data: types = [] } = useAppointmentTypes();
  const { data: nurses = [] } = useNurseStaff();
  const move = useMoveAppointment();

  const appointments = useMemo(() => {
    return rawAppointments.filter((a) => {
      if (chairFilter.size && (!a.chair_id || !chairFilter.has(a.chair_id))) return false;
      if (typeFilter.size && !typeFilter.has(a.appointment_type_id)) return false;
      if (statusFilter.size && !statusFilter.has(a.status)) return false;
      return true;
    });
  }, [rawAppointments, chairFilter, typeFilter, statusFilter]);

  const visibleChairs = useMemo(() => {
    if (!chairFilter.size) return chairs;
    return chairs.filter((c) => chairFilter.has(c.id));
  }, [chairs, chairFilter]);

  const weekDays = useMemo(() => {
    if (viewMode === "day") return [currentDate];
    return Array.from({ length: 7 }, (_, i) => addDays(dateRange.start, i));
  }, [viewMode, currentDate, dateRange.start]);

  const goToPrevious = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, -1));
    else if (viewMode === "month") setCurrentDate((d) => subMonths(d, 1));
    else setCurrentDate((d) => subWeeks(d, 1));
  };
  const goToNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1));
    else if (viewMode === "month") setCurrentDate((d) => addMonths(d, 1));
    else setCurrentDate((d) => addWeeks(d, 1));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (e: { active: { id: string | number } }) => {
    const apt = appointments.find((a) => a.id === e.active.id);
    if (apt) setActiveDragApt(apt);
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveDragApt(null);
    const { active, over, delta } = e;
    if (!over) return;

    const apt = appointments.find((a) => a.id === active.id);
    if (!apt) return;

    const overData = over.data.current as { day: Date; chairId: string };
    if (!overData) return;

    const start = parseISO(apt.scheduled_start);
    const end = parseISO(apt.scheduled_end);
    const durationMin = differenceInMinutes(end, start);

    // Vertical delta in px → minutes
    const minuteDelta = Math.round((delta.y / pxPerHour) * 60);
    const snapped = Math.round(minuteDelta / SLOT_MINUTES) * SLOT_MINUTES;

    // Build new start: combine new day with existing time-of-day + delta
    const baseTimeMin = start.getHours() * 60 + start.getMinutes() + snapped;
    const newStart = setMinutes(
      setHours(overData.day, Math.floor(baseTimeMin / 60)),
      baseTimeMin % 60
    );

    if (newStart < new Date()) {
      const ok = window.confirm(
        "This moves the appointment into the past. Are you sure?"
      );
      if (!ok) return;
    }

    // Conflict check (lightweight, in-memory)
    const newEnd = new Date(newStart.getTime() + durationMin * 60_000);
    const conflict = rawAppointments.find(
      (other) =>
        other.id !== apt.id &&
        other.chair_id === overData.chairId &&
        other.status !== "cancelled" &&
        other.status !== "no_show" &&
        parseISO(other.scheduled_start) < newEnd &&
        parseISO(other.scheduled_end) > newStart
    );
    if (conflict) {
      toast.error(
        `${chairs.find((c) => c.id === overData.chairId)?.name ?? "That chair"} is busy at that time`
      );
      return;
    }

    try {
      await move.mutateAsync({
        id: apt.id,
        newStart,
        durationMinutes: durationMin,
        newChairId: overData.chairId,
      });
      toast.success("Moved");
    } catch {
      toast.error("Couldn't move appointment");
    }
  };

  // ---------------- MONTH VIEW ----------------
  const monthGrid = useMemo(() => {
    if (viewMode !== "month") return [];
    const firstOfMonth = startOfMonth(currentDate);
    const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [viewMode, currentDate]);

  const monthAppointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentWithRelations[]>();
    for (const a of appointments) {
      const key = format(parseISO(a.scheduled_start), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [appointments]);

  // ---------------- TOOLBAR ----------------
  const headerLabel =
    viewMode === "day"
      ? format(currentDate, "EEEE, MMM d, yyyy")
      : viewMode === "month"
      ? format(currentDate, "MMMM yyyy")
      : `${format(dateRange.start, "MMM d")} – ${format(dateRange.end, "MMM d, yyyy")}`;

  const activeFilterCount =
    chairFilter.size + typeFilter.size + statusFilter.size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">
            Drag to reschedule · click to edit · click an empty slot to book
          </p>
        </div>
        <Button
          onClick={() =>
            setCreateSlot({
              date: setMinutes(setHours(currentDate, 9), 0),
              chairId: chairs[0]?.id ?? null,
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" /> New appointment
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" title="Jump to date">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={currentDate}
                    onSelect={(d) => d && setCurrentDate(d)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              <span className="ml-1 text-lg font-medium">{headerLabel}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    <FilterGroup
                      label="Chairs"
                      items={chairs.map((c) => ({ id: c.id, label: c.name }))}
                      selected={chairFilter}
                      onChange={setChairFilter}
                    />
                    <FilterGroup
                      label="Treatment types"
                      items={types.map((t) => ({
                        id: t.id,
                        label: t.name,
                        color: t.color,
                      }))}
                      selected={typeFilter}
                      onChange={setTypeFilter}
                    />
                    <FilterGroup<AppointmentStatus>
                      label="Status"
                      items={[
                        { id: "scheduled", label: "Scheduled" },
                        { id: "confirmed", label: "Confirmed" },
                        { id: "checked_in", label: "Checked in" },
                        { id: "in_progress", label: "In progress" },
                        { id: "completed", label: "Completed" },
                        { id: "no_show", label: "No-show" },
                        { id: "cancelled", label: "Cancelled" },
                      ]}
                      selected={statusFilter}
                      onChange={setStatusFilter}
                    />
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setChairFilter(new Set());
                          setTypeFilter(new Set());
                          setStatusFilter(new Set());
                        }}
                      >
                        Clear all
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
                <SelectTrigger className="w-[150px]">
                  <Layers className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>

              <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-muted-foreground">Loading appointments…</p>
            </div>
          ) : viewMode === "month" ? (
            <MonthView
              days={monthGrid}
              currentDate={currentDate}
              byDay={monthAppointmentsByDay}
              onDayClick={(d) => {
                setCurrentDate(d);
                setViewMode("day");
              }}
            />
          ) : (
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDragApt(null)}
            >
              <div className="overflow-x-auto">
                <div className="min-w-[900px] flex">
                  {/* Time gutter */}
                  <div className="w-16 shrink-0 bg-muted/30 border-r">
                    <div className="h-[68px] border-b" />
                    {visibleChairs.map((chair) => (
                      <div
                        key={chair.id}
                        className="border-b text-xs text-muted-foreground relative"
                        style={{ height: `${HOURS.length * pxPerHour}px` }}
                      >
                        {HOURS.map((hour, i) => (
                          <div
                            key={hour}
                            className="absolute right-1 -translate-y-1/2"
                            style={{ top: `${i * pxPerHour}px` }}
                          >
                            {format(setMinutes(setHours(new Date(), hour), 0), "ha")}
                          </div>
                        ))}
                        <div className="absolute left-1 top-1 text-xs font-medium text-foreground">
                          {chair.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  <div className="flex-1">
                    {/* Day headers */}
                    <div className="flex border-b h-[68px]">
                      {weekDays.map((day) => (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex-1 border-r p-2 text-center min-w-[120px]",
                            isToday(day) && "bg-primary/5"
                          )}
                        >
                          <div className="text-sm font-medium">{format(day, "EEE")}</div>
                          <div
                            className={cn(
                              "text-2xl font-bold",
                              isToday(day) && "text-primary"
                            )}
                          >
                            {format(day, "d")}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chair rows */}
                    {visibleChairs.map((chair, chairIdx) => (
                      <div key={chair.id} className="flex border-b">
                        {weekDays.map((day) => {
                          const dayAppts = appointments.filter(
                            (a) =>
                              isSameDay(parseISO(a.scheduled_start), day) &&
                              a.chair_id === chair.id
                          );
                          return (
                            <DroppableCell
                              key={day.toISOString()}
                              day={day}
                              chairId={chair.id}
                              pxPerHour={pxPerHour}
                              onSlotClick={(slot) =>
                                setCreateSlot({ date: slot, chairId: chair.id })
                              }
                              showNowLine={chairIdx === 0}
                              nowLineHeightPx={
                                visibleChairs.length * HOURS.length * pxPerHour
                              }
                            >
                              {dayAppts.map((apt) => (
                                <DraggableEvent
                                  key={apt.id}
                                  apt={apt}
                                  pxPerHour={pxPerHour}
                                  onClick={() => setEditingApt(apt)}
                                />
                              ))}
                            </DroppableCell>
                          );
                        })}
                      </div>
                    ))}

                    {visibleChairs.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        No chairs match the current filter.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <DragOverlay>
                {activeDragApt && (
                  <div className="w-48">
                    <CalendarEventCard
                      apt={activeDragApt}
                      pxPerHour={pxPerHour}
                    />
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Treatment types:</span>
          {types.map((t) => (
            <span key={t.id} className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: t.color }}
              />
              {t.name}
            </span>
          ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <AppointmentQuickEditDialog
        open={!!editingApt}
        onOpenChange={(o) => !o && setEditingApt(null)}
        appointment={editingApt}
      />
      {createSlot && (
        <AppointmentQuickCreateDialog
          open={!!createSlot}
          onOpenChange={(o) => !o && setCreateSlot(null)}
          defaultDate={createSlot.date}
          defaultChairId={createSlot.chairId}
        />
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  items,
  selected,
  onChange,
}: {
  label: string;
  items: { id: T; label: string; color?: string }[];
  selected: Set<T>;
  onChange: (s: Set<T>) => void;
}) {
  const toggle = (id: T) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {items.map((item) => (
        <Label
          key={item.id}
          className="flex items-center gap-2 cursor-pointer text-sm font-normal"
        >
          <Checkbox
            checked={selected.has(item.id)}
            onCheckedChange={() => toggle(item.id)}
          />
          {item.color && (
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </Label>
      ))}
    </div>
  );
}

function MonthView({
  days,
  currentDate,
  byDay,
  onDayClick,
}: {
  days: Date[];
  currentDate: Date;
  byDay: Map<string, AppointmentWithRelations[]>;
  onDayClick: (d: Date) => void;
}) {
  return (
    <div className="grid grid-cols-7 border-t">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
        <div
          key={d}
          className="border-b border-r bg-muted/40 px-2 py-1.5 text-xs font-medium text-muted-foreground"
        >
          {d}
        </div>
      ))}
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const list = byDay.get(key) ?? [];
        const inMonth = isSameMonth(day, currentDate);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onDayClick(day)}
            className={cn(
              "border-b border-r min-h-[110px] p-1.5 text-left hover:bg-accent/50 transition-colors",
              !inMonth && "bg-muted/20 text-muted-foreground",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div
              className={cn(
                "text-sm font-medium mb-1",
                isToday(day) && "text-primary font-bold"
              )}
            >
              {format(day, "d")}
            </div>
            <div className="space-y-0.5">
              {list.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="truncate rounded px-1 text-[10px] border-l-2"
                  style={{
                    borderLeftColor: a.appointment_type.color,
                    backgroundColor: a.appointment_type.color + "15",
                  }}
                >
                  {format(parseISO(a.scheduled_start), "h:mm")}{" "}
                  {a.patient.first_name} {a.patient.last_name[0]}.
                </div>
              ))}
              {list.length > 3 && (
                <div className="text-[10px] text-muted-foreground">
                  +{list.length - 3} more
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
