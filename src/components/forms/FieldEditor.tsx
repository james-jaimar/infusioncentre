import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { FormField } from "./FormRenderer";
import { PREFILL_KEY_OPTIONS, inferPrefillKey } from "@/lib/prefillFormData";

interface FieldEditorProps {
  field: FormField;
  onChange: (updated: FormField) => void;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  section_header: "Section Header",
  info_text: "Info / Terms Text",
  text: "Text Input",
  textarea: "Text Area",
  number: "Number Input",
  date: "Date Picker",
  select: "Dropdown Select",
  radio: "Radio Group",
  checkbox: "Checkbox",
  checkbox_group: "Checkbox Group",
  signature: "Signature Pad",
  medication_table: "Medication Table",
  vitals_table: "Vitals Table",
  vitals_row: "Vitals Row",
  substance_table: "Substance Table",
  family_table: "Family History Table",
};

const hasOptions = (type: string) =>
  ["select", "radio", "checkbox_group"].includes(type);

const hasContent = (type: string) => type === "info_text";

const hasPlaceholder = (type: string) =>
  ["text", "textarea", "number"].includes(type);

const hasRequired = (type: string) =>
  !["section_header", "info_text"].includes(type);

const hasColumns = (type: string) =>
  ["medication_table", "vitals_table", "substance_table", "family_table"].includes(type);

const hasRows = (type: string) =>
  ["substance_table", "family_table"].includes(type);

const hasFields = (type: string) => type === "vitals_row";

export default function FieldEditor({ field, onChange }: FieldEditorProps) {
  const update = (patch: Partial<FormField>) => onChange({ ...field, ...patch });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Edit Field
        </p>
        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
          {FIELD_TYPE_LABELS[field.field_type] || field.field_type}
        </span>
      </div>

      {/* Field name */}
      <div className="space-y-1">
        <Label className="text-xs">Field Name (ID)</Label>
        <Input
          value={field.field_name}
          onChange={(e) => update({ field_name: e.target.value })}
          className="h-8 text-xs"
          placeholder="e.g. patient_name"
        />
      </div>

      {/* Label */}
      <div className="space-y-1">
        <Label className="text-xs">Label</Label>
        <Input
          value={field.label}
          onChange={(e) => update({ label: e.target.value })}
          className="h-8 text-xs"
        />
      </div>

      {/* Content for info_text */}
      {hasContent(field.field_type) && (
        <div className="space-y-1">
          <Label className="text-xs">Content Text</Label>
          <Textarea
            value={field.content || ""}
            onChange={(e) => update({ content: e.target.value })}
            className="text-xs min-h-[200px]"
            placeholder="Paste the full terms, side effects, contraindications text here..."
          />
        </div>
      )}

      {/* Placeholder */}
      {hasPlaceholder(field.field_type) && (
        <div className="space-y-1">
          <Label className="text-xs">Placeholder</Label>
          <Input
            value={field.placeholder || ""}
            onChange={(e) => update({ placeholder: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Required */}
      {hasRequired(field.field_type) && (
        <label className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={!!field.required}
            onCheckedChange={(v) => update({ required: !!v })}
          />
          Required field
        </label>
      )}

      {/* Options */}
      {hasOptions(field.field_type) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Options</Label>
          {(field.options || []).map((opt, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...(field.options || [])];
                  newOpts[i] = e.target.value;
                  update({ options: newOpts });
                }}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  const newOpts = (field.options || []).filter((_, j) => j !== i);
                  update({ options: newOpts });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => update({ options: [...(field.options || []), "New option"] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Option
          </Button>
        </div>
      )}

      {/* Columns */}
      {hasColumns(field.field_type) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Columns</Label>
          {(field.columns || []).map((col, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={col}
                onChange={(e) => {
                  const newCols = [...(field.columns || [])];
                  newCols[i] = e.target.value;
                  update({ columns: newCols });
                }}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => update({ columns: (field.columns || []).filter((_, j) => j !== i) })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => update({ columns: [...(field.columns || []), "Column"] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Column
          </Button>
        </div>
      )}

      {/* Rows */}
      {hasRows(field.field_type) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Rows</Label>
          {(field.rows || []).map((row, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={row}
                onChange={(e) => {
                  const newRows = [...(field.rows || [])];
                  newRows[i] = e.target.value;
                  update({ rows: newRows });
                }}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => update({ rows: (field.rows || []).filter((_, j) => j !== i) })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => update({ rows: [...(field.rows || []), "Row"] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Row
          </Button>
        </div>
      )}

      {/* Fields for vitals_row */}
      {hasFields(field.field_type) && (
        <div className="space-y-1.5">
          <Label className="text-xs">Fields</Label>
          {(field.fields || []).map((f, i) => (
            <div key={i} className="flex gap-1">
              <Input
                value={f}
                onChange={(e) => {
                  const newFields = [...(field.fields || [])];
                  newFields[i] = e.target.value;
                  update({ fields: newFields });
                }}
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => update({ fields: (field.fields || []).filter((_, j) => j !== i) })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs w-full"
            onClick={() => update({ fields: [...(field.fields || []), "field"] })}
          >
            <Plus className="h-3 w-3 mr-1" /> Add Field
          </Button>
        </div>
      )}

      {/* Max rows */}
      {["medication_table", "vitals_table"].includes(field.field_type) && (
        <div className="space-y-1">
          <Label className="text-xs">Max Rows</Label>
          <Input
            type="number"
            value={field.max_rows ?? ""}
            onChange={(e) => update({ max_rows: e.target.value ? Number(e.target.value) : undefined })}
            className="h-8 text-xs"
          />
        </div>
      )}

      {/* Prefill Key */}
      {hasRequired(field.field_type) && (
        <div className="space-y-1">
          <Label className="text-xs">Auto-fill from Patient Data</Label>
          <Select
            value={field.prefill_key || "__none__"}
            onValueChange={(v) => update({ prefill_key: v === "__none__" ? undefined : v })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {PREFILL_KEY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(() => {
            const suggested = !field.prefill_key ? inferPrefillKey(field) : null;
            const suggestedLabel = suggested ? PREFILL_KEY_OPTIONS.find(o => o.value === suggested)?.label : null;
            if (suggested && suggestedLabel) {
              return (
                <p className="text-[10px] text-muted-foreground">
                  Suggested: <button type="button" className="text-primary underline" onClick={() => update({ prefill_key: suggested })}>
                    {suggestedLabel}
                  </button> — auto-applied at render time even if you leave this as None.
                </p>
              );
            }
            return (
              <p className="text-[10px] text-muted-foreground">
                When set, this field will auto-populate from the patient's record.
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}
