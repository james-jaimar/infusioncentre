import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTrainingCourses, useCreateTrainingCourse, useUpdateTrainingCourse, useDeleteTrainingCourse } from "@/hooks/useTrainingCourses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Search, GraduationCap, Plus, Pencil, Trash2, BookOpen } from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// ── Bookings Tab ──

function BookingsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editBooking, setEditBooking] = useState<any>(null);
  const [deleteBooking, setDeleteBooking] = useState<any>(null);

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

  const updateBooking = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const { error } = await supabase.from("course_bookings").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-bookings"] });
      toast({ title: "Booking updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_bookings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-bookings"] });
      toast({ title: "Booking deleted" });
      setDeleteBooking(null);
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, email, or organisation..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="whitespace-nowrap text-sm">{format(new Date(booking.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="font-medium">{booking.participant_name}</TableCell>
                  <TableCell className="text-sm">{(booking.training_courses as any)?.name || "—"}</TableCell>
                  <TableCell className="text-sm">
                    <div>{booking.email}</div>
                    {booking.phone && <div className="text-muted-foreground">{booking.phone}</div>}
                  </TableCell>
                  <TableCell className="text-sm">{booking.organisation || "—"}</TableCell>
                  <TableCell>
                    <Select
                      value={booking.status}
                      onValueChange={(val) => updateBooking.mutate({ id: booking.id, data: { status: val } })}
                    >
                      <SelectTrigger className="w-[130px] h-8">
                        <Badge className={statusColors[booking.status as BookingStatus]}>{booking.status}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditBooking(booking)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteBooking(booking)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Booking Dialog */}
      <EditBookingDialog booking={editBooking} onClose={() => setEditBooking(null)} onSave={(id, data) => {
        updateBooking.mutate({ id, data });
        setEditBooking(null);
      }} />

      {/* Delete Booking */}
      <AlertDialog open={!!deleteBooking} onOpenChange={() => setDeleteBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete this booking for {deleteBooking?.participant_name}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => deleteMutation.mutate(deleteBooking.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditBookingDialog({ booking, onClose, onSave }: { booking: any; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const [form, setForm] = useState(booking || {});
  if (!booking) return null;

  // Sync form when booking changes
  if (form.id !== booking.id) setForm(booking);

  return (
    <Dialog open={!!booking} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Participant Name</Label><Input value={form.participant_name || ""} onChange={(e) => setForm({ ...form, participant_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>Organisation</Label><Input value={form.organisation || ""} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></div>
          <div><Label>Preferred Dates</Label><Input value={form.preferred_dates || ""} onChange={(e) => setForm({ ...form, preferred_dates: e.target.value })} /></div>
          <div><Label>Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(form.id, {
            participant_name: form.participant_name,
            email: form.email,
            phone: form.phone || null,
            organisation: form.organisation || null,
            preferred_dates: form.preferred_dates || null,
            notes: form.notes || null,
          })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Courses Tab ──

function CoursesTab() {
  const { toast } = useToast();
  const { data: courses, isLoading } = useTrainingCourses(true);
  const createCourse = useCreateTrainingCourse();
  const updateCourse = useUpdateTrainingCourse();
  const deleteCourse = useDeleteTrainingCourse();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const emptyCourse = { name: "", description: "", duration_hours: "", price: "", max_participants: "8", includes: "", is_active: true };
  const [form, setForm] = useState<any>(emptyCourse);

  const openCreate = () => { setEditingCourse(null); setForm(emptyCourse); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditingCourse(c);
    setForm({
      name: c.name,
      description: c.description || "",
      duration_hours: c.duration_hours?.toString() || "",
      price: c.price?.toString() || "",
      max_participants: c.max_participants?.toString() || "8",
      includes: c.includes?.join(", ") || "",
      is_active: c.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const payload = {
      name: form.name,
      description: form.description || null,
      duration_hours: form.duration_hours ? parseInt(form.duration_hours) : null,
      price: form.price ? parseFloat(form.price) : null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      includes: form.includes ? form.includes.split(",").map((s: string) => s.trim()).filter(Boolean) : null,
      is_active: form.is_active,
    };

    try {
      if (editingCourse) {
        await updateCourse.mutateAsync({ id: editingCourse.id, data: payload });
        toast({ title: "Course updated" });
      } else {
        await createCourse.mutateAsync(payload);
        toast({ title: "Course created" });
      }
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse.mutateAsync(deleteId);
      toast({ title: "Course deleted" });
      setDeleteId(null);
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Add Course</Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : !courses?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No courses yet.</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.duration_hours ? `${c.duration_hours}h` : "—"}</TableCell>
                  <TableCell>{c.price ? `R${c.price}` : "—"}</TableCell>
                  <TableCell>{c.max_participants || "—"}</TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Course Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Duration (hrs)</Label><Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} /></div>
              <div><Label>Price (R)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>Max Participants</Label><Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} /></div>
            </div>
            <div><Label>Includes (comma-separated)</Label><Input value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingCourse ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this course. Existing bookings will not be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Main Page ──

const AdminTraining = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-heading font-bold text-foreground">Training Management</h1>
      </div>

      <Tabs defaultValue="bookings">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings"><BookingsTab /></TabsContent>
        <TabsContent value="courses"><CoursesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTraining;
