import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, startOfDay, endOfDay, startOfWeek, startOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Download, TrendingUp, Users, Activity } from "lucide-react";

type Period = "7d" | "30d" | "90d";

function useTreatmentStats(period: Period) {
  return useQuery({
    queryKey: ["reports", "treatments", period],
    queryFn: async () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const from = startOfDay(subDays(new Date(), days)).toISOString();

      const { data, error } = await supabase
        .from("treatments")
        .select(`
          id,
          status,
          started_at,
          ended_at,
          treatment_type:appointment_types!inner(name)
        `)
        .gte("created_at", from);

      if (error) throw error;
      return data || [];
    },
  });
}

function useAppointmentStats(period: Period) {
  return useQuery({
    queryKey: ["reports", "appointments", period],
    queryFn: async () => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const from = startOfDay(subDays(new Date(), days)).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select("id, status, scheduled_start")
        .gte("scheduled_start", from);

      if (error) throw error;
      return data || [];
    },
  });
}

function usePatientStats() {
  return useQuery({
    queryKey: ["reports", "patients"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      if (error) throw error;
      return count || 0;
    },
  });
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 220 70% 50%))",
  "hsl(var(--chart-3, 160 60% 45%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 280 65% 60%))",
];

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data: treatments } = useTreatmentStats(period);
  const { data: appointments } = useAppointmentStats(period);
  const { data: activePatients } = usePatientStats();

  // Treatment by type
  const byType: Record<string, number> = {};
  treatments?.forEach((t: any) => {
    const name = t.treatment_type?.name || "Unknown";
    byType[name] = (byType[name] || 0) + 1;
  });
  const typeData = Object.entries(byType).map(([name, count]) => ({ name, count }));

  // Appointment status breakdown
  const statusCounts: Record<string, number> = {};
  appointments?.forEach((a: any) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
  }));

  const completedCount = treatments?.filter((t: any) => t.status === "completed").length || 0;
  const totalAppointments = appointments?.length || 0;

  const exportCSV = () => {
    if (!treatments?.length) return;
    const headers = "Treatment Type,Status,Started,Ended\n";
    const rows = treatments.map((t: any) =>
      `"${t.treatment_type?.name || ""}","${t.status}","${t.started_at || ""}","${t.ended_at || ""}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `treatments-report-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Treatment and appointment analytics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-1 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Treatments Completed
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Appointments
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAppointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activePatients}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Treatments by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No treatment data for this period.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Appointment Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-12 text-muted-foreground">No appointment data for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
