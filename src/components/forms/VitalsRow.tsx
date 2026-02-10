import { Input } from "@/components/ui/input";

interface VitalsRowProps {
  label: string;
  fields: string[];
  value?: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
  readOnly?: boolean;
}

export default function VitalsRow({ label, fields, value = {}, onChange, readOnly }: VitalsRowProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <div className="grid grid-cols-5 gap-2">
        {fields.map((field) => (
          <div key={field}>
            <label className="text-xs text-muted-foreground">{field}</label>
            {readOnly ? (
              <p className="text-sm border rounded px-2 py-1 bg-muted/30">{value[field] || "-"}</p>
            ) : (
              <Input
                className="h-8 text-sm"
                placeholder={field}
                value={value[field] || ""}
                onChange={(e) => onChange({ ...value, [field]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
