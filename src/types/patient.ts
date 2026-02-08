export type PatientStatus = 'active' | 'inactive' | 'archived';
export type PatientGender = 'male' | 'female' | 'other';
export type DocumentType = 'prescription' | 'referral' | 'consent' | 'id_copy' | 'medical_aid_card' | 'other';

export interface Patient {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  id_number: string | null;
  date_of_birth: string | null;
  gender: PatientGender | null;
  phone: string | null;
  email: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  postal_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  medical_aid_name: string | null;
  medical_aid_number: string | null;
  medical_aid_plan: string | null;
  medical_aid_main_member: string | null;
  referring_doctor_name: string | null;
  referring_doctor_practice: string | null;
  referring_doctor_phone: string | null;
  status: PatientStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientMedicalHistory {
  id: string;
  patient_id: string;
  allergies: string[] | null;
  chronic_conditions: string[] | null;
  current_medications: Medication[] | null;
  previous_surgeries: string | null;
  notes: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
}

export interface PatientDocument {
  id: string;
  patient_id: string;
  document_type: DocumentType;
  file_name: string;
  file_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
  notes: string | null;
}
