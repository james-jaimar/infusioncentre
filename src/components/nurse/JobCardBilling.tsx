import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { useTreatmentBillableItems, useAddTreatmentBillableItem, useDeleteTreatmentBillableItem } from "@/hooks/useTreatmentBilling";
import { useBillableItems, useBillableItemsByType } from "@/hooks/useBillableItems";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { BillableItem } from "@/types/billing";

interface Props {
  treatmentId: string;
  appointmentTypeId?: string;
  isCompleted?: boolean;
}

export default function JobCardBilling({ treatmentId, appointmentTypeId, isCompleted }: Props) {
  const { user } = useAuth();
  const { data: lines = [] } = useTreatmentBillableItems(treatmentId);
  const { data: allItems = [] } = useBillableItems();
  const { data: suggestedItems = [] } = useBillableItemsByType(appointmentTypeId);
  const addLine = useAddTreatmentBillableItem();
  const deleteLine = useDeleteTreatmentBillableItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const selectedItem = allItems.find((i) => i.id === selectedItemId);

  const handleAdd = async () => {
    if (!selectedItem) return;
    try {
      await addLine.mutateAsync({
        treatment_id: treatmentId,
        billable_item_id: selectedItem.id,
        quantity: parseFloat(quantity) || 1,
        unit_price: selectedItem.default_price,
        recorded_by: user?.id || null,
      });
      toast({ title: "Item added" });
      setDialogOpen(false);
      setSelectedItemId("");
      setQuantity("1");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (lineId: string) => {
    try {
      await deleteLine.mutateAsync({ id: lineId, treatmentId });
    } catch {
      toast({ title: "Error removing item", variant: "destructive" });
    }
  };

  const runningTotal = lines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unit_price), 0);

  // Items not yet added that are suggested for this treatment type
  const addedItemIds = new Set(lines.map((l) => l.billable_item_id));
  const unadded = suggestedItems.filter((s) => !addedItemIds.has(s.id));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Billing Items
        </CardTitle>
        {!isCompleted && (
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {unadded.length > 0 && !isCompleted && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Suggested for this treatment:</p>
            <div className="flex flex-wrap gap-1">
              {unadded.map((item) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={async () => {
                    try {
                      await addLine.mutateAsync({
                        treatment_id: treatmentId,
                        billable_item_id: item.id,
                        quantity: 1,
                        unit_price: item.default_price,
                        recorded_by: user?.id || null,
                      });
                    } catch {}
                  }}
                >
                  + {item.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {lines.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">No billing items recorded yet</p>
        ) : (
          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{line.billable_item?.name || "Unknown item"}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(line.quantity)} × R{Number(line.unit_price).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">R{(Number(line.quantity) * Number(line.unit_price)).toFixed(2)}</span>
                  {!isCompleted && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(line.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between pt-2 font-medium">
              <span>Session Total</span>
              <span className="font-mono">R{runningTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Billing Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                <SelectContent>
                  {allItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — R{Number(item.default_price).toFixed(2)}/{item.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            {selectedItem && (
              <p className="text-sm text-muted-foreground">
                Subtotal: R{((parseFloat(quantity) || 0) * selectedItem.default_price).toFixed(2)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={!selectedItemId}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
