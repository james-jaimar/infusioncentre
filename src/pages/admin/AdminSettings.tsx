import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import StatusDictionaryTab from "@/components/admin/StatusDictionaryTab";
import {
  useTreatmentChairs,
  useCreateChair,
  useUpdateChair,
  useDeleteChair,
} from "@/hooks/useTreatmentChairs";
import {
  useAppointmentTypes,
  useCreateAppointmentType,
  useUpdateAppointmentType,
  useDeleteAppointmentType,
} from "@/hooks/useAppointmentTypes";
import { TreatmentChair, AppointmentType } from "@/types/appointment";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure treatment chairs and appointment types</p>
      </div>

      <Tabs defaultValue="chairs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="chairs">Treatment Chairs</TabsTrigger>
          <TabsTrigger value="types">Appointment Types</TabsTrigger>
          <TabsTrigger value="statuses">Status Management</TabsTrigger>
        </TabsList>

        <TabsContent value="chairs">
          <ChairsSettings />
        </TabsContent>

        <TabsContent value="types">
          <AppointmentTypesSettings />
        </TabsContent>

        <TabsContent value="statuses">
          <StatusDictionaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ChairsSettings() {
  const { data: chairs = [], isLoading } = useTreatmentChairs(true);
  const createChair = useCreateChair();
  const updateChair = useUpdateChair();
  const deleteChair = useDeleteChair();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChair, setEditingChair] = useState<TreatmentChair | null>(null);
  const [formData, setFormData] = useState({ name: "", notes: "", is_active: true });

  const openCreate = () => {
    setEditingChair(null);
    setFormData({ name: "", notes: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (chair: TreatmentChair) => {
    setEditingChair(chair);
    setFormData({ name: chair.name, notes: chair.notes || "", is_active: chair.is_active });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingChair) {
        await updateChair.mutateAsync({ id: editingChair.id, data: formData });
        toast.success("Chair updated");
      } else {
        await createChair.mutateAsync(formData);
        toast.success("Chair created");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save chair");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChair.mutateAsync(id);
      toast.success("Chair deleted");
    } catch (error) {
      toast.error("Failed to delete chair. It may have appointments assigned.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Treatment Chairs</CardTitle>
          <CardDescription>Manage treatment chairs available for appointments</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Chair
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChair ? "Edit Chair" : "Add New Chair"}</DialogTitle>
              <DialogDescription>
                {editingChair ? "Update the chair details" : "Add a new treatment chair"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chair 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {editingChair ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : chairs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No chairs configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chairs.map((chair) => (
                <TableRow key={chair.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell className="font-medium">{chair.name}</TableCell>
                  <TableCell className="text-muted-foreground">{chair.notes || "—"}</TableCell>
                  <TableCell>
                    {chair.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(chair)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chair</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{chair.name}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(chair.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentTypesSettings() {
  const { data: types = [], isLoading } = useAppointmentTypes(true);
  const createType = useCreateAppointmentType();
  const updateType = useUpdateAppointmentType();
  const deleteType = useDeleteAppointmentType();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<AppointmentType | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    default_duration_minutes: 60,
    color: "#3E5B84",
    requires_consent: false,
    preparation_instructions: "",
    is_active: true,
  });

  const openCreate = () => {
    setEditingType(null);
    setFormData({
      name: "",
      default_duration_minutes: 60,
      color: "#3E5B84",
      requires_consent: false,
      preparation_instructions: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (type: AppointmentType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      default_duration_minutes: type.default_duration_minutes,
      color: type.color,
      requires_consent: type.requires_consent,
      preparation_instructions: type.preparation_instructions || "",
      is_active: type.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingType) {
        await updateType.mutateAsync({ id: editingType.id, data: formData });
        toast.success("Appointment type updated");
      } else {
        await createType.mutateAsync(formData);
        toast.success("Appointment type created");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save appointment type");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteType.mutateAsync(id);
      toast.success("Appointment type deleted");
    } catch (error) {
      toast.error("Failed to delete type. It may have appointments assigned.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointment Types</CardTitle>
          <CardDescription>Configure the types of treatments you offer</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Type" : "Add New Type"}</DialogTitle>
              <DialogDescription>
                {editingType ? "Update the appointment type" : "Add a new appointment type"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type-name">Name</Label>
                <Input
                  id="type-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Iron Infusion"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={15}
                    step={15}
                    value={formData.default_duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, default_duration_minutes: parseInt(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Preparation Instructions</Label>
                <Input
                  id="instructions"
                  value={formData.preparation_instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, preparation_instructions: e.target.value })
                  }
                  placeholder="Optional instructions for patients"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="requires_consent"
                    checked={formData.requires_consent}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requires_consent: checked })
                    }
                  />
                  <Label htmlFor="requires_consent">Requires Consent</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="type_is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="type_is_active">Active</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name}>
                {editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : types.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No appointment types configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Consent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <div
                      className="h-6 w-6 rounded"
                      style={{ backgroundColor: type.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.default_duration_minutes} min</TableCell>
                  <TableCell>{type.requires_consent ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {type.is_active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Type</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{type.name}"? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(type.id)}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
