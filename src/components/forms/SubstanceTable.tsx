import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubstanceTableProps {
  label: string;
  rows: string[];
  columns: string[];
  value?: Record<string, Record<string, string>>;
  onChange: (data: Record<string, Record<string, string>>) => void;
  readOnly?: boolean;
}

export default function SubstanceTable({ label, rows, columns, value = {}, onChange, readOnly }: SubstanceTableProps) {
  const updateCell = (row: string, col: string, val: string) => {
    const updated = { ...value, [row]: { ...(value[row] || {}), [col]: val } };
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-2 py-1.5 text-left font-medium min-w-[180px]">Drug Category</th>
              {columns.map((col) => (
                <th key={col} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t">
                <td className="px-2 py-1 text-sm font-medium">{row}</td>
                {columns.map((col) => (
                  <td key={col} className="px-1 py-1">
                    {readOnly ? (
                      <span className="text-sm">{value[row]?.[col] || "-"}</span>
                    ) : col === "Currently still use" ? (
                      <Select
                        value={value[row]?.[col] || ""}
                        onValueChange={(v) => updateCell(row, col, v)}
                      >
                        <SelectTrigger className="h-8 text-sm min-w-[70px]">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="h-8 text-sm min-w-[80px]"
                        value={value[row]?.[col] || ""}
                        onChange={(e) => updateCell(row, col, e.target.value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
