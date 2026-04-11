import { useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, Loader2, FileText, Printer } from "lucide-react";
import FormRenderer, { FormField } from "./FormRenderer";
import PdfOverlayRenderer, { OverlayField } from "./PdfOverlayRenderer";
import { facsimileRegistry } from "./facsimile/registry";
import { openPrintableForm } from "./PrintableFormView";

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
  renderMode?: "schema" | "pdf_overlay" | "facsimile";
  pdfPages?: string[];
  overlayFields?: OverlayField[];
  slug?: string;
  patientInfo?: { name: string; email?: string; idNumber?: string; phone?: string };
  submittedAt?: string;
  signatureData?: string;
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
  renderMode = "schema",
  pdfPages,
  overlayFields,
  slug,
  patientInfo,
  submittedAt,
  signatureData,
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
          {readOnly && patientInfo && (
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() =>
                openPrintableForm({
                  title,
                  schema,
                  values,
                  patientInfo,
                  submittedAt: submittedAt || new Date().toISOString(),
                  signatureData,
                })
              }
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
          )}
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
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16 py-6 sm:py-8 lg:py-10">
          {renderMode === "facsimile" && slug && facsimileRegistry[slug] ? (
            <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto mt-8" />}>
              {(() => { const Comp = facsimileRegistry[slug]; return <Comp values={values} onChange={onChange} readOnly={readOnly} />; })()}
            </Suspense>
          ) : renderMode === "pdf_overlay" && pdfPages && overlayFields ? (
            <PdfOverlayRenderer
              pdfPages={pdfPages}
              overlayFields={overlayFields}
              values={values}
              onChange={onChange}
              readOnly={readOnly}
            />
          ) : (
            <FormRenderer
              schema={schema}
              values={values}
              onChange={onChange}
              readOnly={readOnly}
            />
          )}
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
