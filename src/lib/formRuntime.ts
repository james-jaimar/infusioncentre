/**
 * Shared form runtime — single source of truth for:
 * - Field visibility (conditional logic with coercion)
 * - Required-field validation
 * - Empty-value checks by field type
 * - Patient identity resolution from form values
 */

export interface FormFieldSchema {
  field_name: string;
  field_type: string;
  label: string;
  required?: boolean;
  conditional_on?: { field: string; value: string | boolean };
  options?: string[];
  [key: string]: any;
}

// ─── Conditional coercion ───────────────────────────────────────────────────
// AI extraction sometimes emits "true" as a string instead of boolean true.
// This normalises both sides of a conditional check.

function coerce(val: any): string {
  if (val === true) return "true";
  if (val === false) return "false";
  if (val === null || val === undefined) return "";
  return String(val).trim().toLowerCase();
}

export function isFieldVisible(
  field: FormFieldSchema,
  values: Record<string, any>
): boolean {
  if (!field.conditional_on) return true;
  const parentVal = values[field.conditional_on.field];
  return coerce(parentVal) === coerce(field.conditional_on.value);
}

// ─── Empty checks ───────────────────────────────────────────────────────────

export function isValueEmpty(value: any, fieldType: string): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "boolean") return false; // false is a valid answer
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

// ─── Validation ─────────────────────────────────────────────────────────────

const NON_INPUT_TYPES = new Set(["section_header", "info_text"]);

export interface ValidationResult {
  valid: boolean;
  errors: Set<string>; // field_name values that failed
}

/**
 * Validate all required visible fields in a schema.
 * Returns a set of field_name values that are missing.
 */
export function validateSchema(
  schema: FormFieldSchema[],
  values: Record<string, any>
): ValidationResult {
  const errors = new Set<string>();

  for (const field of schema) {
    if (!field.required) continue;
    if (NON_INPUT_TYPES.has(field.field_type)) continue;
    if (!isFieldVisible(field, values)) continue;

    if (isValueEmpty(values[field.field_name], field.field_type)) {
      errors.add(field.field_name);
    }
  }

  return { valid: errors.size === 0, errors };
}

// ─── Identity resolution ────────────────────────────────────────────────────

function normalize(s: string): string {
  return (s || "").toLowerCase().replace(/[\s_-]+/g, "_");
}

const PATIENT_NAME_PATTERNS = [
  "name_in_full", "full_name", "patient_name", "patient_full_name",
  "first_name", "surname", "last_name", "pt_name", "pt_surname",
  "patient_name_surname",
];
const NON_PATIENT_PATTERNS = [
  "guardian", "witness", "doctor", "dr_", "nurse", "hcp",
  "representative", "nok_", "next_of_kin", "acino", "facility",
];
const PHONE_PATTERNS = ["phone", "cell", "mobile", "contact_number", "tel", "patient_contact", "pt_tel"];
const ID_PATTERNS = ["id_number", "identity", "sa_id", "id_no", "pt_id", "patient_id_number"];
const EMAIL_PATTERNS = ["email", "pt_email"];

function matchesAny(fieldName: string, label: string, patterns: string[], exclude?: string[]): boolean {
  const n = normalize(fieldName);
  const l = normalize(label);
  if (exclude?.some(p => n.includes(p) || l.includes(p))) return false;
  return patterns.some(p => n.includes(p) || l.includes(p));
}

export interface IdentityDetection {
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  hasIdNumber: boolean;
}

export function detectIdentityFields(schema: FormFieldSchema[]): IdentityDetection {
  return {
    hasName: schema.some(f => matchesAny(f.field_name, f.label, PATIENT_NAME_PATTERNS, NON_PATIENT_PATTERNS)),
    hasEmail: schema.some(f => matchesAny(f.field_name, f.label, EMAIL_PATTERNS, NON_PATIENT_PATTERNS)),
    hasPhone: schema.some(f => matchesAny(f.field_name, f.label, PHONE_PATTERNS, NON_PATIENT_PATTERNS)),
    hasIdNumber: schema.some(f => matchesAny(f.field_name, f.label, ID_PATTERNS, NON_PATIENT_PATTERNS)),
  };
}

function extractFirst(
  values: Record<string, any>,
  schema: FormFieldSchema[],
  patterns: string[],
  exclude?: string[]
): string {
  for (const f of schema) {
    if (matchesAny(f.field_name, f.label, patterns, exclude)) {
      const v = values[f.field_name];
      if (v && typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
}

export interface ResolvedIdentity {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber: string;
}

/**
 * Resolve patient identity from a combination of:
 * - Explicit identity fields (provided by the PublicForm UI)
 * - Values extracted from the form schema
 * - Facsimile-specific keys
 */
export function resolveIdentity(
  schema: FormFieldSchema[],
  values: Record<string, any>,
  manualIdentity: { firstName: string; lastName: string; email: string; phone: string; idNumber: string },
  renderMode: string
): ResolvedIdentity {
  let { firstName, lastName, email, phone, idNumber } = manualIdentity;

  if (renderMode === "facsimile") {
    // Facsimile forms use known keys
    const fullName = String(values.patient_full_name || "").trim();
    const fName = String(values.pt_name || "").trim();
    const lName = String(values.pt_surname || "").trim();
    if (fName || lName) { firstName = fName; lastName = lName; }
    else if (fullName) { const parts = fullName.split(/\s+/); firstName = parts[0] || ""; lastName = parts.slice(1).join(" ") || ""; }
    phone = String(values.patient_contact || values.pt_tel || values.patient_phone || "").trim() || phone;
    idNumber = String(values.patient_id_number || values.pt_id || "").trim() || idNumber;
  } else {
    // Schema-based: extract from matching fields
    const identity = detectIdentityFields(schema);
    if (identity.hasName) {
      const fullName = extractFirst(values, schema, ["name_in_full", "full_name", "patient_name", "patient_full_name", "patient_name_surname"], NON_PATIENT_PATTERNS);
      const fName = extractFirst(values, schema, ["first_name", "pt_name"], NON_PATIENT_PATTERNS);
      const lName = extractFirst(values, schema, ["surname", "last_name", "pt_surname"], NON_PATIENT_PATTERNS);
      if (fName || lName) { firstName = fName || firstName; lastName = lName || lastName; }
      else if (fullName) { const parts = fullName.split(/\s+/); firstName = parts[0] || firstName; lastName = parts.slice(1).join(" ") || lastName; }
    }
    if (identity.hasPhone) phone = extractFirst(values, schema, PHONE_PATTERNS, NON_PATIENT_PATTERNS) || phone;
    if (identity.hasIdNumber) idNumber = extractFirst(values, schema, ID_PATTERNS, NON_PATIENT_PATTERNS) || idNumber;
  }

  return { firstName, lastName, email, phone, idNumber };
}

/**
 * Count visible required fields and how many are filled.
 */
export function computeProgress(
  schema: FormFieldSchema[],
  values: Record<string, any>
): { total: number; filled: number; percent: number } {
  const required = schema.filter(
    f => f.required && !NON_INPUT_TYPES.has(f.field_type) && isFieldVisible(f, values)
  );
  const filled = required.filter(f => !isValueEmpty(values[f.field_name], f.field_type));
  const total = required.length;
  return { total, filled: filled.length, percent: total > 0 ? Math.round((filled.length / total) * 100) : 100 };
}
