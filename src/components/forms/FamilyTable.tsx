import { Input } from "@/components/ui/input";

interface FamilyTableProps {
  label: string;
  rows: string[];
  columns: string[];
  value?: Record<string, Record<string, string>>;
  onChange: (data: Record<string, Record<string, string>>) => void;
  readOnly?: boolean;
}

export default function FamilyTable({ label, rows, columns, value = {}, onChange, readOnly }: FamilyTableProps) {
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
              <th className="px-2 py-1.5 text-left font-medium">Family Member</th>
              {columns.map((col) => (
                <th key={col} className="px-2 py-1.5 text-left font-medium">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t">
                <td className="px-2 py-1 font-medium">{row}</td>
                {columns.map((col) => (
                  <td key={col} className="px-1 py-1">
                    {readOnly ? (
                      <span>{value[row]?.[col] || "-"}</span>
                    ) : (
                      <Input
                        className="h-8 text-sm"
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
