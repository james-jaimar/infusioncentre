import type { Patient, PatientMedicalHistory } from "@/types/patient";
import type { FormField } from "@/components/forms/FormRenderer";

type PrefillKey =
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
    if (field.prefill_key && prefillMap[field.prefill_key]) {
      values[field.field_name] = prefillMap[field.prefill_key];
    }
  }

  return values;
}
