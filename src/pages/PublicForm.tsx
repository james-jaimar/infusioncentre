import { useState, useMemo, useRef, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FormRenderer, { type FormField } from "@/components/forms/FormRenderer";
import PdfOverlayRenderer, { type OverlayField } from "@/components/forms/PdfOverlayRenderer";
import { facsimileRegistry } from "@/components/forms/facsimile/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

/* ─── Patterns that represent the *patient's own* name ─── */
const PATIENT_NAME_PATTERNS = [
  "name_in_full", "full_name", "patient_name", "patient_full_name",
  "first_name", "surname", "last_name", "pt_name", "pt_surname",
];

/* Patterns that look like names but belong to someone else */
const NON_PATIENT_NAME_PATTERNS = [
  "guardian", "witness", "doctor", "dr_", "nurse", "hcp",
  "representative", "nok_", "next_of_kin", "acino", "facility",
];

const PHONE_PATTERNS = ["phone", "cell", "mobile", "contact_number", "tel", "patient_contact", "pt_tel"];
const ID_PATTERNS = ["id_number", "identity", "sa_id", "id_no", "pt_id", "patient_id_number"];
const EMAIL_PATTERNS = ["email", "pt_email"];

function normalize(s: string) {
  return (s || "").toLowerCase().replace(/[\s_-]+/g, "_");
}

function matchesPatterns(fieldName: string, label: string, patterns: string[], excludePatterns?: string[]): boolean {
  const n = normalize(fieldName);
  const l = normalize(label);
  if (excludePatterns?.some(p => n.includes(p) || l.includes(p))) return false;
  return patterns.some(p => n.includes(p) || l.includes(p));
}

/** Detect which identity fields the form schema already captures for the patient */
function detectIdentityFields(schema: FormField[]) {
  return {
    hasName: schema.some(f =>
      matchesPatterns(f.field_name, f.label, PATIENT_NAME_PATTERNS, NON_PATIENT_NAME_PATTERNS)
    ),
    hasEmail: schema.some(f =>
      matchesPatterns(f.field_name, f.label, EMAIL_PATTERNS, NON_PATIENT_NAME_PATTERNS)
    ),
    hasPhone: schema.some(f =>
      matchesPatterns(f.field_name, f.label, PHONE_PATTERNS, NON_PATIENT_NAME_PATTERNS)
    ),
    hasIdNumber: schema.some(f =>
      matchesPatterns(f.field_name, f.label, ID_PATTERNS, NON_PATIENT_NAME_PATTERNS)
    ),
  };
}

/** Extract a value from submitted form data by matching field patterns */
function extractFromValues(
  values: Record<string, any>,
  schema: FormField[],
  patterns: string[],
  excludePatterns?: string[]
): string {
  for (const f of schema) {
    if (matchesPatterns(f.field_name, f.label, patterns, excludePatterns)) {
      const v = values[f.field_name];
      if (v && typeof v === "string") return v.trim();
    }
  }
  return "";
}

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();
  const formTopRef = useRef<HTMLDivElement>(null);

  const { data: template, isLoading, error } = useQuery({
    queryKey: ["public_form_template", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("form_templates")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Respondent identity fields (used only when form doesn't already have them)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Form values & validation
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());

  const isFacsimile = template?.render_mode === "facsimile";

  const schema = useMemo(
    () => (template?.form_schema as unknown as FormField[]) || [],
    [template]
  );

  const identity = useMemo(() => detectIdentityFields(schema), [schema]);

  // For facsimile forms, hide the identity card entirely
  const showNameFields = !isFacsimile && !identity.hasName;
  const showPhoneField = !isFacsimile && !identity.hasPhone;
  const showIdField = !isFacsimile && !identity.hasIdNumber;
  const showIdentityCard = showNameFields || showPhoneField || showIdField;

  const handleSubmit = async () => {
    // Resolve identity data
    let resolvedFirst = firstName.trim();
    let resolvedLast = lastName.trim();
    let resolvedEmail = email.trim();
    let resolvedPhone = phone.trim();
    let resolvedId = idNumber.trim();

    if (isFacsimile) {
      const fullName = (values.patient_full_name || "").toString().trim();
      const fName = (values.pt_name || "").toString().trim();
      const lName = (values.pt_surname || "").toString().trim();

      if (fName || lName) {
        resolvedFirst = fName;
        resolvedLast = lName;
      } else if (fullName) {
        const parts = fullName.split(/\s+/);
        resolvedFirst = parts[0] || "";
        resolvedLast = parts.slice(1).join(" ") || "";
      }

      resolvedPhone = (values.patient_contact || values.pt_tel || values.patient_phone || "").toString().trim();
      resolvedId = (values.patient_id_number || values.pt_id || "").toString().trim();
    } else {
      if (identity.hasName) {
        const fullName = extractFromValues(values, schema, [
          "name_in_full", "full_name", "patient_name", "patient_full_name",
        ], NON_PATIENT_NAME_PATTERNS);
        const fName = extractFromValues(values, schema, ["first_name", "pt_name"], NON_PATIENT_NAME_PATTERNS);
        const lName = extractFromValues(values, schema, ["surname", "last_name", "pt_surname"], NON_PATIENT_NAME_PATTERNS);

        if (fName || lName) {
          resolvedFirst = fName;
          resolvedLast = lName;
        } else if (fullName) {
          const parts = fullName.split(/\s+/);
          resolvedFirst = parts[0] || "";
          resolvedLast = parts.slice(1).join(" ") || "";
        }
      }

      if (identity.hasPhone) {
        resolvedPhone = extractFromValues(values, schema, PHONE_PATTERNS, NON_PATIENT_NAME_PATTERNS);
      }

      if (identity.hasIdNumber) {
        resolvedId = extractFromValues(values, schema, ID_PATTERNS, NON_PATIENT_NAME_PATTERNS);
      }
    }

    // Build error set
    const errors = new Set<string>();

    // Validate identity
    if (!resolvedFirst || !resolvedLast) {
      if (showNameFields) {
        errors.add("__identity_name");
      } else {
        // Name should have come from the form — find the field and mark it
        for (const f of schema) {
          if (matchesPatterns(f.field_name, f.label, PATIENT_NAME_PATTERNS, NON_PATIENT_NAME_PATTERNS)) {
            const v = values[f.field_name];
            if (!v || (typeof v === "string" && !v.trim())) {
              errors.add(f.field_name);
            }
          }
        }
      }
    }

    if (!resolvedEmail) {
      errors.add("__identity_email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      errors.add("__identity_email");
    }

    // Check required form fields (skip for facsimile)
    if (!isFacsimile) {
      for (const f of schema) {
        if (!f.required) continue;
        if (f.field_type === "section_header" || f.field_type === "info_text") continue;

        // Skip conditionally hidden fields
        if (f.conditional_on) {
          const parentVal = values[f.conditional_on.field];
          if (parentVal !== f.conditional_on.value) continue;
        }

        const v = values[f.field_name];
        const missing = Array.isArray(v) ? v.length === 0 : (v === undefined || v === null || v === "");
        if (missing) {
          errors.add(f.field_name);
        }
      }
    }

    setErrorFields(errors);

    if (errors.size > 0) {
      // Scroll to first error
      const identityErrors = ["__identity_name", "__identity_email"];
      const hasIdentityError = identityErrors.some(e => errors.has(e));

      if (hasIdentityError) {
        formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        // Find first form field with error
        const firstErrorField = [...errors].find(e => !e.startsWith("__"));
        if (firstErrorField) {
          const el = document.getElementById(`field-${firstErrorField}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }

      const errorCount = errors.size;
      toast({
        title: `Please complete ${errorCount} required field${errorCount > 1 ? "s" : ""}`,
        description: "Scroll up to see highlighted fields",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("submit-public-form", {
        body: {
          slug,
          respondent_first_name: resolvedFirst,
          respondent_last_name: resolvedLast,
          respondent_email: resolvedEmail,
          respondent_id_number: resolvedId || undefined,
          respondent_phone: resolvedPhone || undefined,
          data: values,
        },
      });

      if (res.error) throw new Error(res.error.message || "Submission failed");
      if (res.data?.error) throw new Error(res.data.error);

      setSubmitted(true);
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-semibold">Form Not Found</h1>
            <p className="text-muted-foreground text-sm">
              This form link may be invalid or the form is no longer available. Please contact the clinic for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold">Thank You!</h1>
            <p className="text-muted-foreground text-sm">
              Your form has been submitted successfully. The Johannesburg Infusion Centre team will review your information.
            </p>
            <p className="text-xs text-muted-foreground">You may now close this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-4 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="w-[90%] max-w-[1600px] mx-auto flex items-center gap-4">
          <img src={logo} alt="Johannesburg Infusion Centre" className="h-12 w-auto" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Johannesburg Infusion Centre</h1>
            <p className="text-sm opacity-80 mt-0.5">Patient Form</p>
          </div>
        </div>
      </header>

      <main className="w-[90%] max-w-[1600px] mx-auto py-8 space-y-6" ref={formTopRef}>
        {/* Form Title */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{template.name}</h2>
          {template.description && (
            <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
          )}
        </div>

        {/* Email — always shown when identity card is hidden */}
        {!showIdentityCard && (
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${errorFields.has("__identity_email") ? "bg-destructive/5 border-destructive/40" : "bg-muted/50"}`}>
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">
                Email address <span className="text-destructive">*</span>
                <span className="ml-1 font-normal">— needed to link this form to your records</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorFields(prev => { const n = new Set(prev); n.delete("__identity_email"); return n; }); }}
                placeholder="your@email.com"
                className={`h-9 mt-1 ${errorFields.has("__identity_email") ? "border-destructive" : ""}`}
              />
              {errorFields.has("__identity_email") && (
                <p className="text-xs text-destructive mt-1">Please enter a valid email address</p>
              )}
            </div>
          </div>
        )}

        {/* Patient Identity Section — only fields not already in the form */}
        {showIdentityCard && (
          <Card className={`${errorFields.has("__identity_name") || errorFields.has("__identity_email") ? "border-destructive/40" : "border-primary/20"}`}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-1 w-6 bg-primary rounded-full" />
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">Your Details</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showNameFields && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        First Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={firstName}
                        onChange={(e) => { setFirstName(e.target.value); setErrorFields(prev => { const n = new Set(prev); n.delete("__identity_name"); return n; }); }}
                        placeholder="First name"
                        className={`h-11 ${errorFields.has("__identity_name") && !firstName.trim() ? "border-destructive" : ""}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={lastName}
                        onChange={(e) => { setLastName(e.target.value); setErrorFields(prev => { const n = new Set(prev); n.delete("__identity_name"); return n; }); }}
                        placeholder="Last name"
                        className={`h-11 ${errorFields.has("__identity_name") && !lastName.trim() ? "border-destructive" : ""}`}
                      />
                      {errorFields.has("__identity_name") && (
                        <p className="text-xs text-destructive">Please fill in your name</p>
                      )}
                    </div>
                  </>
                )}
                {/* Email always shown */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorFields(prev => { const n = new Set(prev); n.delete("__identity_email"); return n; }); }}
                    placeholder="your@email.com"
                    className={`h-11 ${errorFields.has("__identity_email") ? "border-destructive" : ""}`}
                  />
                  {errorFields.has("__identity_email") && (
                    <p className="text-xs text-destructive">Please enter a valid email address</p>
                  )}
                </div>
                {showPhoneField && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone number"
                      className="h-11"
                    />
                  </div>
                )}
                {showIdField && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-sm font-medium">SA ID Number</Label>
                    <Input
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      placeholder="ID number (optional)"
                      className="h-11 sm:max-w-xs"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {template.render_mode === "facsimile" && template.slug && facsimileRegistry[template.slug] ? (
              <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto py-8" />}>
                {(() => { const Comp = facsimileRegistry[template.slug!]; return <Comp values={values} onChange={setValues} />; })()}
              </Suspense>
            ) : template.render_mode === "pdf_overlay" && Array.isArray(template.pdf_pages) && template.pdf_pages.length > 0 ? (
              <PdfOverlayRenderer
                pdfPages={template.pdf_pages as string[]}
                overlayFields={(template.overlay_fields as unknown as OverlayField[]) || []}
                values={values}
                onChange={setValues}
              />
            ) : (
              <FormRenderer
                schema={schema}
                values={values}
                onChange={setValues}
                errorFields={errorFields}
                onClearError={(fieldName) => setErrorFields(prev => { const n = new Set(prev); n.delete(fieldName); return n; })}
              />
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end pb-8">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitting}
            className="min-w-[200px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Form"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
