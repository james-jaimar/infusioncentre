import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Search, Package, AlertTriangle } from "lucide-react";
import {
  useBillableItems, useCreateBillableItem, useUpdateBillableItem, useDeleteBillableItem,
} from "@/hooks/useBillableItems";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import type { BillableItem, BillableItemCategory } from "@/types/billing";
import { BILLABLE_CATEGORIES } from "@/types/billing";

const emptyForm = {
  name: "",
  category: "other" as BillableItemCategory,
  code: "",
  unit: "per unit",
  default_price: 0,
  cost_price: "",
  track_stock: false,
  stock_quantity: 0,
  reorder_level: "",
  appointment_type_id: "",
  icd10_code: "",
  tariff_code: "",
  is_active: true,
};

export default function AdminBillableItems() {
  const { data: items = [], isLoading } = useBillableItems(true);
  const { data: appointmentTypes = [] } = useAppointmentTypes(true);
  const createItem = useCreateBillableItem();
  const updateItem = useUpdateBillableItem();
  const deleteItem = useDeleteBillableItem();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BillableItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: BillableItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      category: item.category,
      code: item.code || "",
      unit: item.unit,
      default_price: item.default_price,
      cost_price: item.cost_price?.toString() || "",
      track_stock: item.track_stock,
      stock_quantity: item.stock_quantity,
      reorder_level: item.reorder_level?.toString() || "",
      appointment_type_id: item.appointment_type_id || "",
      icd10_code: item.icd10_code || "",
      tariff_code: item.tariff_code || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      name: form.name,
      category: form.category,
      code: form.code || null,
      unit: form.unit,
      default_price: form.default_price,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      track_stock: form.track_stock,
      stock_quantity: form.stock_quantity,
      reorder_level: form.reorder_level ? parseInt(form.reorder_level) : null,
      appointment_type_id: form.appointment_type_id || null,
      icd10_code: form.icd10_code || null,
      tariff_code: form.tariff_code || null,
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, data: payload });
        toast.success("Item updated");
      } else {
        await createItem.mutateAsync(payload);
        toast.success("Item created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItem.mutateAsync(id);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete. It may be in use.");
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStock = items.filter((i) => i.track_stock && i.reorder_level && i.stock_quantity <= i.reorder_level);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Billable Items</h1>
          <p className="text-muted-foreground">Manage your product and service catalogue</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              {lowStock.length} item{lowStock.length > 1 ? "s" : ""} at or below reorder level:{" "}
              {lowStock.map((i) => i.name).join(", ")}
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {BILLABLE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-2 text-muted-foreground">No billable items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price (R)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {item.category.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {item.code || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(item.default_price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.track_stock ? (
                          <span className={item.reorder_level && item.stock_quantity <= item.reorder_level ? "text-amber-600 font-medium" : ""}>
                            {item.stock_quantity}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.is_active ? (
                          <span className="text-green-600 text-sm">Active</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
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
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete "{item.name}"? Consider deactivating instead if it has been used in treatments.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Billable Item" : "Add Billable Item"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update the item details" : "Add a new item to the billing catalogue"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ketamine 100mg vial" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as BillableItemCategory })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BILLABLE_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="per vial" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Default Price (R)</Label>
                <Input type="number" step="0.01" min="0" value={form.default_price} onChange={(e) => setForm({ ...form, default_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (R)</Label>
                <Input value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Code (NAPPI/SKU)</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Linked Treatment Type</Label>
                <Select value={form.appointment_type_id || "none"} onValueChange={(v) => setForm({ ...form, appointment_type_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {appointmentTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>ICD-10 Code</Label>
                <Input value={form.icd10_code} onChange={(e) => setForm({ ...form, icd10_code: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Tariff Code</Label>
                <Input value={form.tariff_code} onChange={(e) => setForm({ ...form, tariff_code: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.track_stock} onCheckedChange={(v) => setForm({ ...form, track_stock: v })} />
                <Label>Track Stock</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
            {form.track_stock && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} placeholder="Optional" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
