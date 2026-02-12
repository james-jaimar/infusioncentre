import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { FormField } from "./FormRenderer";
import type { Database } from "@/integrations/supabase/types";

type FormCategory = Database["public"]["Enums"]["form_category"];

interface AIImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: (data: {
    schema: FormField[];
    name: string;
    description: string;
    category: FormCategory;
  }) => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function AIImportDialog({ open, onClose, onImported }: AIImportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);

    try {
      // Read file as base64
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      const { data, error: fnError } = await supabase.functions.invoke(
        "extract-form-template",
        {
          body: {
            fileBase64: base64,
            fileName: selectedFile.name,
            mimeType: selectedFile.type,
          },
        }
      );

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      if (!data?.form_schema || !Array.isArray(data.form_schema)) {
        throw new Error("AI did not return a valid form structure. Please try again.");
      }

      toast({ title: `Extracted ${data.form_schema.length} fields from "${selectedFile.name}"` });

      onImported({
        schema: data.form_schema,
        name: data.form_name || selectedFile.name.replace(/\.[^.]+$/, ""),
        description: data.form_description || "",
        category: data.form_category || "consent",
      });

      setSelectedFile(null);
      onClose();
    } catch (e: any) {
      console.error("AI import error:", e);
      setError(e.message || "Failed to process the document. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedFile(null);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Form from Document</DialogTitle>
          <DialogDescription>
            Upload a PDF, Word document, or scanned image. AI will extract the form structure automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 hover:bg-primary/[0.02] transition-colors cursor-pointer"
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to select a file</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, image (max 10MB)</p>
            </button>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
              <FileText className="h-8 w-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </p>
              </div>
              {!isProcessing && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)} className="text-xs">
                  Change
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!selectedFile || isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isProcessing ? "Processing..." : "Extract Form"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
