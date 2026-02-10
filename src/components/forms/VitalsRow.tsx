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
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {fields.map((field) => (
          <div key={field} className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">{field}</label>
            {readOnly ? (
              <p className="text-sm px-3 py-2 bg-muted/40 rounded-lg border border-border/50">{value[field] || "—"}</p>
            ) : (
              <Input
                className="h-10 text-sm rounded-lg border-border/40 bg-background"
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
