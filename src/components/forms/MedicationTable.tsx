import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface MedicationTableProps {
  label: string;
  columns: string[];
  maxRows?: number;
  value?: Record<string, string>[];
  onChange: (data: Record<string, string>[]) => void;
  readOnly?: boolean;
}

export default function MedicationTable({ label, columns, maxRows = 12, value = [], onChange, readOnly }: MedicationTableProps) {
  const rows = value.length > 0 ? value : [{}];

  const updateCell = (rowIdx: number, col: string, val: string) => {
    const updated = [...rows];
    updated[rowIdx] = { ...updated[rowIdx], [col]: val };
    onChange(updated);
  };

  const addRow = () => {
    if (rows.length < maxRows) onChange([...rows, {}]);
  };

  const removeRow = (idx: number) => {
    if (rows.length > 1) onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider w-10">#</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">{col}</th>
              ))}
              {!readOnly && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 text-muted-foreground text-xs">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1.5">
                    {readOnly ? (
                      <span className="text-sm">{row[col] || "—"}</span>
                    ) : (
                      <Input
                        className="h-9 text-sm rounded-lg border-border/40 bg-background"
                        value={row[col] || ""}
                        placeholder={col}
                        onChange={(e) => updateCell(i, col, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="px-1 py-1.5">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(i)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && rows.length < maxRows && (
        <Button type="button" variant="outline" size="sm" onClick={addRow} className="rounded-lg text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Medication
        </Button>
      )}
    </div>
  );
}
