import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Eye, ChevronUp, ChevronDown, Trash2, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import FieldPalette from "./FieldPalette";
import FieldEditor from "./FieldEditor";
import FormRenderer, { type FormField } from "./FormRenderer";
import { useCreateFormTemplate, useUpdateFormTemplate, type FormTemplate } from "@/hooks/useFormTemplates";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type FormCategory = Database["public"]["Enums"]["form_category"];

interface FormTemplateEditorProps {
  open: boolean;
  onClose: () => void;
  template?: FormTemplate | null; // null = new template
  initialSchema?: FormField[]; // from AI import
  initialName?: string;
  initialDescription?: string;
  initialCategory?: FormCategory;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  section_header: "Section",
  info_text: "Info Text",
  text: "Text",
  textarea: "Textarea",
  number: "Number",
  date: "Date",
  select: "Select",
  radio: "Radio",
  checkbox: "Checkbox",
  checkbox_group: "Checkboxes",
  signature: "Signature",
  medication_table: "Med Table",
  vitals_table: "Vitals Table",
  vitals_row: "Vitals Row",
  substance_table: "Substance Table",
  family_table: "Family Table",
};

function makeDefaultField(fieldType: string, index: number): FormField {
  const base: FormField = {
    field_name: `field_${Date.now()}_${index}`,
    field_type: fieldType,
    label: fieldType === "section_header" ? "New Section" : fieldType === "info_text" ? "Information" : "New Field",
  };
  if (["select", "radio", "checkbox_group"].includes(fieldType)) {
    base.options = ["Option 1", "Option 2"];
  }
  if (fieldType === "info_text") {
    base.content = "Enter informational text here...";
  }
  if (["medication_table", "vitals_table"].includes(fieldType)) {
    base.columns = ["Column 1", "Column 2"];
    base.max_rows = 5;
  }
  if (fieldType === "vitals_row") {
    base.fields = ["BP Systolic", "BP Diastolic", "Heart Rate", "Temp"];
  }
  if (["substance_table", "family_table"].includes(fieldType)) {
    base.rows = ["Row 1", "Row 2"];
    base.columns = ["Column 1", "Column 2"];
  }
  return base;
}

export default function FormTemplateEditor({
  open,
  onClose,
  template,
  initialSchema,
  initialName,
  initialDescription,
  initialCategory,
}: FormTemplateEditorProps) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FormCategory>("consent");
  const [isActive, setIsActive] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  const createTemplate = useCreateFormTemplate();
  const updateTemplate = useUpdateFormTemplate();
  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  // Initialize from template or AI import
  useEffect(() => {
    if (!open) return;
    if (template) {
      setFields((template.form_schema as FormField[]) || []);
      setName(template.name);
      setDescription(template.description || "");
      setCategory(template.category as FormCategory);
      setIsActive(template.is_active);
    } else {
      setFields(initialSchema || []);
      setName(initialName || "");
      setDescription(initialDescription || "");
      setCategory(initialCategory || "consent");
      setIsActive(true);
    }
    setSelectedIdx(null);
    setShowPreview(false);
    setPreviewValues({});
  }, [open, template, initialSchema, initialName, initialDescription, initialCategory]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const addField = useCallback((fieldType: string) => {
    const newField = makeDefaultField(fieldType, fields.length);
    const insertAt = selectedIdx !== null ? selectedIdx + 1 : fields.length;
    const updated = [...fields];
    updated.splice(insertAt, 0, newField);
    setFields(updated);
    setSelectedIdx(insertAt);
  }, [fields, selectedIdx]);

  const moveField = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const updated = [...fields];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setFields(updated);
    setSelectedIdx(target);
  };

  const deleteField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
    setSelectedIdx(null);
  };

  const updateField = (idx: number, updated: FormField) => {
    const newFields = [...fields];
    newFields[idx] = updated;
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a form name", variant: "destructive" });
      return;
    }
    try {
      if (template?.id) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name,
          description: description || null,
          category,
          form_schema: fields as any,
          is_active: isActive,
          version: template.version + 1,
        });
        toast({ title: "Template updated" });
      } else {
        await createTemplate.mutateAsync({
          name,
          description: description || null,
          category,
          form_schema: fields as any,
          is_active: isActive,
        });
        toast({ title: "Template created" });
      }
      onClose();
    } catch (e: any) {
      toast({ title: "Error saving template", description: e.message, variant: "destructive" });
    }
  };

  if (!open) return null;

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowPreview(false)} className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold">Preview: {name || "Untitled"}</h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-8">
            <FormRenderer schema={fields} values={previewValues} onChange={setPreviewValues} readOnly={false} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 h-14 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm font-semibold truncate">
            {template ? "Edit Template" : "New Template"}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)} className="h-8">
            <Eye className="h-3.5 w-3.5 mr-1.5" /> Preview
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving} className="h-8">
            {isSaving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
            Save
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left palette */}
        <aside className="w-48 border-r border-border/50 overflow-y-auto p-3 flex-shrink-0 hidden md:block">
          <FieldPalette onAdd={addField} />
        </aside>

        {/* Center: field list */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Template metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-card border border-border rounded-xl">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Form Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9" placeholder="e.g. Iron Infusion Consent" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" placeholder="Brief description..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as FormCategory)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consent">Consent</SelectItem>
                    <SelectItem value="medical_questionnaire">Medical Questionnaire</SelectItem>
                    <SelectItem value="administrative">Administrative</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <Label className="text-xs">Active</Label>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-2">
              {fields.length === 0 && (
                <div className="text-center py-16 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                  Click a field type on the left to start building your form
                </div>
              )}
              {fields.map((field, idx) => (
                <div
                  key={`${field.field_name}-${idx}`}
                  onClick={() => setSelectedIdx(idx)}
                  className={cn(
                    "flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all group",
                    selectedIdx === idx
                      ? "border-primary bg-primary/[0.03] ring-1 ring-primary/20"
                      : "border-border/60 hover:border-border"
                  )}
                >
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveField(idx, -1); }} disabled={idx === 0}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <GripVertical className="h-3 w-3 text-muted-foreground mx-auto" />
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); moveField(idx, 1); }} disabled={idx === fields.length - 1}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
                      </span>
                      {field.required && <span className="text-[10px] text-destructive">Required</span>}
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{field.label}</p>
                    {field.field_type === "info_text" && field.content && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{field.content}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteField(idx); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Mobile add field buttons */}
            <div className="md:hidden">
              <FieldPalette onAdd={addField} />
            </div>
          </div>
        </main>

        {/* Right: field editor */}
        <aside className="w-64 border-l border-border/50 overflow-y-auto p-4 flex-shrink-0 hidden lg:block">
          {selectedIdx !== null && fields[selectedIdx] ? (
            <FieldEditor
              field={fields[selectedIdx]}
              onChange={(updated) => updateField(selectedIdx, updated)}
            />
          ) : (
            <p className="text-xs text-muted-foreground text-center pt-8">
              Select a field to edit its properties
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
