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
        }
        Relationships: [
          {
            foreignKeyName: "appointment_reminders_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
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
          updated_at?: string
        }
        Relationships: []
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
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
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
          treatment_id?: string
          triggered_at?: string
        }
        Relationships: [
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
          type?: Database["public"]["Enums"]["communication_type"]
        }
        Relationships: []
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
        }
        Relationships: []
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
        }
        Relationships: [
          {
            foreignKeyName: "discharge_criteria_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "treatment_protocols"
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
          treatment_type_id?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: [
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
          phone: string | null
          postal_code: string | null
          practice_name: string | null
          practice_number: string | null
          specialisation: string | null
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
          phone?: string | null
          postal_code?: string | null
          practice_name?: string | null
          practice_number?: string | null
          specialisation?: string | null
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
          phone?: string | null
          postal_code?: string | null
          practice_name?: string | null
          practice_number?: string | null
          specialisation?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          text_body?: string | null
          updated_at?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
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
          witness_signature_data: string | null
        }
        Insert: {
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
          witness_signature_data?: string | null
        }
        Update: {
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
          required_for_treatment_types: string[] | null
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
          required_for_treatment_types?: string[] | null
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
          required_for_treatment_types?: string[] | null
          updated_at?: string
          version?: number
        }
        Relationships: []
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
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ketamine_monitoring_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
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
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          token: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          id: string
          notes: string | null
          patient_id: string
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
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          diagnosis: string | null
          doctor_id: string
          id: string
          notes: string | null
          patient_email: string | null
          patient_first_name: string
          patient_id: string | null
          patient_last_name: string
          patient_phone: string | null
          prescription_notes: string | null
          referral_document_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["referral_status"]
          treatment_requested: string | null
          updated_at: string
          urgency: Database["public"]["Enums"]["referral_urgency"]
        }
        Insert: {
          created_at?: string
          diagnosis?: string | null
          doctor_id: string
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_first_name: string
          patient_id?: string | null
          patient_last_name: string
          patient_phone?: string | null
          prescription_notes?: string | null
          referral_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          treatment_requested?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["referral_urgency"]
        }
        Update: {
          created_at?: string
          diagnosis?: string | null
          doctor_id?: string
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_first_name?: string
          patient_id?: string | null
          patient_last_name?: string
          patient_phone?: string | null
          prescription_notes?: string | null
          referral_document_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["referral_status"]
          treatment_requested?: string | null
          updated_at?: string
          urgency?: Database["public"]["Enums"]["referral_urgency"]
        }
        Relationships: [
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
          updated_at?: string
        }
        Relationships: []
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
          to_status?: string
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
          updated_at?: string
        }
        Relationships: []
      }
      treatment_assessments: {
        Row: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          data: Json
          id: string
          recorded_at: string
          recorded_by: string | null
          treatment_id: string
        }
        Insert: {
          assessment_type: Database["public"]["Enums"]["assessment_type"]
          data?: Json
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          treatment_id: string
        }
        Update: {
          assessment_type?: Database["public"]["Enums"]["assessment_type"]
          data?: Json
          id?: string
          recorded_at?: string
          recorded_by?: string | null
          treatment_id?: string
        }
        Relationships: [
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
          updated_at?: string
        }
        Relationships: []
      }
      treatment_courses: {
        Row: {
          completed_at: string | null
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
          total_sessions_planned: number
          treatment_type_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
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
          total_sessions_planned?: number
          treatment_type_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
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
          total_sessions_planned?: number
          treatment_type_id?: string
          updated_at?: string
        }
        Relationships: [
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
          treatment_id?: string
        }
        Relationships: [
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
          treatment_id?: string
          volume_infused_ml?: number | null
        }
        Relationships: [
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
          treatment_type_id?: string
          updated_at?: string
          version?: number
          vitals_initial_period_mins?: number
          vitals_interval_initial_mins?: number
          vitals_interval_standard_mins?: number
        }
        Relationships: [
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
          treatment_id?: string
        }
        Relationships: [
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
          treatment_id?: string
        }
        Relationships: [
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
          treatment_id?: string
          weight_kg?: number | null
        }
        Relationships: [
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
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      referral_urgency: "routine" | "urgent"
      reminder_status: "pending" | "sent" | "failed"
      reminder_type: "email" | "whatsapp" | "sms"
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
      ],
      referral_urgency: ["routine", "urgent"],
      reminder_status: ["pending", "sent", "failed"],
      reminder_type: ["email", "whatsapp", "sms"],
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
