import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Edit, Plus, Trash2, Activity, Clock, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { useAllProtocols, useUpdateProtocol, useCreateProtocolStep, useDeleteProtocolStep, useCreateDischargeCriterion, useDeleteDischargeCriterion } from "@/hooks/useProtocolAdmin";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import type { TreatmentProtocol } from "@/types/protocol";

export default function ProtocolConfigTab() {
  const { data: protocols = [], isLoading } = useAllProtocols();
  const { data: types = [] } = useAppointmentTypes(true);
  const updateProtocol = useUpdateProtocol();
  const createStep = useCreateProtocolStep();
  const deleteStep = useDeleteProtocolStep();
  const createCriterion = useCreateDischargeCriterion();
  const deleteCriterion = useDeleteDischargeCriterion();

  const [editingProtocol, setEditingProtocol] = useState<TreatmentProtocol | null>(null);
  const [editForm, setEditForm] = useState({
    vitals_interval_initial_mins: 10,
    vitals_interval_standard_mins: 15,
    vitals_initial_period_mins: 30,
    post_infusion_observation_mins: 30,
    min_vitals_during: 2,
    min_vitals_post: 1,
    is_active: true,
  });

  const openEdit = (p: TreatmentProtocol) => {
    setEditingProtocol(p);
    setEditForm({
      vitals_interval_initial_mins: p.vitals_interval_initial_mins,
      vitals_interval_standard_mins: p.vitals_interval_standard_mins,
      vitals_initial_period_mins: p.vitals_initial_period_mins,
      post_infusion_observation_mins: p.post_infusion_observation_mins,
      min_vitals_during: p.min_vitals_during,
      min_vitals_post: p.min_vitals_post,
      is_active: p.is_active,
    });
  };

  const handleSave = async () => {
    if (!editingProtocol) return;
    try {
      await updateProtocol.mutateAsync({ id: editingProtocol.id, data: editForm });
      toast.success("Protocol updated");
      setEditingProtocol(null);
    } catch {
      toast.error("Failed to update protocol");
    }
  };

  const getTypeName = (typeId: string) => types.find(t => t.id === typeId)?.name || "Unknown";

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading protocols...</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" />Treatment Protocols</CardTitle>
          <CardDescription>Configure monitoring intervals, observation periods, and discharge criteria for each treatment type</CardDescription>
        </CardHeader>
        <CardContent>
          {protocols.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No protocols configured. Create treatment types first.</p>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {protocols.map(protocol => (
                <AccordionItem key={protocol.id} value={protocol.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-medium">{protocol.name}</span>
                      <Badge variant={protocol.is_active ? "default" : "secondary"}>
                        {protocol.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {getTypeName(protocol.treatment_type_id)} · v{protocol.version}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* Monitoring parameters */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Initial Vitals Interval</p>
                          <p className="font-medium">{protocol.vitals_interval_initial_mins} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Standard Vitals Interval</p>
                          <p className="font-medium">{protocol.vitals_interval_standard_mins} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Initial Period Duration</p>
                          <p className="font-medium">{protocol.vitals_initial_period_mins} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Post-Infusion Observation</p>
                          <p className="font-medium">{protocol.post_infusion_observation_mins} min</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min Vitals During</p>
                          <p className="font-medium">{protocol.min_vitals_during}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Min Vitals Post</p>
                          <p className="font-medium">{protocol.min_vitals_post}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(protocol)}>
                          <Edit className="h-3 w-3 mr-1" /> Edit Parameters
                        </Button>
                      </div>

                      {/* Protocol Steps */}
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <ListChecks className="h-4 w-4" /> Steps ({protocol.treatment_protocol_steps?.length || 0})
                        </h4>
                        {protocol.treatment_protocol_steps?.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">#</TableHead>
                                <TableHead>Step</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Required</TableHead>
                                <TableHead className="w-16"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {protocol.treatment_protocol_steps
                                .sort((a, b) => a.step_order - b.step_order)
                                .map(step => (
                                  <TableRow key={step.id}>
                                    <TableCell>{step.step_order}</TableCell>
                                    <TableCell className="font-medium">{step.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{step.step_type}</Badge>
                                    </TableCell>
                                    <TableCell>{step.is_required ? "Yes" : "No"}</TableCell>
                                    <TableCell>
                                      <Button variant="ghost" size="icon"
                                        onClick={async () => {
                                          await deleteStep.mutateAsync(step.id);
                                          toast.success("Step removed");
                                        }}>
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">No steps configured</p>
                        )}
                      </div>

                      {/* Discharge Criteria */}
                      <div>
                        <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4" /> Discharge Criteria ({protocol.discharge_criteria?.length || 0})
                        </h4>
                        {protocol.discharge_criteria?.length > 0 ? (
                          <div className="space-y-1">
                            {protocol.discharge_criteria
                              .sort((a, b) => a.display_order - b.display_order)
                              .map(c => (
                                <div key={c.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-sm">
                                  <div>
                                    <span className="font-medium">{c.display_label}</span>
                                    {c.description && <span className="text-muted-foreground ml-2">— {c.description}</span>}
                                    {c.is_required && <Badge variant="outline" className="ml-2 text-xs">Required</Badge>}
                                  </div>
                                  <Button variant="ghost" size="icon"
                                    onClick={async () => {
                                      await deleteCriterion.mutateAsync(c.id);
                                      toast.success("Criterion removed");
                                    }}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No discharge criteria configured</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Edit Protocol Dialog */}
      <Dialog open={!!editingProtocol} onOpenChange={(open) => !open && setEditingProtocol(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Protocol: {editingProtocol?.name}</DialogTitle>
            <DialogDescription>Adjust monitoring intervals and observation parameters</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Initial Vitals Interval (min)</Label>
                <Input type="number" min={1} value={editForm.vitals_interval_initial_mins}
                  onChange={e => setEditForm({ ...editForm, vitals_interval_initial_mins: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Standard Vitals Interval (min)</Label>
                <Input type="number" min={1} value={editForm.vitals_interval_standard_mins}
                  onChange={e => setEditForm({ ...editForm, vitals_interval_standard_mins: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Initial Period Duration (min)</Label>
                <Input type="number" min={1} value={editForm.vitals_initial_period_mins}
                  onChange={e => setEditForm({ ...editForm, vitals_initial_period_mins: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Post-Infusion Observation (min)</Label>
                <Input type="number" min={0} value={editForm.post_infusion_observation_mins}
                  onChange={e => setEditForm({ ...editForm, post_infusion_observation_mins: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Min Vitals During Treatment</Label>
                <Input type="number" min={0} value={editForm.min_vitals_during}
                  onChange={e => setEditForm({ ...editForm, min_vitals_during: +e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Min Vitals Post Treatment</Label>
                <Input type="number" min={0} value={editForm.min_vitals_post}
                  onChange={e => setEditForm({ ...editForm, min_vitals_post: +e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.is_active}
                onCheckedChange={checked => setEditForm({ ...editForm, is_active: checked })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProtocol(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
