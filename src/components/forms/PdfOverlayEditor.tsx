import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Move, GripVertical, Type, CheckSquare, PenTool, Calendar, List, AlignLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { OverlayField } from "./PdfOverlayRenderer";

interface PdfOverlayEditorProps {
  pdfPages: string[];
  overlayFields: OverlayField[];
  onFieldsChange: (fields: OverlayField[]) => void;
}

const FIELD_TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <Type className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  signature: <PenTool className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  select: <List className="h-3.5 w-3.5" />,
  textarea: <AlignLeft className="h-3.5 w-3.5" />,
};

const FIELD_DEFAULTS: Record<string, Partial<OverlayField>> = {
  text: { width: 20, height: 3 },
  checkbox: { width: 2.5, height: 2.5 },
  signature: { width: 25, height: 8 },
  date: { width: 15, height: 3 },
  select: { width: 20, height: 3 },
  textarea: { width: 30, height: 8 },
  radio: { width: 2.5, height: 2.5 },
};

export default function PdfOverlayEditor({ pdfPages, overlayFields, onFieldsChange }: PdfOverlayEditorProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; fieldX: number; fieldY: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fieldsForPage = overlayFields.filter((f) => f.page === activePage);
  const selected = overlayFields.find((f) => f.field_name === selectedField);

  const addField = (type: OverlayField["field_type"]) => {
    const defaults = FIELD_DEFAULTS[type] || { width: 15, height: 3 };
    const name = `field_${Date.now()}`;
    const newField: OverlayField = {
      field_name: name,
      field_type: type,
      label: `New ${type} field`,
      page: activePage,
      x: 10,
      y: 10,
      width: defaults.width!,
      height: defaults.height!,
    };
    onFieldsChange([...overlayFields, newField]);
    setSelectedField(name);
  };

  const updateField = (fieldName: string, updates: Partial<OverlayField>) => {
    onFieldsChange(
      overlayFields.map((f) => (f.field_name === fieldName ? { ...f, ...updates } : f))
    );
  };

  const removeField = (fieldName: string) => {
    onFieldsChange(overlayFields.filter((f) => f.field_name !== fieldName));
    if (selectedField === fieldName) setSelectedField(null);
  };

  const handleMouseDown = (e: React.MouseEvent, fieldName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const field = overlayFields.find((f) => f.field_name === fieldName);
    if (!field) return;
    setDragging(fieldName);
    setSelectedField(fieldName);
    setDragStart({ x: e.clientX, y: e.clientY, fieldX: field.x, fieldY: field.y });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !dragStart || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPct = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaYPct = ((e.clientY - dragStart.y) / rect.height) * 100;
      const newX = Math.max(0, Math.min(95, dragStart.fieldX + deltaXPct));
      const newY = Math.max(0, Math.min(95, dragStart.fieldY + deltaYPct));
      updateField(dragging, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
    },
    [dragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="flex gap-4 h-[80vh]">
      {/* Left: PDF page with overlays */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page tabs */}
        {pdfPages.length > 1 && (
          <div className="flex gap-1 mb-2">
            {pdfPages.map((_, i) => (
              <Button
                key={i}
                variant={activePage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePage(i + 1)}
              >
                Page {i + 1}
              </Button>
            ))}
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto border rounded-lg bg-muted/30">
          <div
            ref={containerRef}
            className="relative w-full"
            onClick={() => setSelectedField(null)}
          >
            <img
              src={pdfPages[activePage - 1]}
              alt={`Page ${activePage}`}
              className="w-full select-none pointer-events-none"
              draggable={false}
            />

            {fieldsForPage.map((field) => (
              <div
                key={field.field_name}
                className={`absolute cursor-move border-2 rounded-sm transition-colors ${
                  selectedField === field.field_name
                    ? "border-primary bg-primary/10 shadow-md"
                    : "border-blue-400/60 bg-blue-100/30 hover:border-primary/80"
                }`}
                style={{
                  left: `${field.x}%`,
                  top: `${field.y}%`,
                  width: `${field.width}%`,
                  height: `${field.height}%`,
                  zIndex: selectedField === field.field_name ? 20 : 10,
                }}
                onMouseDown={(e) => handleMouseDown(e, field.field_name)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedField(field.field_name);
                }}
              >
                <div className="absolute -top-5 left-0 text-[10px] bg-primary text-primary-foreground px-1 rounded-t whitespace-nowrap">
                  {field.label || field.field_name}
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                  {FIELD_TYPE_ICONS[field.field_type]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Field palette & properties */}
      <div className="w-72 flex flex-col gap-3">
        {/* Add field buttons */}
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Add Field</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-3 gap-1.5">
              {(["text", "checkbox", "date", "select", "textarea", "signature"] as const).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="flex flex-col gap-0.5 h-14 text-[10px]"
                  onClick={() => addField(type)}
                >
                  {FIELD_TYPE_ICONS[type]}
                  {type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Field properties */}
        {selected && (
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Field Properties</CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeField(selected.field_name)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Field Name</Label>
                <Input
                  value={selected.field_name}
                  onChange={(e) => {
                    const oldName = selected.field_name;
                    const newName = e.target.value.replace(/\s/g, "_");
                    onFieldsChange(
                      overlayFields.map((f) => (f.field_name === oldName ? { ...f, field_name: newName } : f))
                    );
                    setSelectedField(newName);
                  }}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Label</Label>
                <Input
                  value={selected.label || ""}
                  onChange={(e) => updateField(selected.field_name, { label: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">X (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selected.x}
                    onChange={(e) => updateField(selected.field_name, { x: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Y (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selected.y}
                    onChange={(e) => updateField(selected.field_name, { y: parseFloat(e.target.value) || 0 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Width (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selected.width}
                    onChange={(e) => updateField(selected.field_name, { width: parseFloat(e.target.value) || 1 })}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Height (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={selected.height}
                    onChange={(e) => updateField(selected.field_name, { height: parseFloat(e.target.value) || 1 })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Font Size (px)</Label>
                <Input
                  type="number"
                  value={selected.font_size || 14}
                  onChange={(e) => updateField(selected.field_name, { font_size: parseInt(e.target.value) || 14 })}
                  className="h-8 text-xs"
                />
              </div>
              {(selected.field_type === "select") && (
                <div className="space-y-1">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    value={(selected.options || []).join(", ")}
                    onChange={(e) =>
                      updateField(selected.field_name, {
                        options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="h-8 text-xs"
                    placeholder="Option 1, Option 2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Field list */}
        <Card className="flex-1 min-h-0">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm">Fields ({overlayFields.length})</CardTitle>
          </CardHeader>
          <ScrollArea className="px-4 pb-3 max-h-[300px]">
            <div className="space-y-1">
              {overlayFields.map((field) => (
                <div
                  key={field.field_name}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer transition-colors ${
                    selectedField === field.field_name
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setSelectedField(field.field_name);
                    setActivePage(field.page);
                  }}
                >
                  {FIELD_TYPE_ICONS[field.field_type]}
                  <span className="truncate flex-1">{field.label || field.field_name}</span>
                  <Badge variant="outline" className="text-[9px] px-1">
                    P{field.page}
                  </Badge>
                </div>
              ))}
              {overlayFields.length === 0 && (
                <p className="text-xs text-muted-foreground py-2">No fields yet. Click "Add Field" above to place interactive fields on the PDF.</p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
