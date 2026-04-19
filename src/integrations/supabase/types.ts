export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointment_reminders: {
        Row: {
          appointment_id: string
          created_at: string
          error_message: string | null
          id: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          scheduled_for: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          tenant_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          reminder_type: Database["public"]["Enums"]["reminder_type"]
          scheduled_for: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          tenant_id?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          reminder_type?: Database["public"]["Enums"]["reminder_type"]
          scheduled_for?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_types: {
        Row: {
          color: string
          created_at: string
          default_duration_minutes: number
          display_order: number
          id: string
          is_active: boolean
          name: string
          preparation_instructions: string | null
          requires_consent: boolean
          service_category: Database["public"]["Enums"]["service_category"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          default_duration_minutes?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          preparation_instructions?: string | null
          requires_consent?: boolean
          service_category?: Database["public"]["Enums"]["service_category"]
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          default_duration_minutes?: number
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          preparation_instructions?: string | null
          requires_consent?: boolean
          service_category?: Database["public"]["Enums"]["service_category"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_type_id: string
          assigned_nurse_id: string | null
          cancellation_reason: string | null
          chair_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          patient_id: string
          reschedule_reason: string | null
          rescheduled_from_id: string | null
          scheduled_end: string
          scheduled_start: string
          session_number: number | null
          status: Database["public"]["Enums"]["appointment_status"]
          tenant_id: string
          treatment_course_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_type_id: string
          assigned_nurse_id?: string | null
          cancellation_reason?: string | null
          chair_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          reschedule_reason?: string | null
          rescheduled_from_id?: string | null
          scheduled_end: string
          scheduled_start: string
          session_number?: number | null
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
          treatment_course_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string
          assigned_nurse_id?: string | null
          cancellation_reason?: string | null
          chair_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          reschedule_reason?: string | null
          rescheduled_from_id?: string | null
          scheduled_end?: string
          scheduled_start?: string
          session_number?: number | null
          status?: Database["public"]["Enums"]["appointment_status"]
          tenant_id?: string
          treatment_course_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_chair_id_fkey"
            columns: ["chair_id"]
            isOneToOne: false
            referencedRelation: "treatment_chairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_rescheduled_from_id_fkey"
            columns: ["rescheduled_from_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_course_id_fkey"
            columns: ["treatment_course_id"]
            isOneToOne: false
            referencedRelation: "treatment_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billable_items: {
        Row: {
          appointment_type_id: string | null
          category: Database["public"]["Enums"]["billable_item_category"]
          code: string | null
          cost_price: number | null
          created_at: string
          default_price: number
          display_order: number
          icd10_code: string | null
          id: string
          is_active: boolean
          name: string
          reorder_level: number | null
          stock_quantity: number
          tariff_code: string | null
          tenant_id: string
          track_stock: boolean
          unit: string
          updated_at: string
        }
        Insert: {
          appointment_type_id?: string | null
          category?: Database["public"]["Enums"]["billable_item_category"]
          code?: string | null
          cost_price?: number | null
          created_at?: string
          default_price?: number
          display_order?: number
          icd10_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          reorder_level?: number | null
          stock_quantity?: number
          tariff_code?: string | null
          tenant_id?: string
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string | null
          category?: Database["public"]["Enums"]["billable_item_category"]
          code?: string | null
          cost_price?: number | null
          created_at?: string
          default_price?: number
          display_order?: number
          icd10_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          reorder_level?: number | null
          stock_quantity?: number
          tariff_code?: string | null
          tenant_id?: string
          track_stock?: boolean
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billable_items_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billable_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_claims: {
        Row: {
          appeal_notes: string | null
          approved_amount: number | null
          claim_reference: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string
          notes: string | null
          paid_amount: number
          paid_at: string | null
          payer_name: string
          rejection_code: string | null
          rejection_reason: string | null
          response_at: string | null
          status: Database["public"]["Enums"]["billing_claim_status"]
          submitted_amount: number
          submitted_at: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appeal_notes?: string | null
          approved_amount?: number | null
          claim_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payer_name: string
          rejection_code?: string | null
          rejection_reason?: string | null
          response_at?: string | null
          status?: Database["public"]["Enums"]["billing_claim_status"]
          submitted_amount?: number
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          appeal_notes?: string | null
          approved_amount?: number | null
          claim_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          paid_amount?: number
          paid_at?: string | null
          payer_name?: string
          rejection_code?: string | null
          rejection_reason?: string | null
          response_at?: string | null
          status?: Database["public"]["Enums"]["billing_claim_status"]
          submitted_amount?: number
          submitted_at?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_claims_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_claims_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          label: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          label: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          label?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "clinic_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["clinical_alert_severity"]
          status: Database["public"]["Enums"]["clinical_alert_status"]
          tenant_id: string
          treatment_id: string
          triggered_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["clinical_alert_severity"]
          status?: Database["public"]["Enums"]["clinical_alert_status"]
          tenant_id?: string
          treatment_id: string
          triggered_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["clinical_alert_severity"]
          status?: Database["public"]["Enums"]["clinical_alert_status"]
          tenant_id?: string
          treatment_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_alerts_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          recipient: string
          related_entity_id: string | null
          related_entity_type: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["communication_status"]
          subject: string | null
          template: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["communication_type"]
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"]
          subject?: string | null
          template?: string | null
          tenant_id?: string
          type: Database["public"]["Enums"]["communication_type"]
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          recipient?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["communication_status"]
          subject?: string | null
          template?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: [
          {
            foreignKeyName: "communication_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          read_at: string | null
          response_notes: string | null
          status: Database["public"]["Enums"]["contact_status"]
          subject: string
          tenant_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          read_at?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject: string
          tenant_id?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          read_at?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          subject?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bookings: {
        Row: {
          course_id: string
          created_at: string
          email: string
          id: string
          notes: string | null
          organisation: string | null
          participant_name: string
          phone: string | null
          preferred_dates: string | null
          status: Database["public"]["Enums"]["booking_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          organisation?: string | null
          participant_name: string
          phone?: string | null
          preferred_dates?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          organisation?: string | null
          participant_name?: string
          phone?: string | null
          preferred_dates?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_bookings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_bookings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discharge_criteria: {
        Row: {
          created_at: string
          criterion_key: string
          description: string | null
          display_label: string
          display_order: number
          id: string
          is_required: boolean
          protocol_id: string
          rule_config: Json | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          criterion_key: string
          description?: string | null
          display_label: string
          display_order?: number
          id?: string
          is_required?: boolean
          protocol_id: string
          rule_config?: Json | null
          tenant_id?: string
        }
        Update: {
          created_at?: string
          criterion_key?: string
          description?: string | null
          display_label?: string
          display_order?: number
          id?: string
          is_required?: boolean
          protocol_id?: string
          rule_config?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discharge_criteria_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discharge_criteria_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_report_templates: {
        Row: {
          body_template: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          milestone_trigger: string
          name: string
          subject_template: string
          tenant_id: string
          treatment_type_id: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          body_template?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          milestone_trigger: string
          name: string
          subject_template?: string
          tenant_id?: string
          treatment_type_id?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          body_template?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          milestone_trigger?: string
          name?: string
          subject_template?: string
          tenant_id?: string
          treatment_type_id?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "doctor_report_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_report_templates_treatment_type_id_fkey"
            columns: ["treatment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_reports: {
        Row: {
          acknowledged_at: string | null
          body_html: string
          body_text: string | null
          created_at: string
          doctor_id: string
          edited_at: string | null
          edited_by: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          milestone: string
          notes: string | null
          patient_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["doctor_report_status"]
          subject: string
          template_id: string | null
          tenant_id: string
          treatment_course_id: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          body_html?: string
          body_text?: string | null
          created_at?: string
          doctor_id: string
          edited_at?: string | null
          edited_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          milestone: string
          notes?: string | null
          patient_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["doctor_report_status"]
          subject: string
          template_id?: string | null
          tenant_id?: string
          treatment_course_id: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          body_html?: string
          body_text?: string | null
          created_at?: string
          doctor_id?: string
          edited_at?: string | null
          edited_by?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          milestone?: string
          notes?: string | null
          patient_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["doctor_report_status"]
          subject?: string
          template_id?: string | null
          tenant_id?: string
          treatment_course_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_reports_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reports_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "doctor_report_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_reports_treatment_course_id_fkey"
            columns: ["treatment_course_id"]
            isOneToOne: false
            referencedRelation: "treatment_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          must_change_password: boolean
          notification_preferences: Json | null
          phone: string | null
          postal_code: string | null
          practice_name: string | null
          practice_number: string | null
          specialisation: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          practice_name?: string | null
          practice_number?: string | null
          specialisation?: string | null
          tenant_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          practice_name?: string | null
          practice_number?: string | null
          specialisation?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_body: string
          id: string
          is_active: boolean
          name: string
          slug: string
          subject: string
          tenant_id: string
          text_body: string | null
          updated_at: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_body: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          subject: string
          tenant_id?: string
          text_body?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          html_body?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          subject?: string
          tenant_id?: string
          text_body?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_enabled: boolean
          key: string
          label: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          key: string
          label: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_enabled?: boolean
          key?: string
          label?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          admin_amendments: Json
          created_at: string
          data: Json
          form_template_id: string
          id: string
          patient_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          signature_data: string | null
          status: Database["public"]["Enums"]["form_submission_status"]
          submitted_by: string | null
          tenant_id: string
          witness_signature_data: string | null
        }
        Insert: {
          admin_amendments?: Json
          created_at?: string
          data?: Json
          form_template_id: string
          id?: string
          patient_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["form_submission_status"]
          submitted_by?: string | null
          tenant_id?: string
          witness_signature_data?: string | null
        }
        Update: {
          admin_amendments?: Json
          created_at?: string
          data?: Json
          form_template_id?: string
          id?: string
          patient_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signature_data?: string | null
          status?: Database["public"]["Enums"]["form_submission_status"]
          submitted_by?: string | null
          tenant_id?: string
          witness_signature_data?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          category: Database["public"]["Enums"]["form_category"]
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          form_schema: Json
          id: string
          is_active: boolean
          name: string
          overlay_fields: Json | null
          pdf_pages: Json | null
          render_mode: string
          required_for_treatment_types: string[] | null
          slug: string | null
          tenant_id: string
          updated_at: string
          version: number
        }
        Insert: {
          category: Database["public"]["Enums"]["form_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          form_schema?: Json
          id?: string
          is_active?: boolean
          name: string
          overlay_fields?: Json | null
          pdf_pages?: Json | null
          render_mode?: string
          required_for_treatment_types?: string[] | null
          slug?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["form_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          form_schema?: Json
          id?: string
          is_active?: boolean
          name?: string
          overlay_fields?: Json | null
          pdf_pages?: Json | null
          render_mode?: string
          required_for_treatment_types?: string[] | null
          slug?: string | null
          tenant_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          billable_item_id: string | null
          code: string | null
          created_at: string
          description: string
          icd10_code: string | null
          id: string
          invoice_id: string
          line_total: number | null
          quantity: number
          tariff_code: string | null
          tenant_id: string
          treatment_billable_item_id: string | null
          unit_price: number
        }
        Insert: {
          billable_item_id?: string | null
          code?: string | null
          created_at?: string
          description: string
          icd10_code?: string | null
          id?: string
          invoice_id: string
          line_total?: number | null
          quantity?: number
          tariff_code?: string | null
          tenant_id?: string
          treatment_billable_item_id?: string | null
          unit_price?: number
        }
        Update: {
          billable_item_id?: string | null
          code?: string | null
          created_at?: string
          description?: string
          icd10_code?: string | null
          id?: string
          invoice_id?: string
          line_total?: number | null
          quantity?: number
          tariff_code?: string | null
          tenant_id?: string
          treatment_billable_item_id?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_billable_item_id_fkey"
            columns: ["billable_item_id"]
            isOneToOne: false
            referencedRelation: "billable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_treatment_billable_item_id_fkey"
            columns: ["treatment_billable_item_id"]
            isOneToOne: false
            referencedRelation: "treatment_billable_items"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_outstanding: number | null
          amount_paid: number
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          id: string
          invoice_number: string
          issued_date: string
          medical_aid_name: string | null
          medical_aid_number: string | null
          notes: string | null
          paid_at: string | null
          patient_id: string
          payer_name: string | null
          payer_type: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tenant_id: string
          total_amount: number
          treatment_course_id: string | null
          updated_at: string
        }
        Insert: {
          amount_outstanding?: number | null
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_date?: string
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id: string
          payer_name?: string | null
          payer_type?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          treatment_course_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_outstanding?: number | null
          amount_paid?: number
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_date?: string
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string
          payer_name?: string | null
          payer_type?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tenant_id?: string
          total_amount?: number
          treatment_course_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_treatment_course_id_fkey"
            columns: ["treatment_course_id"]
            isOneToOne: false
            referencedRelation: "treatment_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      ketamine_monitoring: {
        Row: {
          alertness_score: number
          anxiety_score: number | null
          dissociation_level: number
          id: string
          minutes_from_start: number
          mood_score: number
          nausea_present: boolean
          notes: string | null
          pain_score: number
          recorded_at: string
          recorded_by: string | null
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          alertness_score: number
          anxiety_score?: number | null
          dissociation_level: number
          id?: string
          minutes_from_start: number
          mood_score: number
          nausea_present?: boolean
          notes?: string | null
          pain_score: number
          recorded_at?: string
          recorded_by?: string | null
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          alertness_score?: number
          anxiety_score?: number | null
          dissociation_level?: number
          id?: string
          minutes_from_start?: number
          mood_score?: number
          nausea_present?: boolean
          notes?: string | null
          pain_score?: number
          recorded_at?: string
          recorded_by?: string | null
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ketamine_monitoring_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ketamine_monitoring_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_type: string
          created_at: string
          doctor_id: string | null
          id: string
          is_read: boolean
          patient_id: string | null
          read_at: string | null
          sender_id: string
          sender_role: string
          tenant_id: string
        }
        Insert: {
          content: string
          conversation_type: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_read?: boolean
          patient_id?: string | null
          read_at?: string | null
          sender_id: string
          sender_role: string
          tenant_id?: string
        }
        Update: {
          content?: string
          conversation_type?: string
          created_at?: string
          doctor_id?: string | null
          id?: string
          is_read?: boolean
          patient_id?: string | null
          read_at?: string | null
          sender_id?: string
          sender_role?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklists: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string | null
          form_submission_id: string | null
          form_template_id: string
          id: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["checklist_item_status"]
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          form_submission_id?: string | null
          form_template_id: string
          id?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["checklist_item_status"]
          tenant_id?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          form_submission_id?: string | null
          form_template_id?: string
          id?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["checklist_item_status"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklists_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklists_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          tenant_id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          tenant_id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          tenant_id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          id: string
          notes: string | null
          patient_id: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          patient_id: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          patient_id?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          patient_id: string
          phone: string | null
          status: Database["public"]["Enums"]["invite_status"]
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          patient_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          tenant_id?: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          patient_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["invite_status"]
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_invites_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_invites_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medical_history: {
        Row: {
          allergies: string[] | null
          chronic_conditions: string[] | null
          current_medications: Json | null
          id: string
          notes: string | null
          patient_id: string
          previous_surgeries: string | null
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string[] | null
          chronic_conditions?: string[] | null
          current_medications?: Json | null
          id?: string
          notes?: string | null
          patient_id: string
          previous_surgeries?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string[] | null
          chronic_conditions?: string[] | null
          current_medications?: Json | null
          id?: string
          notes?: string | null
          patient_id?: string
          previous_surgeries?: string | null
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medical_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_medical_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          patient_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          patient_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string
          gender: Database["public"]["Enums"]["patient_gender"] | null
          id: string
          id_number: string | null
          last_name: string
          medical_aid_main_member: string | null
          medical_aid_name: string | null
          medical_aid_number: string | null
          medical_aid_plan: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          referring_doctor_name: string | null
          referring_doctor_phone: string | null
          referring_doctor_practice: string | null
          status: Database["public"]["Enums"]["patient_status"]
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["patient_gender"] | null
          id?: string
          id_number?: string | null
          last_name: string
          medical_aid_main_member?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          medical_aid_plan?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          referring_doctor_name?: string | null
          referring_doctor_phone?: string | null
          referring_doctor_practice?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["patient_gender"] | null
          id?: string
          id_number?: string | null
          last_name?: string
          medical_aid_main_member?: string | null
          medical_aid_name?: string | null
          medical_aid_number?: string | null
          medical_aid_plan?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          referring_doctor_name?: string | null
          referring_doctor_phone?: string | null
          referring_doctor_practice?: string | null
          status?: Database["public"]["Enums"]["patient_status"]
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payer_rate_mappings: {
        Row: {
          billable_item_id: string
          contracted_rate: number
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          is_claimable: boolean
          notes: string | null
          payer_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          billable_item_id: string
          contracted_rate: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_claimable?: boolean
          notes?: string | null
          payer_name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          billable_item_id?: string
          contracted_rate?: number
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          is_claimable?: boolean
          notes?: string | null
          payer_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payer_rate_mappings_billable_item_id_fkey"
            columns: ["billable_item_id"]
            isOneToOne: false
            referencedRelation: "billable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payer_rate_mappings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          is_approved: boolean
          last_name: string | null
          phone: string | null
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_approved?: boolean
          last_name?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          is_approved?: boolean
          last_name?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          referral_id: string
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          referral_id: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          referral_id?: string
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_attachments_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          clinical_history: string | null
          course_template_id: string | null
          created_at: string
          current_medications: string | null
          diagnosis: string | null
          doctor_id: string
          icd10_codes: string[] | null
          id: string
          medical_aid_main_member: string | null
          medical_aid_number: string | null
          medical_aid_scheme: string | null
          notes: string | null
          patient_email: string | null
          patient_first_name: string
          patient_id: string | null
          patient_last_name: string
          patient_phone: string | null
          prescription_notes: string | null
          reason_for_referral: string | null
          referral_document_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["referral_status"]
          tenant_id: string
          treatment_requested: string | null
          treatment_type_id: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["referral_urgency"]
        }
        Insert: {
          clinical_history?: string | null
          course_template_id?: string | null
          created_at?: string
          current_medications?: string | null
          diagnosis?: string | null
          doctor_id: string
          icd10_codes?: string[] | null
          id?: string
          medical_aid_main_member?: string | null
          medical_aid_number?: string | null
          medical_aid_scheme?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_first_name: string
          patient_id?: string | null
          patient_last_name: string
          patient_phone?: string | null
          prescription_notes?: string | null
          reason_for_referral?: string | null
          referral_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          tenant_id?: string
          treatment_requested?: string | null
          treatment_type_id?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["referral_urgency"]
        }
        Update: {
          clinical_history?: string | null
          course_template_id?: string | null
          created_at?: string
          current_medications?: string | null
          diagnosis?: string | null
          doctor_id?: string
          icd10_codes?: string[] | null
          id?: string
          medical_aid_main_member?: string | null
          medical_aid_number?: string | null
          medical_aid_scheme?: string | null
          notes?: string | null
          patient_email?: string | null
          patient_first_name?: string
          patient_id?: string | null
          patient_last_name?: string
          patient_phone?: string | null
          prescription_notes?: string | null
          reason_for_referral?: string | null
          referral_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          tenant_id?: string
          treatment_requested?: string | null
          treatment_type_id?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["referral_urgency"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "treatment_course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_treatment_type_id_fkey"
            columns: ["treatment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      status_dictionaries: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_label: string
          display_order: number
          entity_type: string
          id: string
          is_active: boolean
          is_default: boolean
          is_terminal: boolean
          status_key: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_label: string
          display_order?: number
          entity_type: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_terminal?: boolean
          status_key: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_label?: string
          display_order?: number
          entity_type?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          is_terminal?: boolean
          status_key?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_dictionaries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      status_transitions: {
        Row: {
          auto_trigger: string | null
          created_at: string
          entity_type: string
          from_status: string
          id: string
          label: string | null
          required_role: Database["public"]["Enums"]["app_role"] | null
          tenant_id: string
          to_status: string
        }
        Insert: {
          auto_trigger?: string | null
          created_at?: string
          entity_type: string
          from_status: string
          id?: string
          label?: string | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string
          to_status: string
        }
        Update: {
          auto_trigger?: string | null
          created_at?: string
          entity_type?: string
          from_status?: string
          id?: string
          label?: string | null
          required_role?: Database["public"]["Enums"]["app_role"] | null
          tenant_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_transitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_usage: {
        Row: {
          current_value: number
          id: string
          limit_value: number | null
          metric_key: string
          period_end: string
          period_start: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          current_value?: number
          id?: string
          limit_value?: number | null
          metric_key: string
          period_end?: string
          period_start?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          current_value?: number
          id?: string
          limit_value?: number | null
          metric_key?: string
          period_end?: string
          period_start?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          billing_email: string | null
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_chairs: number
          max_users: number
          name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          primary_color: string | null
          secondary_color: string | null
          settings: Json
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_chairs?: number
          max_users?: number
          name: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          billing_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_chairs?: number
          max_users?: number
          name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          includes: string[] | null
          is_active: boolean
          max_participants: number | null
          name: string
          price: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          includes?: string[] | null
          is_active?: boolean
          max_participants?: number | null
          name: string
          price?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          includes?: string[] | null
          is_active?: boolean
          max_participants?: number | null
          name?: string
          price?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_assessments: {
        Row: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          data: Json
          id: string
          recorded_at: string
          recorded_by: string | null
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          data?: Json
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          data?: Json
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_assessments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_billable_items: {
        Row: {
          billable_item_id: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          recorded_by: string | null
          tenant_id: string
          treatment_id: string
          unit_price: number
        }
        Insert: {
          billable_item_id: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          tenant_id?: string
          treatment_id: string
          unit_price?: number
        }
        Update: {
          billable_item_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          recorded_by?: string | null
          tenant_id?: string
          treatment_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_billable_items_billable_item_id_fkey"
            columns: ["billable_item_id"]
            isOneToOne: false
            referencedRelation: "billable_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_billable_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_billable_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_chairs: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          notes: string | null
          status: Database["public"]["Enums"]["chair_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          status?: Database["public"]["Enums"]["chair_status"]
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["chair_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_chairs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_course_template_forms: {
        Row: {
          created_at: string
          display_order: number
          form_template_id: string
          id: string
          template_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          form_template_id: string
          id?: string
          template_id: string
          tenant_id?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          form_template_id?: string
          id?: string
          template_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_course_template_forms_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_course_template_forms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "treatment_course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_course_template_forms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_course_templates: {
        Row: {
          appointment_type_id: string
          created_at: string
          default_frequency: Database["public"]["Enums"]["course_frequency"]
          default_session_duration_mins: number | null
          default_sessions: number
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          medication_name: string | null
          medication_notes: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointment_type_id: string
          created_at?: string
          default_frequency?: Database["public"]["Enums"]["course_frequency"]
          default_session_duration_mins?: number | null
          default_sessions?: number
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          medication_name?: string | null
          medication_notes?: string | null
          name: string
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          appointment_type_id?: string
          created_at?: string
          default_frequency?: Database["public"]["Enums"]["course_frequency"]
          default_session_duration_mins?: number | null
          default_sessions?: number
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          medication_name?: string | null
          medication_notes?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_course_templates_appointment_type_id_fkey"
            columns: ["appointment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_course_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_courses: {
        Row: {
          completed_at: string | null
          course_template_id: string | null
          created_at: string
          created_by: string | null
          doctor_id: string | null
          expected_end_date: string | null
          id: string
          notes: string | null
          patient_id: string
          referral_id: string | null
          sessions_completed: number
          started_at: string | null
          status: Database["public"]["Enums"]["treatment_course_status"]
          tenant_id: string
          total_sessions_planned: number | null
          treatment_type_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course_template_id?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          referral_id?: string | null
          sessions_completed?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["treatment_course_status"]
          tenant_id?: string
          total_sessions_planned?: number | null
          treatment_type_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course_template_id?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          expected_end_date?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          referral_id?: string | null
          sessions_completed?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["treatment_course_status"]
          tenant_id?: string
          total_sessions_planned?: number | null
          treatment_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_courses_course_template_id_fkey"
            columns: ["course_template_id"]
            isOneToOne: false
            referencedRelation: "treatment_course_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_courses_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_courses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_courses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_courses_treatment_type_id_fkey"
            columns: ["treatment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_iv_access: {
        Row: {
          access_type: Database["public"]["Enums"]["iv_access_type"]
          created_at: string
          dressing_type: string | null
          flush_solution: string | null
          gauge: string | null
          id: string
          inserted_at: string
          inserted_by: string | null
          insertion_attempts: number | null
          notes: string | null
          removal_site_condition: string | null
          removed_at: string | null
          site_location: string | null
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["iv_access_type"]
          created_at?: string
          dressing_type?: string | null
          flush_solution?: string | null
          gauge?: string | null
          id?: string
          inserted_at?: string
          inserted_by?: string | null
          insertion_attempts?: number | null
          notes?: string | null
          removal_site_condition?: string | null
          removed_at?: string | null
          site_location?: string | null
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["iv_access_type"]
          created_at?: string
          dressing_type?: string | null
          flush_solution?: string | null
          gauge?: string | null
          id?: string
          inserted_at?: string
          inserted_by?: string | null
          insertion_attempts?: number | null
          notes?: string | null
          removal_site_condition?: string | null
          removed_at?: string | null
          site_location?: string | null
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_iv_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_iv_access_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_medications: {
        Row: {
          administered_at: string
          administered_by: string | null
          diluent: string | null
          dosage: string
          id: string
          infusion_method: string | null
          infusion_rate: string | null
          lot_number: string | null
          medication_name: string
          notes: string | null
          route: Database["public"]["Enums"]["medication_route"]
          site_assessment_post: string | null
          site_assessment_pre: string | null
          started_at: string | null
          stopped_at: string | null
          tenant_id: string
          treatment_id: string
          volume_infused_ml: number | null
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          diluent?: string | null
          dosage: string
          id?: string
          infusion_method?: string | null
          infusion_rate?: string | null
          lot_number?: string | null
          medication_name: string
          notes?: string | null
          route?: Database["public"]["Enums"]["medication_route"]
          site_assessment_post?: string | null
          site_assessment_pre?: string | null
          started_at?: string | null
          stopped_at?: string | null
          tenant_id?: string
          treatment_id: string
          volume_infused_ml?: number | null
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          diluent?: string | null
          dosage?: string
          id?: string
          infusion_method?: string | null
          infusion_rate?: string | null
          lot_number?: string | null
          medication_name?: string
          notes?: string | null
          route?: Database["public"]["Enums"]["medication_route"]
          site_assessment_post?: string | null
          site_assessment_pre?: string | null
          started_at?: string | null
          stopped_at?: string | null
          tenant_id?: string
          treatment_id?: string
          volume_infused_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_medications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_medications_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_protocol_steps: {
        Row: {
          config: Json | null
          created_at: string
          description: string | null
          estimated_duration_mins: number | null
          form_template_id: string | null
          id: string
          is_required: boolean
          name: string
          protocol_id: string
          step_order: number
          step_type: Database["public"]["Enums"]["protocol_step_type"]
          tenant_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          description?: string | null
          estimated_duration_mins?: number | null
          form_template_id?: string | null
          id?: string
          is_required?: boolean
          name: string
          protocol_id: string
          step_order: number
          step_type: Database["public"]["Enums"]["protocol_step_type"]
          tenant_id?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          description?: string | null
          estimated_duration_mins?: number | null
          form_template_id?: string | null
          id?: string
          is_required?: boolean
          name?: string
          protocol_id?: string
          step_order?: number
          step_type?: Database["public"]["Enums"]["protocol_step_type"]
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_protocol_steps_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_protocol_steps_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_protocol_steps_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_protocols: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          min_vitals_during: number
          min_vitals_post: number
          name: string
          post_infusion_observation_mins: number
          tenant_id: string
          treatment_type_id: string
          updated_at: string
          version: number
          vitals_initial_period_mins: number
          vitals_interval_initial_mins: number
          vitals_interval_standard_mins: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_vitals_during?: number
          min_vitals_post?: number
          name: string
          post_infusion_observation_mins?: number
          tenant_id?: string
          treatment_type_id: string
          updated_at?: string
          version?: number
          vitals_initial_period_mins?: number
          vitals_interval_initial_mins?: number
          vitals_interval_standard_mins?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          min_vitals_during?: number
          min_vitals_post?: number
          name?: string
          post_infusion_observation_mins?: number
          tenant_id?: string
          treatment_type_id?: string
          updated_at?: string
          version?: number
          vitals_initial_period_mins?: number
          vitals_interval_initial_mins?: number
          vitals_interval_standard_mins?: number
        }
        Relationships: [
          {
            foreignKeyName: "treatment_protocols_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_protocols_treatment_type_id_fkey"
            columns: ["treatment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_reactions: {
        Row: {
          created_at: string
          id: string
          infusion_resumed: boolean | null
          intervention: string[] | null
          intervention_details: string | null
          notes: string | null
          onset_at: string
          onset_minutes_from_start: number | null
          other_symptoms: string | null
          outcome: Database["public"]["Enums"]["reaction_outcome"]
          recorded_by: string | null
          resolved_at: string | null
          resumed_at_rate: string | null
          severity_grade: number
          symptoms: string[] | null
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infusion_resumed?: boolean | null
          intervention?: string[] | null
          intervention_details?: string | null
          notes?: string | null
          onset_at?: string
          onset_minutes_from_start?: number | null
          other_symptoms?: string | null
          outcome?: Database["public"]["Enums"]["reaction_outcome"]
          recorded_by?: string | null
          resolved_at?: string | null
          resumed_at_rate?: string | null
          severity_grade: number
          symptoms?: string[] | null
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infusion_resumed?: boolean | null
          intervention?: string[] | null
          intervention_details?: string | null
          notes?: string | null
          onset_at?: string
          onset_minutes_from_start?: number | null
          other_symptoms?: string | null
          outcome?: Database["public"]["Enums"]["reaction_outcome"]
          recorded_by?: string | null
          resolved_at?: string | null
          resumed_at_rate?: string | null
          severity_grade?: number
          symptoms?: string[] | null
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_reactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_reactions_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_site_checks: {
        Row: {
          action_taken: string | null
          checked_at: string
          checked_by: string | null
          created_at: string
          id: string
          infiltration_grade: number | null
          iv_access_id: string
          notes: string | null
          phlebitis_grade: number | null
          site_appearance: string[] | null
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          action_taken?: string | null
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          infiltration_grade?: number | null
          iv_access_id: string
          notes?: string | null
          phlebitis_grade?: number | null
          site_appearance?: string[] | null
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          action_taken?: string | null
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          id?: string
          infiltration_grade?: number | null
          iv_access_id?: string
          notes?: string | null
          phlebitis_grade?: number | null
          site_appearance?: string[] | null
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_site_checks_iv_access_id_fkey"
            columns: ["iv_access_id"]
            isOneToOne: false
            referencedRelation: "treatment_iv_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_site_checks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_site_checks_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_summaries: {
        Row: {
          edited_at: string | null
          edited_by: string | null
          generated_at: string
          generated_by: string | null
          id: string
          narrative_summary: string | null
          summary_data: Json
          tenant_id: string
          treatment_id: string
        }
        Insert: {
          edited_at?: string | null
          edited_by?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          narrative_summary?: string | null
          summary_data?: Json
          tenant_id?: string
          treatment_id: string
        }
        Update: {
          edited_at?: string | null
          edited_by?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          narrative_summary?: string | null
          summary_data?: Json
          tenant_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_summaries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_summaries_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: true
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_vitals: {
        Row: {
          blood_pressure_diastolic: number | null
          blood_pressure_systolic: number | null
          heart_rate: number | null
          id: string
          notes: string | null
          o2_saturation: number | null
          pain_score: number | null
          phase: Database["public"]["Enums"]["vitals_phase"]
          recorded_at: string
          recorded_by: string | null
          respiratory_rate: number | null
          temperature: number | null
          tenant_id: string
          treatment_id: string
          weight_kg: number | null
        }
        Insert: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          o2_saturation?: number | null
          pain_score?: number | null
          phase: Database["public"]["Enums"]["vitals_phase"]
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
          tenant_id?: string
          treatment_id: string
          weight_kg?: number | null
        }
        Update: {
          blood_pressure_diastolic?: number | null
          blood_pressure_systolic?: number | null
          heart_rate?: number | null
          id?: string
          notes?: string | null
          o2_saturation?: number | null
          pain_score?: number | null
          phase?: Database["public"]["Enums"]["vitals_phase"]
          recorded_at?: string
          recorded_by?: string | null
          respiratory_rate?: number | null
          temperature?: number | null
          tenant_id?: string
          treatment_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "treatment_vitals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_vitals_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          appointment_id: string
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          nurse_id: string
          patient_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["treatment_status"]
          tenant_id: string
          treatment_type_id: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          nurse_id: string
          patient_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          tenant_id?: string
          treatment_type_id: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          nurse_id?: string
          patient_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["treatment_status"]
          tenant_id?: string
          treatment_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_treatment_type_id_fkey"
            columns: ["treatment_type_id"]
            isOneToOne: false
            referencedRelation: "appointment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vitals_thresholds: {
        Row: {
          bp_diastolic_high: number | null
          bp_diastolic_low: number | null
          bp_systolic_high: number | null
          bp_systolic_low: number | null
          created_at: string
          hr_high: number | null
          hr_low: number | null
          id: string
          is_active: boolean
          o2_sat_low: number | null
          protocol_id: string | null
          resp_rate_high: number | null
          resp_rate_low: number | null
          temp_high: number | null
          temp_low: number | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bp_diastolic_high?: number | null
          bp_diastolic_low?: number | null
          bp_systolic_high?: number | null
          bp_systolic_low?: number | null
          created_at?: string
          hr_high?: number | null
          hr_low?: number | null
          id?: string
          is_active?: boolean
          o2_sat_low?: number | null
          protocol_id?: string | null
          resp_rate_high?: number | null
          resp_rate_low?: number | null
          temp_high?: number | null
          temp_low?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Update: {
          bp_diastolic_high?: number | null
          bp_diastolic_low?: number | null
          bp_systolic_high?: number | null
          bp_systolic_low?: number | null
          created_at?: string
          hr_high?: number | null
          hr_low?: number | null
          id?: string
          is_active?: boolean
          o2_sat_low?: number | null
          protocol_id?: string | null
          resp_rate_high?: number | null
          resp_rate_low?: number | null
          temp_high?: number | null
          temp_low?: number | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vitals_thresholds_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vitals_thresholds_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      doctor_has_patient_referral: {
        Args: { _patient_id: string }
        Returns: boolean
      }
      generate_invoice_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      platform_get_all_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          first_name: string
          is_approved: boolean
          last_name: string
          role: string
          tenant_id: string
          tenant_name: string
          user_id: string
        }[]
      }
      platform_get_audit_log: {
        Args: { _limit?: number }
        Returns: {
          action: string
          created_at: string
          details: Json
          id: string
          tenant_id: string
          tenant_name: string
          user_id: string
        }[]
      }
      platform_get_metrics: { Args: never; Returns: Json }
      platform_get_tenant_stats: {
        Args: never
        Returns: {
          active_treatment_count: number
          appointment_count: number
          is_active: boolean
          max_chairs: number
          max_users: number
          patient_count: number
          plan: string
          slug: string
          tenant_id: string
          tenant_name: string
          user_count: number
        }[]
      }
      validate_invite_token: { Args: { invite_token: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "nurse" | "patient" | "doctor"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "checked_in"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
        | "rescheduled"
      assessment_type:
        | "pre_treatment"
        | "during_treatment"
        | "post_treatment"
        | "ketamine_monitoring"
      billable_item_category:
        | "drug"
        | "consumable"
        | "procedure"
        | "nursing_fee"
        | "facility_fee"
        | "other"
      billing_claim_status:
        | "draft"
        | "submitted"
        | "accepted"
        | "rejected"
        | "appealed"
        | "partially_paid"
        | "paid"
        | "written_off"
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      chair_status:
        | "available"
        | "occupied"
        | "cleaning"
        | "blocked"
        | "reserved"
        | "out_of_service"
      checklist_item_status: "pending" | "in_progress" | "completed" | "waived"
      clinical_alert_severity: "info" | "warning" | "critical"
      clinical_alert_status:
        | "active"
        | "acknowledged"
        | "resolved"
        | "dismissed"
      communication_status: "pending" | "sent" | "failed"
      communication_type: "email" | "whatsapp" | "sms"
      contact_status: "new" | "in_progress" | "resolved" | "archived"
      course_frequency:
        | "single"
        | "weekly"
        | "twice_weekly"
        | "biweekly"
        | "monthly"
        | "as_needed"
        | "custom_schedule"
      doctor_report_status:
        | "pending"
        | "generating"
        | "review"
        | "sent"
        | "acknowledged"
      document_type:
        | "prescription"
        | "referral"
        | "consent"
        | "id_copy"
        | "medical_aid_card"
        | "other"
      form_category:
        | "consent"
        | "medical_questionnaire"
        | "administrative"
        | "monitoring"
      form_submission_status: "draft" | "submitted" | "reviewed" | "approved"
      invite_status: "pending" | "accepted" | "expired" | "revoked"
      invoice_status:
        | "draft"
        | "finalized"
        | "submitted"
        | "partially_paid"
        | "paid"
        | "void"
      iv_access_type: "peripheral" | "midline" | "picc" | "port" | "central"
      medication_route: "iv" | "oral" | "im" | "sc"
      patient_gender: "male" | "female" | "other"
      patient_status: "active" | "inactive" | "archived"
      protocol_step_type:
        | "consent_check"
        | "assessment_form"
        | "vitals_capture"
        | "iv_access"
        | "medication_prep"
        | "infusion_start"
        | "monitoring_interval"
        | "site_check"
        | "post_assessment"
        | "discharge_criteria"
      reaction_outcome:
        | "resolved"
        | "ongoing"
        | "escalated"
        | "emergency_transfer"
      referral_status:
        | "pending"
        | "accepted"
        | "scheduled"
        | "completed"
        | "cancelled"
        | "under_review"
        | "info_requested"
        | "rejected"
        | "converted_to_course"
        | "draft"
      referral_urgency: "routine" | "urgent"
      reminder_status: "pending" | "sent" | "failed"
      reminder_type: "email" | "whatsapp" | "sms"
      service_category: "infusion" | "care_pathway"
      subscription_plan: "free" | "starter" | "professional" | "enterprise"
      treatment_course_status:
        | "draft"
        | "onboarding"
        | "ready"
        | "active"
        | "paused"
        | "completing"
        | "completed"
        | "cancelled"
      treatment_status:
        | "pending"
        | "pre_assessment"
        | "in_progress"
        | "post_assessment"
        | "completed"
        | "cancelled"
      vitals_phase: "pre" | "during" | "post"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "nurse", "patient", "doctor"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "checked_in",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
        "rescheduled",
      ],
      assessment_type: [
        "pre_treatment",
        "during_treatment",
        "post_treatment",
        "ketamine_monitoring",
      ],
      billable_item_category: [
        "drug",
        "consumable",
        "procedure",
        "nursing_fee",
        "facility_fee",
        "other",
      ],
      billing_claim_status: [
        "draft",
        "submitted",
        "accepted",
        "rejected",
        "appealed",
        "partially_paid",
        "paid",
        "written_off",
      ],
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      chair_status: [
        "available",
        "occupied",
        "cleaning",
        "blocked",
        "reserved",
        "out_of_service",
      ],
      checklist_item_status: ["pending", "in_progress", "completed", "waived"],
      clinical_alert_severity: ["info", "warning", "critical"],
      clinical_alert_status: [
        "active",
        "acknowledged",
        "resolved",
        "dismissed",
      ],
      communication_status: ["pending", "sent", "failed"],
      communication_type: ["email", "whatsapp", "sms"],
      contact_status: ["new", "in_progress", "resolved", "archived"],
      course_frequency: [
        "single",
        "weekly",
        "twice_weekly",
        "biweekly",
        "monthly",
        "as_needed",
        "custom_schedule",
      ],
      doctor_report_status: [
        "pending",
        "generating",
        "review",
        "sent",
        "acknowledged",
      ],
      document_type: [
        "prescription",
        "referral",
        "consent",
        "id_copy",
        "medical_aid_card",
        "other",
      ],
      form_category: [
        "consent",
        "medical_questionnaire",
        "administrative",
        "monitoring",
      ],
      form_submission_status: ["draft", "submitted", "reviewed", "approved"],
      invite_status: ["pending", "accepted", "expired", "revoked"],
      invoice_status: [
        "draft",
        "finalized",
        "submitted",
        "partially_paid",
        "paid",
        "void",
      ],
      iv_access_type: ["peripheral", "midline", "picc", "port", "central"],
      medication_route: ["iv", "oral", "im", "sc"],
      patient_gender: ["male", "female", "other"],
      patient_status: ["active", "inactive", "archived"],
      protocol_step_type: [
        "consent_check",
        "assessment_form",
        "vitals_capture",
        "iv_access",
        "medication_prep",
        "infusion_start",
        "monitoring_interval",
        "site_check",
        "post_assessment",
        "discharge_criteria",
      ],
      reaction_outcome: [
        "resolved",
        "ongoing",
        "escalated",
        "emergency_transfer",
      ],
      referral_status: [
        "pending",
        "accepted",
        "scheduled",
        "completed",
        "cancelled",
        "under_review",
        "info_requested",
        "rejected",
        "converted_to_course",
        "draft",
      ],
      referral_urgency: ["routine", "urgent"],
      reminder_status: ["pending", "sent", "failed"],
      reminder_type: ["email", "whatsapp", "sms"],
      service_category: ["infusion", "care_pathway"],
      subscription_plan: ["free", "starter", "professional", "enterprise"],
      treatment_course_status: [
        "draft",
        "onboarding",
        "ready",
        "active",
        "paused",
        "completing",
        "completed",
        "cancelled",
      ],
      treatment_status: [
        "pending",
        "pre_assessment",
        "in_progress",
        "post_assessment",
        "completed",
        "cancelled",
      ],
      vitals_phase: ["pre", "during", "post"],
    },
  },
} as const
