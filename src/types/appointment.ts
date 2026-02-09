import { Database } from "@/integrations/supabase/types";

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];
export type ReminderType = Database["public"]["Enums"]["reminder_type"];
export type ReminderStatus = Database["public"]["Enums"]["reminder_status"];

export interface TreatmentChair {
  id: string;
  name: string;
  is_active: boolean;
  notes: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface AppointmentType {
  id: string;
  name: string;
  default_duration_minutes: number;
  color: string;
  requires_consent: boolean;
  preparation_instructions: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  appointment_type_id: string;
  chair_id: string | null;
  assigned_nurse_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  status: AppointmentStatus;
  cancellation_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentWithRelations extends Appointment {
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  appointment_type: AppointmentType;
  chair: TreatmentChair | null;
}

export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: ReminderType;
  scheduled_for: string;
  sent_at: string | null;
  status: ReminderStatus;
  error_message: string | null;
  created_at: string;
}

export type AppointmentFormData = {
  patient_id: string;
  appointment_type_id: string;
  chair_id: string | null;
  assigned_nurse_id: string | null;
  scheduled_start: Date;
  duration_minutes: number;
  notes: string;
};
