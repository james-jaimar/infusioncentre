import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import SignatureCanvas from "./SignatureCanvas";
import MedicationTable from "./MedicationTable";
import VitalsTable from "./VitalsTable";
import VitalsRow from "./VitalsRow";
import SubstanceTable from "./SubstanceTable";
import FamilyTable from "./FamilyTable";

export interface FormField {
  field_name: string;
  field_type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  content?: string;
  section?: string;
  columns?: string[];
  rows?: string[];
  fields?: string[];
  max_rows?: number;
  max_length?: number;
}

interface FormRendererProps {
  schema: FormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
  onSignature?: (fieldName: string, data: string) => void;
}

export default function FormRenderer({ schema, values, onChange, readOnly, onSignature }: FormRendererProps) {
  const updateValue = (fieldName: string, value: any) => {
    onChange({ ...values, [fieldName]: value });
  };

  const renderField = (field: FormField) => {
    const val = values[field.field_name];

    switch (field.field_type) {
      case "section_header":
        return (
          <div key={field.field_name} className="pt-6 pb-2 first:pt-0">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">{field.label}</h3>
          </div>
        );

      case "info_text":
        return (
          <div key={field.field_name} className="bg-muted/30 rounded-md p-4 text-sm text-muted-foreground whitespace-pre-line">
            {field.content}
          </div>
        );

      case "text":
        return (
          <div key={field.field_name} className="space-y-1">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30">{val || "-"}</p>
            ) : (
              <Input
                value={val || ""}
                placeholder={field.placeholder}
                maxLength={field.max_length}
                onChange={(e) => updateValue(field.field_name, e.target.value)}
              />
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.field_name} className="space-y-1">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30 whitespace-pre-wrap">{val || "-"}</p>
            ) : (
              <Textarea
                value={val || ""}
                placeholder={field.placeholder}
                onChange={(e) => updateValue(field.field_name, e.target.value)}
              />
            )}
          </div>
        );

      case "number":
        return (
          <div key={field.field_name} className="space-y-1">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30">{val ?? "-"}</p>
            ) : (
              <Input
                type="number"
                value={val ?? ""}
                onChange={(e) => updateValue(field.field_name, e.target.value ? Number(e.target.value) : "")}
              />
            )}
          </div>
        );

      case "date":
        return (
          <div key={field.field_name} className="space-y-1">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30">{val || "-"}</p>
            ) : (
              <Input
                type="date"
                value={val || ""}
                onChange={(e) => updateValue(field.field_name, e.target.value)}
              />
            )}
          </div>
        );

      case "select":
        return (
          <div key={field.field_name} className="space-y-1">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30">{val || "-"}</p>
            ) : (
              <Select value={val || ""} onValueChange={(v) => updateValue(field.field_name, v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        );

      case "radio":
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            {readOnly ? (
              <p className="text-sm border rounded px-3 py-2 bg-muted/30">{val || "-"}</p>
            ) : (
              <RadioGroup value={val || ""} onValueChange={(v) => updateValue(field.field_name, v)} className="flex gap-4">
                {field.options?.map((opt) => (
                  <div key={opt} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt} id={`${field.field_name}_${opt}`} />
                    <Label htmlFor={`${field.field_name}_${opt}`} className="font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.field_name} className="flex items-start space-x-3 py-1">
            {readOnly ? (
              <>
                <div className={`h-4 w-4 rounded-sm border ${val ? "bg-primary" : "bg-muted/30"}`} />
                <Label className="font-normal leading-snug">{field.label}</Label>
              </>
            ) : (
              <>
                <Checkbox
                  checked={!!val}
                  onCheckedChange={(checked) => updateValue(field.field_name, !!checked)}
                />
                <Label className="font-normal leading-snug cursor-pointer">
                  {field.label}{field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              </>
            )}
          </div>
        );

      case "checkbox_group":
        const selectedItems: string[] = val || [];
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {field.options?.map((opt) => (
                <div key={opt} className="flex items-center space-x-2 py-0.5">
                  {readOnly ? (
                    <>
                      <div className={`h-4 w-4 rounded-sm border ${selectedItems.includes(opt) ? "bg-primary" : "bg-muted/30"}`} />
                      <span className="text-sm">{opt}</span>
                    </>
                  ) : (
                    <>
                      <Checkbox
                        checked={selectedItems.includes(opt)}
                        onCheckedChange={(checked) => {
                          const updated = checked
                            ? [...selectedItems, opt]
                            : selectedItems.filter((i) => i !== opt);
                          updateValue(field.field_name, updated);
                        }}
                      />
                      <span className="text-sm">{opt}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case "signature":
        return (
          <SignatureCanvas
            key={field.field_name}
            label={`${field.label}${field.required ? " *" : ""}`}
            value={val}
            onChange={(data) => {
              updateValue(field.field_name, data);
              onSignature?.(field.field_name, data);
            }}
            readOnly={readOnly}
          />
        );

      case "medication_table":
        return (
          <MedicationTable
            key={field.field_name}
            label={field.label}
            columns={field.columns || []}
            maxRows={field.max_rows}
            value={val || []}
            onChange={(data) => updateValue(field.field_name, data)}
            readOnly={readOnly}
          />
        );

      case "vitals_table":
        return (
          <VitalsTable
            key={field.field_name}
            label={field.label}
            columns={field.columns || []}
            maxRows={field.max_rows}
            value={val || []}
            onChange={(data) => updateValue(field.field_name, data)}
            readOnly={readOnly}
          />
        );

      case "vitals_row":
        return (
          <VitalsRow
            key={field.field_name}
            label={field.label}
            fields={field.fields || []}
            value={val || {}}
            onChange={(data) => updateValue(field.field_name, data)}
            readOnly={readOnly}
          />
        );

      case "substance_table":
        return (
          <SubstanceTable
            key={field.field_name}
            label={field.label}
            rows={field.rows || []}
            columns={field.columns || []}
            value={val || {}}
            onChange={(data) => updateValue(field.field_name, data)}
            readOnly={readOnly}
          />
        );

      case "family_table":
        return (
          <FamilyTable
            key={field.field_name}
            label={field.label}
            rows={field.rows || []}
            columns={field.columns || []}
            value={val || {}}
            onChange={(data) => updateValue(field.field_name, data)}
            readOnly={readOnly}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {schema.map(renderField)}
    </div>
  );
}
