import { Button } from "@/components/ui/button";
import {
  Heading1, AlignLeft, Type, TextCursorInput, Hash, Calendar,
  ListOrdered, CircleDot, CheckSquare, CheckCheck, PenTool,
  Table, Activity, Heart
} from "lucide-react";

interface FieldPaletteProps {
  onAdd: (fieldType: string) => void;
}

const fieldTypes = [
  { type: "section_header", label: "Section Header", icon: Heading1 },
  { type: "info_text", label: "Info / Terms Text", icon: AlignLeft },
  { type: "text", label: "Text Input", icon: Type },
  { type: "textarea", label: "Text Area", icon: TextCursorInput },
  { type: "number", label: "Number", icon: Hash },
  { type: "date", label: "Date", icon: Calendar },
  { type: "select", label: "Dropdown", icon: ListOrdered },
  { type: "radio", label: "Radio Group", icon: CircleDot },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare },
  { type: "checkbox_group", label: "Checkbox Group", icon: CheckCheck },
  { type: "signature", label: "Signature", icon: PenTool },
  { type: "medication_table", label: "Medication Table", icon: Table },
  { type: "vitals_row", label: "Vitals Row", icon: Activity },
  { type: "family_table", label: "Family History", icon: Heart },
];

export default function FieldPalette({ onAdd }: FieldPaletteProps) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">
        Add Field
      </p>
      {fieldTypes.map(({ type, label, icon: Icon }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-xs font-normal"
          onClick={() => onAdd(type)}
        >
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          {label}
        </Button>
      ))}
    </div>
  );
}
