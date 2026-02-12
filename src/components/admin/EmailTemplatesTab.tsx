import { useState } from "react";
import {
  useEmailTemplates,
  useUpdateEmailTemplate,
  useCreateEmailTemplate,
  useDeleteEmailTemplate,
  type EmailTemplate,
} from "@/hooks/useEmailTemplates";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Variable, Eye, Code } from "lucide-react";
import { format } from "date-fns";

export default function EmailTemplatesTab() {
  const { data: templates, isLoading } = useEmailTemplates();
  const updateTemplate = useUpdateEmailTemplate();
  const createTemplate = useCreateEmailTemplate();
  const deleteTemplate = useDeleteEmailTemplate();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtmlBody, setFormHtmlBody] = useState("");
  const [formTextBody, setFormTextBody] = useState("");
  const [formVariables, setFormVariables] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);

  const openEdit = (template: EmailTemplate) => {
    setIsNew(false);
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSlug(template.slug);
    setFormDescription(template.description || "");
    setFormSubject(template.subject);
    setFormHtmlBody(template.html_body);
    setFormTextBody(template.text_body || "");
    setFormVariables((template.variables || []).join(", "));
    setFormIsActive(template.is_active);
  };

  const openNew = () => {
    setIsNew(true);
    setEditingTemplate({} as EmailTemplate);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setFormSubject("");
    setFormHtmlBody("");
    setFormTextBody("");
    setFormVariables("");
    setFormIsActive(true);
  };

  const handleSave = async () => {
    const variables = formVariables
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      if (isNew) {
        await createTemplate.mutateAsync({
          name: formName,
          slug: formSlug,
          description: formDescription || null,
          subject: formSubject,
          html_body: formHtmlBody,
          text_body: formTextBody || null,
          variables,
          is_active: formIsActive,
        });
        toast.success("Template created");
      } else {
        await updateTemplate.mutateAsync({
          id: editingTemplate!.id,
          name: formName,
          slug: formSlug,
          description: formDescription || null,
          subject: formSubject,
          html_body: formHtmlBody,
          text_body: formTextBody || null,
          variables,
          is_active: formIsActive,
        });
        toast.success("Template updated");
      }
      setEditingTemplate(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save template");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteTemplate.mutateAsync(deleteId);
      toast.success("Template deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage email templates used by the system. Edit subject, body, and variables.
        </p>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading…</div>
      ) : !templates?.length ? (
        <div className="p-8 text-center text-muted-foreground">No templates found</div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{t.name}</h3>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {t.slug}
                    </Badge>
                    {!t.is_active && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground mb-1">{t.description}</p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">Subject:</span> {t.subject}
                  </p>
                  {t.variables?.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <Variable className="h-3 w-3 text-muted-foreground" />
                      {t.variables.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs font-mono">
                          {"{{" + v + "}}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {format(new Date(t.updated_at), "yyyy/MM/dd HH:mm")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewHtml(t.html_body)}
                    title="Preview"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(t)} title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(t.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Create Template" : "Edit Template"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div>
                <Label>Slug (unique identifier)</Label>
                <Input
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="e.g. appointment_reminder"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What is this template used for?"
              />
            </div>
            <div>
              <Label>Subject Line</Label>
              <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} />
            </div>
            <div>
              <Label>HTML Body</Label>
              <Textarea
                value={formHtmlBody}
                onChange={(e) => setFormHtmlBody(e.target.value)}
                rows={12}
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label>Plain Text Body (optional)</Label>
              <Textarea
                value={formTextBody}
                onChange={(e) => setFormTextBody(e.target.value)}
                rows={4}
              />
            </div>
            <div>
              <Label>Variables (comma-separated)</Label>
              <Input
                value={formVariables}
                onChange={(e) => setFormVariables(e.target.value)}
                placeholder="patient_name, invite_link, expiry_date"
                className="font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              <Label>Active</Label>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateTemplate.isPending || createTemplate.isPending}
              className="w-full"
            >
              {(updateTemplate.isPending || createTemplate.isPending) ? "Saving…" : "Save Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded overflow-auto max-h-[70vh]">
            <iframe
              srcDoc={previewHtml || ""}
              className="w-full min-h-[500px]"
              title="Email preview"
              sandbox=""
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Any edge functions referencing this template will need updating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
