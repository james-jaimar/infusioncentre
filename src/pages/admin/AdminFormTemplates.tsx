import { useState, useEffect } from "react";
import { useFormTemplates, useDeleteFormTemplate, FormTemplate } from "@/hooks/useFormTemplates";
import { useAppointmentTypes } from "@/hooks/useAppointmentTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Eye, Trash2, Pencil, Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import FullScreenFormDialog from "@/components/forms/FullScreenFormDialog";
import FormTemplateEditor from "@/components/forms/FormTemplateEditor";
import AIImportDialog from "@/components/forms/AIImportDialog";
import type { FormField } from "@/components/forms/FormRenderer";
import type { Database } from "@/integrations/supabase/types";

type FormCategory = Database["public"]["Enums"]["form_category"];

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
  const { data: appointmentTypes } = useAppointmentTypes();
  const deleteTemplate = useDeleteFormTemplate();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Preview dialog state
  const [previewTemplate, setPreviewTemplate] = useState<FormTemplate | null>(null);
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FormTemplate | null>(null);
  const [importedSchema, setImportedSchema] = useState<FormField[] | undefined>();
  const [importedName, setImportedName] = useState<string | undefined>();
  const [importedDescription, setImportedDescription] = useState<string | undefined>();
  const [importedCategory, setImportedCategory] = useState<FormCategory | undefined>();

  // AI import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [reimportTemplate, setReimportTemplate] = useState<FormTemplate | null>(null);

  const SESSION_KEY = "pendingFormImport";

  // Restore pending import from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setImportedSchema(data.schema);
        if (data.templateId && templates) {
          // Re-import: find the existing template
          const tpl = templates.find((t) => t.id === data.templateId);
          if (tpl) setEditingTemplate(tpl);
        } else {
          setEditingTemplate(null);
          setImportedName(data.name);
          setImportedDescription(data.description);
          setImportedCategory(data.category);
        }
        setEditorOpen(true);
      }
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [templates]);

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

  const openEditor = (template?: FormTemplate) => {
    setEditingTemplate(template || null);
    setImportedSchema(undefined);
    setImportedName(undefined);
    setImportedDescription(undefined);
    setImportedCategory(undefined);
    setEditorOpen(true);
  };

  const persistImport = (payload: Record<string, unknown>) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload)); } catch {}
  };

  const handleAIImport = (data: { schema: FormField[]; name: string; description: string; category: FormCategory }) => {
    if (reimportTemplate) {
      setEditingTemplate(reimportTemplate);
      setImportedSchema(data.schema);
      setImportedName(undefined);
      setImportedDescription(undefined);
      setImportedCategory(undefined);
      setReimportTemplate(null);
      // Persist re-imports too (use template id so we can restore)
      persistImport({ schema: data.schema, templateId: reimportTemplate.id });
    } else {
      setEditingTemplate(null);
      setImportedSchema(data.schema);
      setImportedName(data.name);
      setImportedDescription(data.description);
      setImportedCategory(data.category);
      persistImport({ schema: data.schema, name: data.name, description: data.description, category: data.category });
    }
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Form Templates</h1>
          <p className="text-muted-foreground">Manage clinical forms and consent documents.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" /> Import from Document
          </Button>
          <Button onClick={() => openEditor()}>
            <Plus className="h-4 w-4 mr-2" /> New Template
          </Button>
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
                <TableHead>Assigned To</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No templates found</TableCell>
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
                      <TableCell>
                        {!t.required_for_treatment_types ? (
                          <Badge variant="outline" className="text-[10px]">All Patients</Badge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {t.required_for_treatment_types.map((typeId: string) => {
                              const at = appointmentTypes?.find((a) => a.id === typeId);
                              return (
                                <Badge key={typeId} variant="outline" className="text-[10px]">
                                  {at?.name || "Unknown"}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
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
                          <Button variant="ghost" size="sm" onClick={() => openEditor(t)} title="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReimportTemplate(t);
                              setImportDialogOpen(true);
                            }}
                            title="Re-import from document"
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewTemplate(t);
                              setPreviewValues({});
                            }}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id, t.name)} title="Delete">
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

      {/* Full-screen Preview */}
      <FullScreenFormDialog
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.name || ""}
        description={previewTemplate?.description || undefined}
        schema={(previewTemplate?.form_schema as FormField[]) || []}
        values={previewValues}
        onChange={setPreviewValues}
        readOnly={false}
      />

      {/* Editor */}
      <FormTemplateEditor
        open={editorOpen}
        onClose={handleEditorClose}
        template={editingTemplate}
        initialSchema={importedSchema}
        initialName={importedName}
        initialDescription={importedDescription}
        initialCategory={importedCategory}
      />

      {/* AI Import Dialog */}
      <AIImportDialog
        open={importDialogOpen}
        onClose={() => {
          setImportDialogOpen(false);
          setReimportTemplate(null);
        }}
        onImported={handleAIImport}
      />
    </div>
  );
}
