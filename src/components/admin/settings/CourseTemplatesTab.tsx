import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useAppointmentTypes,
  useCreateAppointmentType,
  useUpdateAppointmentType,
  useDeleteAppointmentType,
} from "@/hooks/useAppointmentTypes";
import { useFormTemplates } from "@/hooks/useFormTemplates";
import {
  useCourseTemplates, useCreateCourseTemplate, useUpdateCourseTemplate,
  useDeleteCourseTemplate, useSetTemplateForms, type CourseTemplate, type CourseFrequency,
} from "@/hooks/useCourseTemplates";

const FREQUENCY_LABELS: Record<CourseFrequency, string> = {
  single: "Single session",
  weekly: "Weekly",
  twice_weekly: "Twice weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

interface EditState {
  id?: string;
  appointment_type_id: string;
  name: string;
  description: string;
  default_sessions: number;
  default_frequency: CourseFrequency;
  default_session_duration_mins: string;
  medication_name: string;
  medication_notes: string;
  is_active: boolean;
  form_template_ids: string[];
}

const empty = (typeId = ""): EditState => ({
  appointment_type_id: typeId,
  name: "",
  description: "",
  default_sessions: 1,
  default_frequency: "single",
  default_session_duration_mins: "",
  medication_name: "",
  medication_notes: "",
  is_active: true,
  form_template_ids: [],
});

export default function CourseTemplatesTab() {
  const { data: types = [] } = useAppointmentTypes(true);
  const { data: templates = [], isLoading } = useCourseTemplates();
  const { data: forms = [] } = useFormTemplates();
  const create = useCreateCourseTemplate();
  const update = useUpdateCourseTemplate();
  const remove = useDeleteCourseTemplate();
  const setForms = useSetTemplateForms();
  const createType = useCreateAppointmentType();
  const updateType = useUpdateAppointmentType();
  const deleteType = useDeleteAppointmentType();

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [hasInitExpanded, setHasInitExpanded] = useState(false);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<{ id?: string; name: string; color: string } | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, CourseTemplate[]>();
    for (const t of templates) {
      const arr = map.get(t.appointment_type_id) ?? [];
      arr.push(t);
      map.set(t.appointment_type_id, arr);
    }
    return map;
  }, [templates]);

  // Expand all type cards by default once types load
  if (!hasInitExpanded && types.length > 0) {
    setExpanded(new Set(types.map((t: any) => t.id)));
    setHasInitExpanded(true);
  }

  const typesCount = types.length;
  const variantsCount = templates.length;

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openNew = (typeId: string) => setEditing(empty(typeId));
  const openEdit = (t: CourseTemplate) =>
    setEditing({
      id: t.id,
      appointment_type_id: t.appointment_type_id,
      name: t.name,
      description: t.description ?? "",
      default_sessions: t.default_sessions,
      default_frequency: t.default_frequency,
      default_session_duration_mins: t.default_session_duration_mins?.toString() ?? "",
      medication_name: t.medication_name ?? "",
      medication_notes: t.medication_notes ?? "",
      is_active: t.is_active,
      form_template_ids: (t.template_forms ?? []).map((f) => f.form_template_id),
    });

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.appointment_type_id) {
      toast.error("Name and treatment type required");
      return;
    }
    const payload = {
      appointment_type_id: editing.appointment_type_id,
      name: editing.name.trim(),
      description: editing.description || null,
      default_sessions: editing.default_sessions,
      default_frequency: editing.default_frequency,
      default_session_duration_mins: editing.default_session_duration_mins
        ? parseInt(editing.default_session_duration_mins) : null,
      medication_name: editing.medication_name || null,
      medication_notes: editing.medication_notes || null,
      is_active: editing.is_active,
    } as any;
    try {
      let templateId = editing.id;
      if (editing.id) {
        await update.mutateAsync({ id: editing.id, data: payload });
      } else {
        const created: any = await create.mutateAsync(payload);
        templateId = created.id;
      }
      if (templateId) {
        await setForms.mutateAsync({ templateId, formTemplateIds: editing.form_template_ids });
      }
      toast.success(editing.id ? "Template updated" : "Template created");
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await remove.mutateAsync(deletingId);
      toast.success("Template deleted");
      setDeletingId(null);
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed");
    }
  };

  const saveType = async () => {
    if (!editingType) return;
    if (!editingType.name.trim()) {
      toast.error("Name required");
      return;
    }
    try {
      if (editingType.id) {
        await updateType.mutateAsync({
          id: editingType.id,
          data: { name: editingType.name.trim(), color: editingType.color } as any,
        });
        toast.success("Treatment type updated");
      } else {
        await createType.mutateAsync({
          name: editingType.name.trim(),
          color: editingType.color,
        });
        toast.success("Treatment type created");
      }
      setEditingType(null);
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    }
  };

  const confirmDeleteType = async () => {
    if (!deletingTypeId) return;
    try {
      await deleteType.mutateAsync(deletingTypeId);
      toast.success("Treatment type deleted");
      setDeletingTypeId(null);
    } catch (e: any) {
      toast.error(e.message ?? "Delete failed (type may be in use)");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-semibold">Treatment Course Templates</h2>
            {!isLoading && typesCount > 0 && (
              <Badge variant="secondary">
                {variantsCount} variant{variantsCount === 1 ? "" : "s"} across {typesCount} type{typesCount === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            Pre-configured "recipes" for each treatment type. When a doctor refers a patient,
            they can pick the specific variant (e.g. Ferinject vs Venofer for Iron). On
            conversion, sessions, frequency and required forms are auto-populated.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setEditingType({ name: "", color: "#3E5B84" })}
            className="gap-1"
          >
            <Plus className="h-4 w-4" /> New Type
          </Button>
          <Button onClick={() => openNew("")} className="gap-1" disabled={typesCount === 0}>
            <Plus className="h-4 w-4" /> New Template
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {types.map((t: any) => {
            const list = grouped.get(t.id) ?? [];
            const isOpen = expanded.has(t.id);
            return (
              <Card key={t.id}>
                <CardHeader
                  className="cursor-pointer flex flex-row items-center justify-between space-y-0 py-3"
                  onClick={() => toggle(t.id)}
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <span
                      className="h-3 w-3 rounded-full inline-block"
                      style={{ backgroundColor: t.color }}
                    />
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    <Badge variant="secondary">{list.length} variant{list.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); openNew(t.id); }}
                    className="gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Variant
                  </Button>
                </CardHeader>
                {isOpen && (
                  <CardContent className="pt-0">
                    {list.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 border border-dashed rounded-md">
                        <p className="text-sm text-muted-foreground">No variants yet for {t.name}.</p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openNew(t.id)}
                          className="gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add first variant
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {list.map((tmpl) => (
                          <div
                            key={tmpl.id}
                            className="flex items-center justify-between gap-3 rounded-md border p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">{tmpl.name}</span>
                                {!tmpl.is_active && <Badge variant="outline">Inactive</Badge>}
                                <Badge variant="secondary" className="text-xs">
                                  {tmpl.default_sessions} session{tmpl.default_sessions === 1 ? "" : "s"} · {FREQUENCY_LABELS[tmpl.default_frequency]}
                                </Badge>
                                {tmpl.template_forms && tmpl.template_forms.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{tmpl.template_forms.length} form{tmpl.template_forms.length === 1 ? "" : "s"}
                                  </Badge>
                                )}
                              </div>
                              {tmpl.medication_notes && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {tmpl.medication_notes}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEdit(tmpl)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setDeletingId(tmpl.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {types.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Create appointment types first to add course templates.
            </p>
          )}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit" : "New"} Course Template</DialogTitle>
            <DialogDescription>
              Define a treatment recipe. These defaults are applied when converting a referral or scheduling sessions.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Treatment Type</Label>
                  <Select
                    value={editing.appointment_type_id}
                    onValueChange={(v) => setEditing({ ...editing, appointment_type_id: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {types.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Variant Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Ferinject 1000mg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Input
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Short description visible to doctors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label>Default Sessions</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.default_sessions}
                    onChange={(e) => setEditing({ ...editing, default_sessions: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Select
                    value={editing.default_frequency}
                    onValueChange={(v: CourseFrequency) => setEditing({ ...editing, default_frequency: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(FREQUENCY_LABELS) as CourseFrequency[]).map((f) => (
                        <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Session duration (min)</Label>
                  <Input
                    type="number"
                    placeholder="optional"
                    value={editing.default_session_duration_mins}
                    onChange={(e) => setEditing({ ...editing, default_session_duration_mins: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Medication Name</Label>
                <Input
                  value={editing.medication_name}
                  onChange={(e) => setEditing({ ...editing, medication_name: e.target.value })}
                  placeholder="e.g. Ferinject"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Medication / Protocol Notes</Label>
                <Textarea
                  rows={3}
                  value={editing.medication_notes}
                  onChange={(e) => setEditing({ ...editing, medication_notes: e.target.value })}
                  placeholder="Dosage, dilution, infusion rate, special considerations..."
                />
              </div>

              <div className="space-y-2">
                <Label>Variant-specific Required Forms</Label>
                <p className="text-xs text-muted-foreground">
                  These forms are added to the patient's onboarding checklist in addition to the type-wide form pack.
                </p>
                <div className="border rounded-md max-h-40 overflow-y-auto p-2 space-y-1">
                  {forms.length === 0 ? (
                    <p className="text-xs text-muted-foreground p-2">No active form templates.</p>
                  ) : (
                    forms.map((f: any) => {
                      const checked = editing.form_template_ids.includes(f.id);
                      return (
                        <label key={f.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              const next = c
                                ? [...editing.form_template_ids, f.id]
                                : editing.form_template_ids.filter((id) => id !== f.id);
                              setEditing({ ...editing, form_template_ids: next });
                            }}
                          />
                          <span className="text-sm">{f.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label>Active</Label>
                  <p className="text-xs text-muted-foreground">Inactive variants are hidden from doctors.</p>
                </div>
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(c) => setEditing({ ...editing, is_active: c })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={create.isPending || update.isPending || setForms.isPending}>
              {create.isPending || update.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              Existing referrals and treatment courses that reference this template will keep working,
              but the link will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
