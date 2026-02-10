import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface VitalsTableProps {
  label: string;
  columns: string[];
  maxRows?: number;
  value?: Record<string, string>[];
  onChange: (data: Record<string, string>[]) => void;
  readOnly?: boolean;
}

export default function VitalsTable({ label, columns, maxRows = 8, value = [], onChange, readOnly }: VitalsTableProps) {
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
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((col) => (
                <th key={col} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{col}</th>
              ))}
              {!readOnly && <th className="w-8" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t">
                {columns.map((col) => (
                  <td key={col} className="px-1 py-1">
                    {readOnly ? (
                      <span className="text-sm">{row[col] || "-"}</span>
                    ) : (
                      <Input
                        className="h-8 text-sm min-w-[80px]"
                        value={row[col] || ""}
                        onChange={(e) => updateCell(i, col, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                {!readOnly && (
                  <td className="px-1 py-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(i)} className="h-8 w-8 p-0">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && rows.length < maxRows && (
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          <Plus className="h-3 w-3 mr-1" /> Add Row
        </Button>
      )}
    </div>
  );
}
