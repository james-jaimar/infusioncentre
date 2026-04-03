import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FormRenderer, { type FormField } from "@/components/forms/FormRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, AlertCircle, Mail } from "lucide-react";
import logo from "@/assets/logo.png";

/** Detect which identity-like fields already exist in the form schema */
function detectIdentityFields(schema: FormField[]) {
  const names = schema.map((f) => (f.field_name ?? "").toLowerCase());
  const labels = schema.map((f) => (f.label ?? "").toLowerCase());

  const has = (patterns: string[]) =>
    patterns.some(
      (p) => names.some((n) => n.includes(p)) || labels.some((l) => l.includes(p))
    );

  return {
    hasName: has(["name_in_full", "full_name", "first_name", "patient_name", "surname"]),
    hasEmail: has(["email"]),
    hasPhone: has(["phone", "cell", "mobile", "contact_number", "tel"]),
    hasIdNumber: has(["id_number", "identity", "sa_id", "id no"]),
  };
}

/** Try to extract a value from form values by matching field_name patterns */
function extractFromValues(
  values: Record<string, any>,
  schema: FormField[],
  patterns: string[]
): string {
  for (const f of schema) {
    const name = (f.field_name ?? "").toLowerCase();
    const label = (f.label ?? "").toLowerCase();
    if (patterns.some((p) => name.includes(p) || label.includes(p))) {
      const v = values[f.field_name];
      if (v && typeof v === "string") return v.trim();
    }
  }
  return "";
}

export default function PublicForm() {
  const { slug } = useParams<{ slug: string }>();

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

  // Form values
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const schema = useMemo(
    () => (template?.form_schema as unknown as FormField[]) || [],
    [template]
  );

  const identity = useMemo(() => detectIdentityFields(schema), [schema]);

  // Determine what to show
  const showNameFields = !identity.hasName;
  const showPhoneField = !identity.hasPhone;
  const showIdField = !identity.hasIdNumber;
  const showIdentityCard = showNameFields || showPhoneField || showIdField;

  const handleSubmit = async () => {
    // Resolve identity data — either from hardcoded inputs or form values
    let resolvedFirst = firstName.trim();
    let resolvedLast = lastName.trim();
    let resolvedEmail = email.trim();
    let resolvedPhone = phone.trim();
    let resolvedId = idNumber.trim();

    if (identity.hasName) {
      const fullName = extractFromValues(values, schema, [
        "name_in_full", "full_name", "patient_name",
      ]);
      const fName = extractFromValues(values, schema, ["first_name"]);
      const lName = extractFromValues(values, schema, ["surname", "last_name"]);

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
      resolvedPhone = extractFromValues(values, schema, [
        "phone", "cell", "mobile", "contact_number", "tel",
      ]);
    }

    if (identity.hasIdNumber) {
      resolvedId = extractFromValues(values, schema, [
        "id_number", "identity", "sa_id", "id no",
      ]);
    }

    // Validation
    if (!resolvedFirst || !resolvedLast) {
      toast({ title: "Please fill in your name", variant: "destructive" });
      return;
    }
    if (!resolvedEmail) {
      toast({ title: "Please provide your email address", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resolvedEmail)) {
      toast({ title: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    // Check required form fields
    const missingRequired = schema
      .filter(
        (f) =>
          f.required &&
          f.field_type !== "section_header" &&
          f.field_type !== "info_text"
      )
      .filter((f) => {
        const v = values[f.field_name];
        if (Array.isArray(v)) return v.length === 0;
        return v === undefined || v === null || v === "";
      });

    if (missingRequired.length > 0) {
      toast({
        title: "Please complete all required fields",
        description: `Missing: ${missingRequired.map((f) => f.label).join(", ")}`,
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

      <main className="w-[90%] max-w-[1600px] mx-auto py-8 space-y-6">
        {/* Form Title */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{template.name}</h2>
          {template.description && (
            <p className="text-muted-foreground mt-1 text-sm">{template.description}</p>
          )}
        </div>

        {/* Email — always shown */}
        {!showIdentityCard && (
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3 border">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 max-w-sm">
              <Label className="text-xs text-muted-foreground">
                Email address <span className="text-destructive">*</span>
                <span className="ml-1 font-normal">— needed to link this form to your records</span>
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="h-9 mt-1"
              />
            </div>
          </div>
        )}

        {/* Patient Identity Section — only fields not already in the form */}
        {showIdentityCard && (
          <Card className="border-primary/20">
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
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">
                        Last Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        className="h-11"
                      />
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-11"
                  />
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
            <FormRenderer
              schema={schema}
              values={values}
              onChange={setValues}
            />
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
