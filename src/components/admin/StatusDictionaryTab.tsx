import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, Edit, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  useStatusDictionaries,
  useStatusTransitions,
  useUpdateStatusDictionary,
  useCreateStatusDictionary,
  type EntityType,
  type StatusDictionary,
} from "@/hooks/useStatusDictionaries";

const ENTITY_TYPES: { key: EntityType; label: string }[] = [
  { key: "referral", label: "Referral" },
  { key: "treatment_course", label: "Treatment Course" },
  { key: "appointment", label: "Appointment" },
  { key: "treatment", label: "Treatment" },
];

export default function StatusDictionaryTab() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("referral");

  return (
    <div className="space-y-6">
      <Tabs value={selectedEntity} onValueChange={(v) => setSelectedEntity(v as EntityType)}>
        <TabsList>
          {ENTITY_TYPES.map((et) => (
            <TabsTrigger key={et.key} value={et.key}>
              {et.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_TYPES.map((et) => (
          <TabsContent key={et.key} value={et.key} className="space-y-6">
            <StatusesCard entityType={et.key} entityLabel={et.label} />
            <TransitionsCard entityType={et.key} entityLabel={et.label} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function StatusesCard({ entityType, entityLabel }: { entityType: EntityType; entityLabel: string }) {
  const { data: statuses = [], isLoading } = useStatusDictionaries(entityType);
  const updateStatus = useUpdateStatusDictionary();
  const createStatus = useCreateStatusDictionary();
  const [editingStatus, setEditingStatus] = useState<StatusDictionary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    status_key: "",
    display_label: "",
    description: "",
    color: "#6b7280",
    is_default: false,
    is_terminal: false,
    is_active: true,
    display_order: 0,
  });

  const openEdit = (status: StatusDictionary) => {
    setEditingStatus(status);
    setFormData({
      status_key: status.status_key,
      display_label: status.display_label,
      description: status.description || "",
      color: status.color,
      is_default: status.is_default,
      is_terminal: status.is_terminal,
      is_active: status.is_active,
      display_order: status.display_order,
    });
    setIsDialogOpen(true);
  };

  const openCreate = () => {
    setEditingStatus(null);
    setFormData({
      status_key: "",
      display_label: "",
      description: "",
      color: "#6b7280",
      is_default: false,
      is_terminal: false,
      is_active: true,
      display_order: statuses.length,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingStatus) {
        await updateStatus.mutateAsync({
          id: editingStatus.id,
          data: {
            display_label: formData.display_label,
            description: formData.description || null,
            color: formData.color,
            is_default: formData.is_default,
            is_terminal: formData.is_terminal,
            is_active: formData.is_active,
            display_order: formData.display_order,
          },
        });
        toast.success("Status updated");
      } else {
        await createStatus.mutateAsync({
          entity_type: entityType,
          status_key: formData.status_key,
          display_label: formData.display_label,
          description: formData.description || null,
          color: formData.color,
          is_default: formData.is_default,
          is_terminal: formData.is_terminal,
          is_active: formData.is_active,
          display_order: formData.display_order,
        });
        toast.success("Status created");
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Failed to save status");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{entityLabel} Statuses</CardTitle>
          <CardDescription>Configure the lifecycle statuses for {entityLabel.toLowerCase()} records</CardDescription>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Status
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-16">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: s.color }} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.status_key}</TableCell>
                  <TableCell className="font-medium">{s.display_label}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {s.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      {s.is_terminal && <Badge variant="outline" className="text-xs">Terminal</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{s.display_order}</TableCell>
                  <TableCell>
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={async (checked) => {
                        await updateStatus.mutateAsync({ id: s.id, data: { is_active: checked } });
                        toast.success(`Status ${checked ? "activated" : "deactivated"}`);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingStatus ? "Edit Status" : "Add Status"}</DialogTitle>
            <DialogDescription>
              {editingStatus ? "Update status configuration" : `Add a new status to the ${entityLabel.toLowerCase()} lifecycle`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingStatus && (
              <div className="space-y-2">
                <Label>Status Key</Label>
                <Input
                  value={formData.status_key}
                  onChange={(e) => setFormData({ ...formData, status_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                  placeholder="e.g., awaiting_docs"
                  className="font-mono"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Display Label</Label>
              <Input
                value={formData.display_label}
                onChange={(e) => setFormData({ ...formData, display_label: e.target.value })}
                placeholder="e.g., Awaiting Documents"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-14 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_default} onCheckedChange={(c) => setFormData({ ...formData, is_default: c })} />
                <Label>Default</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_terminal} onCheckedChange={(c) => setFormData({ ...formData, is_terminal: c })} />
                <Label>Terminal</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                <Label>Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.display_label || (!editingStatus && !formData.status_key)}>
              {editingStatus ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TransitionsCard({ entityType, entityLabel }: { entityType: EntityType; entityLabel: string }) {
  const { data: transitions = [], isLoading } = useStatusTransitions(entityType);
  const { data: statuses = [] } = useStatusDictionaries(entityType);

  const getLabel = (key: string) => statuses.find((s) => s.status_key === key)?.display_label ?? key;
  const getColor = (key: string) => statuses.find((s) => s.status_key === key)?.color ?? "#6b7280";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{entityLabel} Transitions</CardTitle>
        <CardDescription>Allowed status transitions for {entityLabel.toLowerCase()} records</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-center py-8">Loading...</p>
        ) : transitions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No transitions configured</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From</TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>To</TableHead>
                <TableHead>Action Label</TableHead>
                <TableHead>Required Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transitions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: getColor(t.from_status), color: getColor(t.from_status) }}>
                      {getLabel(t.from_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" style={{ borderColor: getColor(t.to_status), color: getColor(t.to_status) }}>
                      {getLabel(t.to_status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.label || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{t.required_role || "Any"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
