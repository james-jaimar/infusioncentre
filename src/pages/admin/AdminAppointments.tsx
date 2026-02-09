import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useAppointments } from "@/hooks/useAppointments";
import { useTreatmentChairs } from "@/hooks/useTreatmentChairs";
import { AppointmentWithRelations, AppointmentStatus } from "@/types/appointment";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 7); // 7am to 5pm

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-green-100 text-green-800 border-green-200",
  checked_in: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-gray-100 text-gray-800 border-gray-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
  no_show: "bg-orange-100 text-orange-800 border-orange-200",
};

type ViewMode = "day" | "week";

export default function AdminAppointments() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateRange = useMemo(() => {
    if (viewMode === "day") {
      return {
        start: startOfDay(currentDate),
        end: endOfDay(currentDate),
      };
    }
    return {
      start: startOfWeek(currentDate, { weekStartsOn: 1 }),
      end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    };
  }, [viewMode, currentDate]);

  const { data: appointments = [], isLoading: loadingAppointments } = useAppointments(
    dateRange.start,
    dateRange.end
  );
  const { data: chairs = [] } = useTreatmentChairs();

  const weekDays = useMemo(() => {
    if (viewMode === "day") {
      return [currentDate];
    }
    return Array.from({ length: 7 }, (_, i) => addDays(dateRange.start, i));
  }, [viewMode, currentDate, dateRange.start]);

  const goToPrevious = () => {
    if (viewMode === "day") {
      setCurrentDate((d) => addDays(d, -1));
    } else {
      setCurrentDate((d) => subWeeks(d, 1));
    }
  };

  const goToNext = () => {
    if (viewMode === "day") {
      setCurrentDate((d) => addDays(d, 1));
    } else {
      setCurrentDate((d) => addWeeks(d, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getAppointmentsForDayAndChair = (day: Date, chairId: string) => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.scheduled_start);
      return isSameDay(aptDate, day) && apt.chair_id === chairId;
    });
  };

  const getAppointmentPosition = (apt: AppointmentWithRelations) => {
    const start = parseISO(apt.scheduled_start);
    const end = parseISO(apt.scheduled_end);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const dayStart = 7 * 60; // 7am in minutes
    const top = ((startMinutes - dayStart) / 60) * 64; // 64px per hour
    const height = ((endMinutes - startMinutes) / 60) * 64;
    return { top: Math.max(0, top), height: Math.max(32, height) };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments and schedules</p>
        </div>
        <Button asChild>
          <Link to="/admin/appointments/new">
            <Plus className="mr-2 h-4 w-4" />
            New Appointment
          </Link>
        </Button>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ml-2 text-lg font-medium">
                {viewMode === "day"
                  ? format(currentDate, "EEEE, MMMM d, yyyy")
                  : `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`}
              </span>
            </div>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadingAppointments ? (
            <div className="flex h-96 items-center justify-center">
              <p className="text-muted-foreground">Loading appointments...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Day Headers */}
                <div className="flex border-b">
                  <div className="w-20 shrink-0 border-r bg-muted/50 p-2">
                    <span className="text-xs font-medium text-muted-foreground">Chair</span>
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "flex-1 border-r p-2 text-center",
                        isSameDay(day, new Date()) && "bg-primary/5"
                      )}
                    >
                      <div className="text-sm font-medium">{format(day, "EEE")}</div>
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          isSameDay(day, new Date()) && "text-primary"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chair Rows */}
                {chairs.map((chair) => (
                  <div key={chair.id} className="flex border-b">
                    <div className="w-20 shrink-0 border-r bg-muted/50 p-2">
                      <span className="text-sm font-medium">{chair.name}</span>
                    </div>
                    {weekDays.map((day) => {
                      const dayAppointments = getAppointmentsForDayAndChair(day, chair.id);
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "relative flex-1 border-r",
                            isSameDay(day, new Date()) && "bg-primary/5"
                          )}
                          style={{ height: `${HOURS.length * 64}px` }}
                        >
                          {/* Hour grid lines */}
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              className="absolute left-0 right-0 border-t border-dashed border-muted"
                              style={{ top: `${(hour - 7) * 64}px` }}
                            />
                          ))}

                          {/* Appointments */}
                          {dayAppointments.map((apt) => {
                            const pos = getAppointmentPosition(apt);
                            return (
                              <Link
                                key={apt.id}
                                to={`/admin/appointments/${apt.id}`}
                                className={cn(
                                  "absolute left-1 right-1 overflow-hidden rounded border px-2 py-1 text-xs transition-shadow hover:shadow-md",
                                  statusColors[apt.status]
                                )}
                                style={{
                                  top: `${pos.top}px`,
                                  height: `${pos.height}px`,
                                  backgroundColor: apt.appointment_type.color + "20",
                                  borderColor: apt.appointment_type.color,
                                }}
                              >
                                <div className="font-medium truncate">
                                  {apt.patient.first_name} {apt.patient.last_name}
                                </div>
                                <div className="truncate opacity-75">
                                  {apt.appointment_type.name}
                                </div>
                                <div className="truncate opacity-75">
                                  {format(parseISO(apt.scheduled_start), "h:mm a")}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Time labels overlay */}
                <div className="absolute left-0 top-0 w-20 pointer-events-none">
                  {HOURS.map((hour, idx) => (
                    <div
                      key={hour}
                      className="absolute text-xs text-muted-foreground"
                      style={{ top: `${idx * 64 + 140}px` }}
                    >
                      {format(setMinutes(setHours(new Date(), hour), 0), "h a")}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's appointments list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {viewMode === "day" ? "Today's" : "This Week's"} Appointments ({appointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No appointments scheduled</p>
          ) : (
            <div className="space-y-2">
              {appointments.map((apt) => (
                <Link
                  key={apt.id}
                  to={`/admin/appointments/${apt.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: apt.appointment_type.color }}
                    />
                    <div>
                      <div className="font-medium">
                        {apt.patient.first_name} {apt.patient.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {apt.appointment_type.name} • {apt.chair?.name || "No chair"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {format(parseISO(apt.scheduled_start), "EEE, MMM d")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(apt.scheduled_start), "h:mm a")} -{" "}
                      {format(parseISO(apt.scheduled_end), "h:mm a")}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn(statusColors[apt.status])}>
                    {apt.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
