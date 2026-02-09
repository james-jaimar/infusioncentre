import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Search, GraduationCap } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const AdminTraining = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["admin-course-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_bookings")
        .select("*, training_courses(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: BookingStatus }) => {
      const { error } = await supabase
        .from("course_bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-bookings"] });
      toast({ title: "Booking updated" });
    },
  });

  const filtered = bookings?.filter((b) => {
    const matchesStatus = filterStatus === "all" || b.status === filterStatus;
    const matchesSearch =
      !search ||
      b.participant_name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      (b.organisation && b.organisation.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Training Bookings</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !filtered?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Organisation</TableHead>
                <TableHead>Preferred Dates</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(booking.created_at), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">{booking.participant_name}</TableCell>
                  <TableCell className="text-sm">
                    {(booking.training_courses as any)?.name || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{booking.email}</div>
                    {booking.phone && <div className="text-muted-foreground">{booking.phone}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{booking.organisation || "—"}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">
                    {booking.preferred_dates || "—"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(val) =>
                        updateStatus.mutate({ id: booking.id, status: val as BookingStatus })
                      }
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <Badge className={statusColors[booking.status as BookingStatus]}>
                          {booking.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminTraining;
