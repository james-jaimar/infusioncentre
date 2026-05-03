import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";

interface FormTemplate {
  id: string;
  name: string;
  category: string;
  is_active: boolean;
  required_for_treatment_types: string[] | null;
}

export default function FormPackConfigTab() {
  const qc = useQueryClient();
  const { data: types = [] } = useAppointmentTypes(true);
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["form-templates-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_templates")
        .select("id, name, category, is_active, required_for_treatment_types")
        .order("display_order");
      if (error) throw error;
      return data as FormTemplate[];
    },
  });

  // null = universal, string[] = restricted to those type IDs
  const [changes, setChanges] = useState<Record<string, string[] | null>>({});
  const hasChanges = Object.keys(changes).length > 0;

  const getValue = (tmpl: FormTemplate): string[] | null => {
    if (tmpl.id in changes) return changes[tmpl.id];
    return tmpl.required_for_treatment_types ?? null;
  };

  const toggleAssignment = (templateId: string, typeId: string) => {
    const tmpl = templates.find(t => t.id === templateId)!;
    const current = getValue(tmpl);
    if (current === null) return; // universal — disabled
    const next = current.includes(typeId)
      ? current.filter(id => id !== typeId)
      : [...current, typeId];
    setChanges(prev => ({ ...prev, [templateId]: next }));
  };

  const setUniversal = (templateId: string, universal: boolean) => {
    setChanges(prev => ({ ...prev, [templateId]: universal ? null : [] }));
  };

  const handleSave = async () => {
    // Validate: any non-universal entry must have at least one type
    for (const [tid, value] of Object.entries(changes)) {
      if (value !== null && value.length === 0) {
        const tmpl = templates.find(t => t.id === tid);
        toast.error(`"${tmpl?.name ?? "Form"}": pick at least one treatment type or mark as Universal`);
        return;
      }
    }
    try {
      for (const [templateId, value] of Object.entries(changes)) {
        const { error } = await supabase
          .from("form_templates")
          .update({ required_for_treatment_types: value } as never)
          .eq("id", templateId);
        if (error) throw error;
      }
      setChanges({});
      qc.invalidateQueries({ queryKey: ["form-templates-admin"] });
      toast.success("Form pack assignments saved");
    } catch {
      toast.error("Failed to save assignments");
    }
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-8">Loading...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" /> Form Pack Configuration
          </CardTitle>
          <CardDescription>
            Assign which forms are required for each treatment type. Unchecked forms are universal (required for all).
          </CardDescription>
        </div>
        {hasChanges && (
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" /> Save Changes
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Form Template</TableHead>
                <TableHead>Category</TableHead>
                {types.map(type => (
                  <TableHead key={type.id} className="text-center min-w-[100px]">
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-3 w-3 rounded" style={{ backgroundColor: type.color }} />
                      <span className="text-xs">{type.name}</span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center">Universal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.filter(t => t.is_active).map(tmpl => {
                const value = getValue(tmpl);
                const isUniversal = value === null;
                const assignments = value ?? [];
                return (
                  <TableRow key={tmpl.id}>
                    <TableCell className="font-medium">{tmpl.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tmpl.category}</Badge>
                    </TableCell>
                    {types.map(type => (
                      <TableCell key={type.id} className="text-center">
                        <Checkbox
                          checked={isUniversal || assignments.includes(type.id)}
                          disabled={isUniversal}
                          onCheckedChange={() => toggleAssignment(tmpl.id, type.id)}
                        />
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      <div className="flex justify-center" title="Universal forms are required for every treatment type. Turn off to restrict this form to specific types.">
                        <Switch
                          checked={isUniversal}
                          onCheckedChange={(v) => setUniversal(tmpl.id, !!v)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
