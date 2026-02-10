import { useState } from "react";
import { useFormTemplates, useDeleteFormTemplate, FormTemplate } from "@/hooks/useFormTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Trash2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import FormRenderer from "@/components/forms/FormRenderer";

const categoryLabels: Record<string, string> = {
  administrative: "Administrative",
  consent: "Consent",
  medical_questionnaire: "Medical Questionnaire",
  monitoring: "Monitoring",
};

const categoryColors: Record<string, string> = {
  administrative: "bg-blue-100 text-blue-800",
  consent: "bg-green-100 text-green-800",
  medical_questionnaire: "bg-purple-100 text-purple-800",
  monitoring: "bg-orange-100 text-orange-800",
};

export default function AdminFormTemplates() {
  const { data: templates, isLoading } = useFormTemplates();
  const deleteTemplate = useDeleteFormTemplate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  const filtered = templates?.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await deleteTemplate.mutateAsync(id);
      toast({ title: "Template deleted" });
    } catch {
      toast({ title: "Error deleting template", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Form Templates</h1>
          <p className="text-muted-foreground">Manage clinical forms and consent documents.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="administrative">Administrative</SelectItem>
            <SelectItem value="consent">Consent</SelectItem>
            <SelectItem value="medical_questionnaire">Medical Questionnaire</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No templates found</TableCell>
                </TableRow>
              ) : (
                filtered?.map((t) => {
                  const fieldCount = Array.isArray(t.form_schema)
                    ? t.form_schema.filter((f: any) => f.field_type !== "section_header" && f.field_type !== "info_text").length
                    : 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={categoryColors[t.category]}>
                          {categoryLabels[t.category] || t.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{fieldCount} fields</TableCell>
                      <TableCell>v{t.version}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? "default" : "secondary"}>
                          {t.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewTemplate(t);
                              setPreviewValues({});
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(t.id, t.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
            {previewTemplate?.description && (
              <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
            )}
          </DialogHeader>
          {previewTemplate && (
            <FormRenderer
              schema={previewTemplate.form_schema as any[]}
              values={previewValues}
              onChange={setPreviewValues}
              readOnly={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = templates?.filter((t) => t.category === key).length || 0;
          return (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Missing forms note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Forms Still Needed from Gayle</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Monofer consent</li>
            <li>Cosmofer consent</li>
            <li>Ferinject consent</li>
            <li>Biological medical history form</li>
            <li>Polygam long infusion monitoring</li>
            <li>Cosmofer long infusion monitoring</li>
            <li>D.I.S Feedback form</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
