import type { Patient, PatientMedicalHistory } from "@/types/patient";
import type { FormField } from "@/components/forms/FormRenderer";

export type PrefillKey =
  | "patient_first_name"
  | "patient_last_name"
  | "patient_full_name"
  | "patient_id_number"
  | "patient_email"
  | "patient_phone"
  | "patient_date_of_birth"
  | "patient_gender"
  | "patient_address"
  | "patient_city"
  | "patient_postal_code"
  | "emergency_contact_name"
  | "emergency_contact_phone"
  | "emergency_contact_relationship"
  | "medical_aid_name"
  | "medical_aid_number"
  | "medical_aid_plan"
  | "medical_aid_main_member"
  | "referring_doctor_name"
  | "allergies";

export const PREFILL_KEY_OPTIONS: { value: PrefillKey; label: string }[] = [
  { value: "patient_first_name", label: "Patient First Name" },
  { value: "patient_last_name", label: "Patient Last Name" },
  { value: "patient_full_name", label: "Patient Full Name" },
  { value: "patient_id_number", label: "ID Number" },
  { value: "patient_email", label: "Email" },
  { value: "patient_phone", label: "Phone" },
  { value: "patient_date_of_birth", label: "Date of Birth" },
  { value: "patient_gender", label: "Gender" },
  { value: "patient_address", label: "Street Address" },
  { value: "patient_city", label: "City" },
  { value: "patient_postal_code", label: "Postal Code" },
  { value: "emergency_contact_name", label: "Emergency Contact Name" },
  { value: "emergency_contact_phone", label: "Emergency Contact Phone" },
  { value: "emergency_contact_relationship", label: "Emergency Contact Relationship" },
  { value: "medical_aid_name", label: "Medical Aid Name" },
  { value: "medical_aid_number", label: "Medical Aid Number" },
  { value: "medical_aid_plan", label: "Medical Aid Plan" },
  { value: "medical_aid_main_member", label: "Medical Aid Main Member" },
  { value: "referring_doctor_name", label: "Referring Doctor" },
  { value: "allergies", label: "Allergies" },
];

// ─── Auto-detection: infer a prefill key from a field's name + label ────────

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[\s_\-./]+/g, "_");
}

// Patterns that disqualify a field from being treated as the patient's own data.
const NON_PATIENT_TOKENS = [
  "guardian", "witness", "doctor", "physician", "dr_", "nurse", "hcp",
  "representative", "facility", "provider", "clinician", "practitioner",
  "next_of_kin", "nok_", "spouse_signature", "parent_signature",
];

// Compatible field types per prefill key (so we don't auto-fill checkboxes etc.).
const TYPE_OK = {
  text: (t: string) => ["text", "textarea"].includes(t),
  date: (t: string) => ["date", "text"].includes(t),
  choice: (t: string) => ["text", "select", "radio"].includes(t),
};

interface Rule {
  key: PrefillKey;
  // Any of these substrings must match the normalised name OR label
  any: string[];
  // None of these must match (in addition to the global non-patient list)
  none?: string[];
  // Field-type guard
  ok: (fieldType: string) => boolean;
}

const RULES: Rule[] = [
  // Most specific first — emergency contact, medical aid, referring doctor.
  { key: "emergency_contact_name", any: ["emergency_contact_name", "emergency_name", "next_of_kin_name", "nok_name", "kin_name"], ok: TYPE_OK.text },
  { key: "emergency_contact_phone", any: ["emergency_contact_phone", "emergency_phone", "emergency_contact_number", "next_of_kin_phone", "nok_phone", "kin_phone", "kin_contact"], ok: TYPE_OK.text },
  { key: "emergency_contact_relationship", any: ["emergency_contact_relationship", "emergency_relationship", "next_of_kin_relationship", "nok_relationship", "kin_relationship", "relationship_to_patient"], ok: TYPE_OK.choice },

  { key: "medical_aid_main_member", any: ["main_member", "principal_member", "policy_holder", "scheme_main_member"], ok: TYPE_OK.text },
  { key: "medical_aid_number", any: ["medical_aid_number", "medical_aid_no", "scheme_number", "membership_number", "member_number", "medical_aid_membership"], ok: TYPE_OK.text },
  { key: "medical_aid_plan", any: ["medical_aid_plan", "medical_aid_option", "scheme_plan", "scheme_option", "plan_option"], ok: TYPE_OK.text },
  { key: "medical_aid_name", any: ["medical_aid_name", "medical_aid", "scheme_name", "medical_scheme", "insurer", "insurance_name"], none: ["number", "plan", "option", "main_member"], ok: TYPE_OK.text },

  { key: "referring_doctor_name", any: ["referring_doctor", "referring_physician", "gp_name", "general_practitioner", "referring_dr"], ok: TYPE_OK.text },

  // Address parts
  { key: "patient_postal_code", any: ["postal_code", "postcode", "zip_code", "zip"], ok: TYPE_OK.text },
  { key: "patient_city", any: ["city", "town", "suburb"], ok: TYPE_OK.text },
  { key: "patient_address", any: ["address", "street_address", "residential_address", "physical_address", "home_address"], none: ["email", "city", "postal", "zip", "town"], ok: TYPE_OK.text },

  // Demographics
  { key: "patient_date_of_birth", any: ["date_of_birth", "birth_date", "dob", "birthdate"], ok: TYPE_OK.date },
  { key: "patient_gender", any: ["gender", "sex"], ok: TYPE_OK.choice },

  // Identity
  { key: "patient_id_number", any: ["id_number", "id_no", "identity_number", "sa_id", "national_id", "patient_id_number", "pt_id"], ok: TYPE_OK.text },
  { key: "patient_email", any: ["email", "e_mail"], ok: TYPE_OK.text },
  { key: "patient_phone", any: ["phone", "cell", "mobile", "contact_number", "tel", "telephone", "patient_contact", "pt_tel"], none: ["emergency", "kin", "nok"], ok: TYPE_OK.text },

  // Names — most specific last so first/last beat full when present
  { key: "patient_full_name", any: ["full_name", "name_in_full", "patient_name", "patient_full_name"], none: ["first", "last", "surname", "given"], ok: TYPE_OK.text },
  { key: "patient_first_name", any: ["first_name", "given_name", "given_names", "pt_name", "forename"], ok: TYPE_OK.text },
  { key: "patient_last_name", any: ["last_name", "surname", "family_name", "pt_surname"], ok: TYPE_OK.text },

  // Clinical
  { key: "allergies", any: ["allergies", "known_allergies", "allergy_list"], ok: (t) => ["text", "textarea", "checkbox_group"].includes(t) },
];

