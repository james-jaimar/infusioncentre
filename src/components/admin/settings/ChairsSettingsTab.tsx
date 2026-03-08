import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { useTreatmentChairs, useCreateChair, useUpdateChair, useDeleteChair } from "@/hooks/useTreatmentChairs";
import { TreatmentChair } from "@/types/appointment";

export default function ChairsSettingsTab() {
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
    } catch {
      toast.error("Failed to save chair");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChair.mutateAsync(id);
      toast.success("Chair deleted");
    } catch {
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
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Chair</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChair ? "Edit Chair" : "Add New Chair"}</DialogTitle>
              <DialogDescription>{editingChair ? "Update the chair details" : "Add a new treatment chair"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Chair 1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional notes" />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => setFormData({ ...formData, is_active: checked })} />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={!formData.name}>{editingChair ? "Update" : "Create"}</Button>
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
              {chairs.map(chair => (
                <TableRow key={chair.id}>
                  <TableCell><GripVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                  <TableCell className="font-medium">{chair.name}</TableCell>
                  <TableCell className="text-muted-foreground">{chair.notes || "—"}</TableCell>
                  <TableCell>{chair.is_active ? <span className="text-green-600">Active</span> : <span className="text-muted-foreground">Inactive</span>}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(chair)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Chair</AlertDialogTitle>
                            <AlertDialogDescription>Are you sure you want to delete "{chair.name}"? This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(chair.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
