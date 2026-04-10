import { useState, useMemo } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import SignatureCanvas from "./SignatureCanvas";
import MedicationTable from "./MedicationTable";
import VitalsTable from "./VitalsTable";
import VitalsRow from "./VitalsRow";
import SubstanceTable from "./SubstanceTable";
import FamilyTable from "./FamilyTable";
import { cn } from "@/lib/utils";

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
  prefill_key?: string;
  layout_hint?: "inline" | "full";
  conditional_on?: { field: string; value: string };
  group?: string;
  density?: "compact" | "normal";
}

interface FormRendererProps {
  schema: FormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
  onSignature?: (fieldName: string, data: string) => void;
  /** Set of field_name values that failed validation — highlights them red */
  errorFields?: Set<string>;
  /** Called when the user interacts with an errored field to clear its error */
  onClearError?: (fieldName: string) => void;
}

interface Section {
  title: string;
  fields: FormField[];
}

export default function FormRenderer({ schema, values, onChange, readOnly, onSignature, errorFields, onClearError }: FormRendererProps) {
  const updateValue = (fieldName: string, value: any) => {
    onChange({ ...values, [fieldName]: value });
    onClearError?.(fieldName);
  };

  // Group fields into sections
  const sections = useMemo(() => {
    const result: Section[] = [];
    let currentSection: Section = { title: "", fields: [] };

    schema.forEach((field) => {
      if (field.field_type === "section_header") {
        if (currentSection.fields.length > 0 || currentSection.title) {
          result.push(currentSection);
        }
        currentSection = { title: field.label, fields: [] };
      } else {
        currentSection.fields.push(field);
      }
    });
    if (currentSection.fields.length > 0 || currentSection.title) {
      result.push(currentSection);
    }
    return result;
  }, [schema]);

  // Determine which fields are "short" (can sit side-by-side)
  const isShortField = (field: FormField) => {
    return ["text", "number", "date", "select"].includes(field.field_type);
  };

  // Check if a field should be visible based on conditional_on
  const isFieldVisible = (field: FormField) => {
    if (!field.conditional_on) return true;
    const parentValue = values[field.conditional_on.field];
    return parentValue === field.conditional_on.value;
  };

  // Detect if a set of fields is checkbox-dense (>70% standalone checkboxes)
  const isCompactCheckboxSection = (fields: FormField[]) => {
    const visible = fields.filter(f => isFieldVisible(f));
    const checkboxCount = visible.filter(f =>
      f.field_type === "checkbox" && !f.conditional_on
    ).length;
    return visible.length >= 4 && checkboxCount / visible.length >= 0.7;
  };

  // Render a compact checkbox as a minimal label (no border card)
  const renderCompactCheckbox = (field: FormField) => {
    const val = values[field.field_name];
    return (
      <label
        key={`compact-${field.field_name}`}
        className="flex items-center gap-2 py-1 text-sm cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
      >
        {readOnly ? (
          <div className={cn("h-3.5 w-3.5 rounded-sm border flex-shrink-0", val ? "bg-primary border-primary" : "bg-muted/30")} />
        ) : (
          <Checkbox
            checked={!!val}
            onCheckedChange={(checked) => updateValue(field.field_name, !!checked)}
            className="h-3.5 w-3.5"
          />
        )}
        <span className="leading-snug">{field.label}</span>
      </label>
    );
  };

  // Split fields into consecutive groups sharing the same `group` value
  const renderGroupedFields = (fields: FormField[], forceCompact?: boolean) => {
    const chunks: { group: string | undefined; fields: FormField[] }[] = [];

    fields.forEach((field) => {
      const g = field.group;
      const last = chunks[chunks.length - 1];
      if (last && last.group === g) {
        last.fields.push(field);
      } else {
        chunks.push({ group: g, fields: [field] });
      }
    });

    return chunks.map((chunk, idx) => {
      const compact = forceCompact || isCompactCheckboxSection(chunk.fields);

      if (chunk.group) {
        return (
          <div
            key={`group-${chunk.group}-${idx}`}
            className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-4"
          >
            {compact ? renderCompactFieldGroup(chunk.fields) : renderFieldGroup(chunk.fields)}
          </div>
        );
      }
      return (
        <div key={`chunk-${idx}`}>
          {compact ? renderCompactFieldGroup(chunk.fields) : renderFieldGroup(chunk.fields)}
        </div>
      );
    });
  };

  // Render a compact group: checkboxes in a tight grid, non-checkboxes normally
  const renderCompactFieldGroup = (fields: FormField[]) => {
    const elements: React.ReactNode[] = [];
    let compactBatch: FormField[] = [];

    const flushBatch = () => {
      if (compactBatch.length > 0) {
        elements.push(
          <div key={`compact-grid-${compactBatch[0].field_name}`} className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5">
            {compactBatch.map(f => renderCompactCheckbox(f))}
          </div>
        );
        compactBatch = [];
      }
    };

    fields.forEach(field => {
      if (!isFieldVisible(field)) return;

      if (field.field_type === "checkbox" && !field.conditional_on) {
        compactBatch.push(field);
      } else {
        flushBatch();
        // Conditional detail fields render inline after the grid
        elements.push(
          <div key={`compact-other-${field.field_name}`}>
            {renderField(field)}
          </div>
        );
      }
    });
    flushBatch();
    return elements;
  };

  // Group consecutive short fields into pairs for 2-col layout
  const renderFieldGroup = (fields: FormField[]) => {
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < fields.length) {
      const field = fields[i];

      if (!isFieldVisible(field)) {
        i += 1;
        continue;
      }

      const next = fields[i + 1];
      const nextVisible = next && isFieldVisible(next);

      const shouldInline = (f: FormField) => f.layout_hint === "inline" || isShortField(f);
      const forceFullWidth = field.layout_hint === "full";

      if (!forceFullWidth && shouldInline(field) && nextVisible && next && shouldInline(next)) {
        elements.push(
          <div key={`pair-${field.field_name}`} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {renderField(field)}
            {renderField(next)}
          </div>
        );
        i += 2;
      } else {
        elements.push(
          <div key={`single-${field.field_name}`}>
            {renderField(field)}
          </div>
        );
        i += 1;
      }
    }

    return elements;
  };

  const renderField = (field: FormField) => {
    const val = values[field.field_name];
    const hasError = errorFields?.has(field.field_name);
    const fieldLabel = (
      <Label className={cn("text-sm font-medium", hasError ? "text-destructive" : "text-foreground")}>
        {field.label}
        {field.required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
    );
    const errorMsg = hasError ? (
      <p className="text-xs text-destructive mt-1">This field is required</p>
    ) : null;
    const errorInputClass = hasError ? "border-destructive" : "";

    switch (field.field_type) {
      case "info_text": {
        // Interpolate {{field_name}} tokens with current form values
        const interpolatedContent = (field.content || "").replace(
          /\{\{(\w+)\}\}/g,
          (_match, fieldName) => {
            const fieldValue = values[fieldName];
            if (fieldValue) {
              // Format date values nicely
              if (/^\d{4}-\d{2}-\d{2}$/.test(fieldValue)) {
                const d = new Date(fieldValue + "T00:00:00");
                return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
              }
              return String(fieldValue);
            }
            return "________";
          }
        );
        return (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] border-l-[3px] border-l-primary/40 px-5 py-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {interpolatedContent}
          </div>
        );
      }

      case "text":
        return (
          <div id={`field-${field.field_name}`} className="space-y-1.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50 min-h-[40px]">{val || "—"}</p>
            ) : (
              <Input
                value={val || ""}
                placeholder={field.placeholder}
                maxLength={field.max_length}
                onChange={(e) => updateValue(field.field_name, e.target.value)}
                className={cn("h-11 rounded-lg border-border bg-background focus-visible:ring-primary/30 transition-shadow", errorInputClass)}
              />
            )}
            {errorMsg}
          </div>
        );

      case "textarea":
        return (
          <div className="space-y-1.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50 whitespace-pre-wrap min-h-[60px]">{val || "—"}</p>
            ) : (
              <Textarea
                value={val || ""}
                placeholder={field.placeholder}
                onChange={(e) => updateValue(field.field_name, e.target.value)}
                className="min-h-[100px] rounded-lg border-border bg-background focus-visible:ring-primary/30 transition-shadow resize-y"
              />
            )}
          </div>
        );

      case "number":
        return (
          <div className="space-y-1.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50 min-h-[40px]">{val ?? "—"}</p>
            ) : (
              <Input
                type="number"
                value={val ?? ""}
                onChange={(e) => updateValue(field.field_name, e.target.value ? Number(e.target.value) : "")}
                className="h-11 rounded-lg border-border bg-background focus-visible:ring-primary/30 transition-shadow"
              />
            )}
          </div>
        );

      case "date": {
        const dateVal = val ? parse(val, "yyyy-MM-dd", new Date()) : undefined;
        const isValidDate = dateVal && !isNaN(dateVal.getTime());
        return (
          <div className="space-y-1.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50 min-h-[40px]">
                {isValidDate ? format(dateVal, "dd/MM/yyyy") : val || "—"}
              </p>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-normal rounded-lg border-border",
                      !val && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isValidDate ? format(dateVal, "dd/MM/yyyy") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear() + 5}
                    selected={isValidDate ? dateVal : undefined}
                    onSelect={(d) => updateValue(field.field_name, d ? format(d, "yyyy-MM-dd") : "")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      }

      case "select":
        return (
          <div className="space-y-1.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50 min-h-[40px]">{val || "—"}</p>
            ) : (
              <Select value={val || ""} onValueChange={(v) => updateValue(field.field_name, v)}>
                <SelectTrigger className="h-11 rounded-lg border-border">
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
          <div className="space-y-2.5">
            {fieldLabel}
            {readOnly ? (
              <p className="text-sm px-3 py-2.5 bg-muted/40 rounded-lg border border-border/50">{val || "—"}</p>
            ) : (
              <RadioGroup value={val || ""} onValueChange={(v) => updateValue(field.field_name, v)} className="flex flex-wrap gap-1">
                {field.options?.map((opt) => (
                  <label
                    key={opt}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                      val === opt
                        ? "border-primary bg-primary/5 text-primary font-medium shadow-sm"
                        : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <RadioGroupItem value={opt} id={`${field.field_name}_${opt}`} className="sr-only" />
                    {opt}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        );

      case "checkbox":
        return (
          <label className={cn(
            "flex items-start gap-3 py-3 px-4 rounded-lg border transition-all cursor-pointer",
            val
              ? "border-primary/30 bg-primary/[0.03]"
              : "border-border/40 hover:border-border/60"
          )}>
            {readOnly ? (
              <div className={cn("mt-0.5 h-4 w-4 rounded border flex-shrink-0", val ? "bg-primary border-primary" : "bg-muted/30")} />
            ) : (
              <Checkbox
                checked={!!val}
                onCheckedChange={(checked) => updateValue(field.field_name, !!checked)}
                className="mt-0.5"
              />
            )}
            <span className="text-sm leading-snug">
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </span>
          </label>
        );

      case "checkbox_group":
        const selectedItems: string[] = val || [];
        return (
          <div className="space-y-2.5">
            {fieldLabel}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {field.options?.map((opt) => (
                <label
                  key={opt}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                    selectedItems.includes(opt)
                      ? "border-primary/30 bg-primary/[0.03] text-foreground"
                      : "border-border/40 hover:border-border/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {readOnly ? (
                    <div className={cn("h-3.5 w-3.5 rounded-sm border flex-shrink-0", selectedItems.includes(opt) ? "bg-primary border-primary" : "bg-muted/30")} />
                  ) : (
                    <Checkbox
                      checked={selectedItems.includes(opt)}
                      onCheckedChange={(checked) => {
                        const updated = checked
                          ? [...selectedItems, opt]
                          : selectedItems.filter((i) => i !== opt);
                        updateValue(field.field_name, updated);
                      }}
                    />
                  )}
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case "signature":
        return (
          <SignatureCanvas
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

  // Calculate progress
  const fillableFields = schema.filter(f => f.required && f.field_type !== "section_header" && f.field_type !== "info_text");
  const filledCount = fillableFields.filter(f => {
    const v = values[f.field_name];
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== "";
  }).length;
  const progress = fillableFields.length > 0 ? Math.round((filledCount / fillableFields.length) * 100) : 100;

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
      {/* Sidebar nav for sections */}
      {sections.length > 1 && (
        <aside className="hidden lg:block lg:w-48 xl:w-56 flex-shrink-0">
          <div className="sticky top-6 space-y-1">
            {/* Progress ring */}
            <div className="flex items-center gap-3 px-3 py-3 mb-3">
              <div className="relative h-10 w-10 flex-shrink-0">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2.5"
                    strokeDasharray={`${progress}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-primary">{progress}%</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Progress</p>
                <p className="text-[10px] text-muted-foreground">{filledCount}/{fillableFields.length} required</p>
              </div>
            </div>

            {sections.map((section, idx) => {
              const sectionFillable = section.fields.filter(f => f.required);
              const sectionFilled = sectionFillable.filter(f => {
                const v = values[f.field_name];
                if (Array.isArray(v)) return v.length > 0;
                return v !== undefined && v !== null && v !== "";
              });
              const done = sectionFillable.length > 0 && sectionFilled.length === sectionFillable.length;

              return (
                <button
                  key={idx}
                  onClick={() => {
                    document.getElementById(`form-section-${idx}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-2",
                    "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full flex-shrink-0",
                    done ? "bg-green-500" : "bg-border"
                  )} />
                  <span className="truncate">{section.title || `Section ${idx + 1}`}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Main form content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Mobile progress bar */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{filledCount} of {fillableFields.length} required fields</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {sections.map((section, idx) => {
          const compact = isCompactCheckboxSection(section.fields);
          return (
            <div
              key={idx}
              id={`form-section-${idx}`}
              className="scroll-mt-6"
            >
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                {section.title && (
                  <div className="px-5 sm:px-7 py-4 bg-primary/[0.08] border-b border-primary/20 border-l-[3px] border-l-primary">
                    <h3 className="text-base font-semibold text-primary tracking-tight" style={{ fontSize: '16px', lineHeight: '1.4' }}>
                      {section.title}
                    </h3>
                  </div>
                )}
                <div className={cn(
                  "space-y-5",
                  compact
                    ? "px-4 sm:px-5 py-3 sm:py-4"
                    : "px-5 sm:px-7 py-5 sm:py-6"
                )}>
                  {renderGroupedFields(section.fields, compact)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
