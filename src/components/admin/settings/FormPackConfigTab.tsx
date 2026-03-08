import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

  const [changes, setChanges] = useState<Record<string, string[]>>({});
  const hasChanges = Object.keys(changes).length > 0;

  const getAssignments = (tmpl: FormTemplate) => {
    if (tmpl.id in changes) return changes[tmpl.id];
    return tmpl.required_for_treatment_types || [];
  };

  const toggleAssignment = (templateId: string, typeId: string) => {
    const current = getAssignments(templates.find(t => t.id === templateId)!);
    const next = current.includes(typeId)
      ? current.filter(id => id !== typeId)
      : [...current, typeId];
    setChanges(prev => ({ ...prev, [templateId]: next }));
  };

  const handleSave = async () => {
    try {
      for (const [templateId, typeIds] of Object.entries(changes)) {
        const { error } = await supabase
          .from("form_templates")
          .update({ required_for_treatment_types: typeIds.length > 0 ? typeIds : null } as never)
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
                const assignments = getAssignments(tmpl);
                const isUniversal = assignments.length === 0;
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
                      <Badge variant={isUniversal ? "default" : "secondary"}>
                        {isUniversal ? "Yes" : "No"}
                      </Badge>
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
