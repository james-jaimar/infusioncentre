import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, Loader2, FileText } from "lucide-react";
import FormRenderer, { FormField } from "./FormRenderer";

interface FullScreenFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  schema: FormField[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  readOnly?: boolean;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export default function FullScreenFormDialog({
  open,
  onClose,
  title,
  description,
  schema,
  values,
  onChange,
  readOnly,
  onSubmit,
  isSubmitting,
  submitLabel = "Submit Form",
}: FullScreenFormDialogProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-14 sm:h-16 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary flex-shrink-0 hidden sm:block" />
              <h2 className="text-sm sm:text-base font-semibold text-foreground truncate" style={{ fontSize: '15px', lineHeight: '1.3' }}>
                {title}
              </h2>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onSubmit && !readOnly && (
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              size="sm"
              className="h-9 px-5"
            >
              {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {submitLabel}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hidden sm:flex">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Scrollable form body */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <FormRenderer
            schema={schema}
            values={values}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>

        {/* Bottom submit bar for mobile */}
        {onSubmit && !readOnly && (
          <div className="sm:hidden sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border/50 px-4 py-3">
            <Button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="w-full h-12"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