/**
 * Infer the best matching prefill key for a field, based on its
 * field_name + label. Returns null if no confident match.
 */
export function inferPrefillKey(field: { field_name?: string; label?: string; field_type?: string }): PrefillKey | null {
  const fieldType = field.field_type || "text";
  const haystack = `${norm(field.field_name || "")} ${norm(field.label || "")}`;

  // Skip non-patient signatories (guardian, witness, doctor, etc.)
  if (NON_PATIENT_TOKENS.some(tok => haystack.includes(tok))) return null;

  for (const rule of RULES) {
    if (!rule.ok(fieldType)) continue;
    if (rule.none?.some(tok => haystack.includes(tok))) continue;
    if (rule.any.some(tok => haystack.includes(tok))) {
      return rule.key;
    }
  }
  return null;
}

function buildPrefillMap(
  patient: Patient,
  medicalHistory?: PatientMedicalHistory | null
): Record<string, string> {
  const map: Record<string, string> = {};

  const set = (key: string, val: string | null | undefined) => {
    if (val) map[key] = val;
  };

  set("patient_first_name", patient.first_name);
  set("patient_last_name", patient.last_name);
  set("patient_full_name", `${patient.first_name} ${patient.last_name}`.trim());
  set("patient_id_number", patient.id_number);
  set("patient_email", patient.email);
  set("patient_phone", patient.phone);
  set("patient_date_of_birth", patient.date_of_birth);
  set("patient_gender", patient.gender);
  set(
    "patient_address",
    [patient.address_line_1, patient.address_line_2].filter(Boolean).join(", ")
  );
  set("patient_city", patient.city);
  set("patient_postal_code", patient.postal_code);
  set("emergency_contact_name", patient.emergency_contact_name);
  set("emergency_contact_phone", patient.emergency_contact_phone);
  set("emergency_contact_relationship", patient.emergency_contact_relationship);
  set("medical_aid_name", patient.medical_aid_name);
  set("medical_aid_number", patient.medical_aid_number);
  set("medical_aid_plan", patient.medical_aid_plan);
  set("medical_aid_main_member", patient.medical_aid_main_member);
  set("referring_doctor_name", patient.referring_doctor_name);

  if (medicalHistory?.allergies?.length) {
    map["allergies"] = medicalHistory.allergies.join(", ");
  }

  return map;
}

/**
 * Given a form schema and patient data, returns pre-filled values
 * for fields that have a `prefill_key` set.
 */
export function prefillFormValues(
  schema: FormField[],
  patient: Patient,
  medicalHistory?: PatientMedicalHistory | null
): Record<string, any> {
  const prefillMap = buildPrefillMap(patient, medicalHistory);
  const values: Record<string, any> = {};

  for (const field of schema) {
    // Explicit prefill_key wins. Otherwise, fall back to inference so that
    // older templates and AI-extracted forms still auto-populate common
    // patient fields without the admin having to wire each one up.
    let key: string | null = field.prefill_key || null;
    if (!key) key = inferPrefillKey(field);
    if (key && prefillMap[key]) {
      values[field.field_name] = prefillMap[key];
    }
  }

  return values;
}
