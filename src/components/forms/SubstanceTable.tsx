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

const isYesNoColumn = (col: string) =>
  /^(yes\/?no?|y\/?n|currently still use)$/i.test(col.trim());

export default function SubstanceTable({ label, rows, columns, value = {}, onChange, readOnly }: SubstanceTableProps) {
  const updateCell = (row: string, col: string, val: string) => {
    const updated = { ...value, [row]: { ...(value[row] || {}), [col]: val } };
    onChange(updated);
  };

  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider min-w-[160px]">Drug Category</th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 text-sm font-medium text-foreground">{row}</td>
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1.5">
                    {readOnly ? (
                      <span className="text-sm">{value[row]?.[col] || "—"}</span>
                    ) : isYesNoColumn(col) ? (
                      <Select value={value[row]?.[col] || ""} onValueChange={(v) => updateCell(row, col, v)}>
                        <SelectTrigger className="h-9 text-sm min-w-[70px] rounded-lg border-border/40">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <textarea
                        className="w-full min-h-[36px] text-sm min-w-[80px] rounded-lg border border-border/40 bg-background px-3 py-2 resize-none overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={value[row]?.[col] || ""}
                        rows={1}
                        onChange={(e) => {
                          updateCell(row, col, e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onFocus={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
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
