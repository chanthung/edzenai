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
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          created_at: string
          feature: string
          id: string
          school_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          school_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_log_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_templates: {
        Row: {
          created_at: string
          grading_type: Database["public"]["Enums"]["grading_type"]
          id: string
          is_default: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grading_type?: Database["public"]["Enums"]["grading_type"]
          id?: string
          is_default?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grading_type?: Database["public"]["Enums"]["grading_type"]
          id?: string
          is_default?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          academic_year_id: string
          assessment_category: Database["public"]["Enums"]["assessment_category"]
          assessment_date: string | null
          assessment_domain: Database["public"]["Enums"]["assessment_domain"]
          assessment_type: string
          class_name: string | null
          created_at: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          academic_year_id: string
          assessment_category?: Database["public"]["Enums"]["assessment_category"]
          assessment_date?: string | null
          assessment_domain?: Database["public"]["Enums"]["assessment_domain"]
          assessment_type: string
          class_name?: string | null
          created_at?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          academic_year_id?: string
          assessment_category?: Database["public"]["Enums"]["assessment_category"]
          assessment_date?: string | null
          assessment_domain?: Database["public"]["Enums"]["assessment_domain"]
          assessment_type?: string
          class_name?: string | null
          created_at?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          marked_by: string | null
          marked_time: string | null
          remarks: string | null
          school_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          marked_time?: string | null
          remarks?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          subject_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          marked_time?: string | null
          remarks?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          subject_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_template_assignments: {
        Row: {
          academic_year_id: string
          class_name: string
          created_at: string
          id: string
          school_id: string
          template_id: string
        }
        Insert: {
          academic_year_id: string
          class_name: string
          created_at?: string
          id?: string
          school_id: string
          template_id: string
        }
        Update: {
          academic_year_id?: string
          class_name?: string
          created_at?: string
          id?: string
          school_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_template_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_template_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_template_assignments_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      competencies: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          school_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          school_id: string
          subject_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          school_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competencies_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competencies_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      component_marks: {
        Row: {
          component_id: string
          created_at: string
          id: string
          marks_obtained: number
          student_mark_id: string
        }
        Insert: {
          component_id: string
          created_at?: string
          id?: string
          marks_obtained?: number
          student_mark_id: string
        }
        Update: {
          component_id?: string
          created_at?: string
          id?: string
          marks_obtained?: number
          student_mark_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "component_marks_component_id_fkey"
            columns: ["component_id"]
            isOneToOne: false
            referencedRelation: "template_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "component_marks_student_mark_id_fkey"
            columns: ["student_mark_id"]
            isOneToOne: false
            referencedRelation: "student_marks"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          elements: Json
          id: string
          is_default: boolean
          margins: Json
          name: string
          orientation: string
          paper_size: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          elements?: Json
          id?: string
          is_default?: boolean
          margins?: Json
          name: string
          orientation?: string
          paper_size?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          elements?: Json
          id?: string
          is_default?: boolean
          margins?: Json
          name?: string
          orientation?: string
          paper_size?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      fee_categories: {
        Row: {
          category_group: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_mandatory: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_mandatory?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_mandatory?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminder_logs: {
        Row: {
          id: string
          installment_id: string
          reminder_type: string
          sent_at: string
          student_id: string
        }
        Insert: {
          id?: string
          installment_id: string
          reminder_type: string
          sent_at?: string
          student_id: string
        }
        Update: {
          id?: string
          installment_id?: string
          reminder_type?: string
          sent_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_reminder_logs_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_reminder_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure_classes: {
        Row: {
          auto_assign: boolean
          class_name: string
          created_at: string
          fee_structure_id: string
          id: string
          new_admission_only: boolean
        }
        Insert: {
          auto_assign?: boolean
          class_name: string
          created_at?: string
          fee_structure_id: string
          id?: string
          new_admission_only?: boolean
        }
        Update: {
          auto_assign?: boolean
          class_name?: string
          created_at?: string
          fee_structure_id?: string
          id?: string
          new_admission_only?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_classes_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          created_at: string
          fee_category_id: string
          id: string
          school_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          fee_category_id: string
          id?: string
          school_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          fee_category_id?: string
          id?: string
          school_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          failed_count: number
          file_name: string
          id: string
          ignored_columns: Json | null
          imported_at: string
          imported_count: number
          issue_rows: Json | null
          school_id: string
          total_rows: number
        }
        Insert: {
          created_at?: string
          failed_count?: number
          file_name: string
          id?: string
          ignored_columns?: Json | null
          imported_at?: string
          imported_count?: number
          issue_rows?: Json | null
          school_id: string
          total_rows?: number
        }
        Update: {
          created_at?: string
          failed_count?: number
          file_name?: string
          id?: string
          ignored_columns?: Json | null
          imported_at?: string
          imported_count?: number
          issue_rows?: Json | null
          school_id?: string
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          display_order: number
          due_date: string
          fee_structure_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          display_order?: number
          due_date: string
          fee_structure_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          display_order?: number
          due_date?: string
          fee_structure_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_link_dispatches: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          initiated_by: string
          school_id: string
          sent_at: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by: string
          school_id: string
          sent_at?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          initiated_by?: string
          school_id?: string
          sent_at?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_link_dispatches_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_link_dispatches_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          admin_notes: string | null
          amount_paid: number | null
          bank_verified: boolean | null
          created_at: string
          file_url: string
          id: string
          installment_id: string
          ocr_amount: number | null
          ocr_confidence: string | null
          ocr_date: string | null
          ocr_raw: Json | null
          ocr_status: string | null
          ocr_transaction_id: string | null
          reference_number: string | null
          rejection_message: string | null
          rejection_reason:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
          school_id: string | null
          status: Database["public"]["Enums"]["proof_status"]
          student_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_paid?: number | null
          bank_verified?: boolean | null
          created_at?: string
          file_url: string
          id?: string
          installment_id: string
          ocr_amount?: number | null
          ocr_confidence?: string | null
          ocr_date?: string | null
          ocr_raw?: Json | null
          ocr_status?: string | null
          ocr_transaction_id?: string | null
          reference_number?: string | null
          rejection_message?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          student_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_paid?: number | null
          bank_verified?: boolean | null
          created_at?: string
          file_url?: string
          id?: string
          installment_id?: string
          ocr_amount?: number | null
          ocr_confidence?: string | null
          ocr_date?: string | null
          ocr_raw?: Json | null
          ocr_status?: string | null
          ocr_transaction_id?: string | null
          reference_number?: string | null
          rejection_message?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
          school_id?: string | null
          status?: Database["public"]["Enums"]["proof_status"]
          student_id?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_proofs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          created_at: string
          id: string
          installment_id: string
          notes: string | null
          payment_date: string
          payment_mode: string | null
          recorded_by: string | null
          reference_number: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_paid: number
          created_at?: string
          id?: string
          installment_id: string
          notes?: string | null
          payment_date: string
          payment_mode?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          id?: string
          installment_id?: string
          notes?: string | null
          payment_date?: string
          payment_mode?: string | null
          recorded_by?: string | null
          reference_number?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_installment_id_fkey"
            columns: ["installment_id"]
            isOneToOne: false
            referencedRelation: "installments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_invoices: {
        Row: {
          annual_discount: number
          cgst: number
          created_at: string
          id: string
          invoice_number: string
          paid_at: string | null
          school_id: string
          sgst: number
          status: string
          subtotal: number
          taxable_amount: number
          total_amount: number
          volume_discount: number
        }
        Insert: {
          annual_discount?: number
          cgst?: number
          created_at?: string
          id?: string
          invoice_number: string
          paid_at?: string | null
          school_id: string
          sgst?: number
          status?: string
          subtotal?: number
          taxable_amount?: number
          total_amount?: number
          volume_discount?: number
        }
        Update: {
          annual_discount?: number
          cgst?: number
          created_at?: string
          id?: string
          invoice_number?: string
          paid_at?: string | null
          school_id?: string
          sgst?: number
          status?: string
          subtotal?: number
          taxable_amount?: number
          total_amount?: number
          volume_discount?: number
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          recorded_by: string | null
          reference_number: string | null
          school_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
          recorded_by?: string | null
          reference_number?: string | null
          school_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          recorded_by?: string | null
          reference_number?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_outcomes: {
        Row: {
          auto_status: string | null
          created_at: string
          failing_subjects: Json | null
          final_pct: number | null
          from_class: string | null
          from_section: string | null
          id: string
          override_reason: string | null
          run_id: string
          status: string
          student_id: string
          to_class: string | null
          to_section: string | null
        }
        Insert: {
          auto_status?: string | null
          created_at?: string
          failing_subjects?: Json | null
          final_pct?: number | null
          from_class?: string | null
          from_section?: string | null
          id?: string
          override_reason?: string | null
          run_id: string
          status: string
          student_id: string
          to_class?: string | null
          to_section?: string | null
        }
        Update: {
          auto_status?: string | null
          created_at?: string
          failing_subjects?: Json | null
          final_pct?: number | null
          from_class?: string | null
          from_section?: string | null
          id?: string
          override_reason?: string | null
          run_id?: string
          status?: string
          student_id?: string
          to_class?: string | null
          to_section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotion_outcomes_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "promotion_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_rules: {
        Row: {
          attendance_threshold: number | null
          best_of_n: number | null
          board: string
          class_range: string
          created_at: string
          custom_rules: Json | null
          english_compulsory: boolean
          grace_marks: number
          id: string
          is_board_exit: boolean
          max_compartment_subjects: number
          min_internal_pct: number | null
          min_practical_pct: number | null
          min_subject_pct: number
          min_theory_pct: number | null
          school_id: string
          updated_at: string
        }
        Insert: {
          attendance_threshold?: number | null
          best_of_n?: number | null
          board?: string
          class_range: string
          created_at?: string
          custom_rules?: Json | null
          english_compulsory?: boolean
          grace_marks?: number
          id?: string
          is_board_exit?: boolean
          max_compartment_subjects?: number
          min_internal_pct?: number | null
          min_practical_pct?: number | null
          min_subject_pct?: number
          min_theory_pct?: number | null
          school_id: string
          updated_at?: string
        }
        Update: {
          attendance_threshold?: number | null
          best_of_n?: number | null
          board?: string
          class_range?: string
          created_at?: string
          custom_rules?: Json | null
          english_compulsory?: boolean
          grace_marks?: number
          id?: string
          is_board_exit?: boolean
          max_compartment_subjects?: number
          min_internal_pct?: number | null
          min_practical_pct?: number | null
          min_subject_pct?: number
          min_theory_pct?: number | null
          school_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      promotion_runs: {
        Row: {
          consent: Json | null
          created_at: string
          from_year_id: string
          id: string
          initiated_at: string
          initiated_by: string | null
          ip_address: string | null
          notes: string | null
          rules_snapshot: Json | null
          school_id: string
          status: string
          to_year_id: string
        }
        Insert: {
          consent?: Json | null
          created_at?: string
          from_year_id: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          ip_address?: string | null
          notes?: string | null
          rules_snapshot?: Json | null
          school_id: string
          status?: string
          to_year_id: string
        }
        Update: {
          consent?: Json | null
          created_at?: string
          from_year_id?: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          ip_address?: string | null
          notes?: string | null
          rules_snapshot?: Json | null
          school_id?: string
          status?: string
          to_year_id?: string
        }
        Relationships: []
      }
      school_admins: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          school_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          school_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_reminder_settings: {
        Row: {
          created_at: string
          enabled: boolean
          offsets_enabled: Json
          school_id: string
          send_hour_ist: number
          templates: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          offsets_enabled?: Json
          school_id: string
          send_hour_ist?: number
          templates?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          offsets_enabled?: Json
          school_id?: string
          send_hour_ist?: number
          templates?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      school_teachers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          role: string
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          role?: string
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          role?: string
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          billing_cycle: string
          board: string | null
          created_at: string
          custom_per_student_fee: number | null
          default_classes: string[] | null
          default_sections: string[] | null
          discount_percent: number
          email: string | null
          expiry_anchor_date: string | null
          id: string
          lifecycle_entered_at: string | null
          logo_url: string | null
          name: string
          next_billing_date: string | null
          onboarding_completed: boolean
          payment_verified: boolean | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          pending_amount: number
          phone: string | null
          qr_code_url: string | null
          scheduled_purge_at: string | null
          subscription_plan: string
          subscription_renewal_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          system_state:
            | Database["public"]["Enums"]["school_system_state"]
            | null
          terminated_at: string | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          billing_cycle?: string
          board?: string | null
          created_at?: string
          custom_per_student_fee?: number | null
          default_classes?: string[] | null
          default_sections?: string[] | null
          discount_percent?: number
          email?: string | null
          expiry_anchor_date?: string | null
          id?: string
          lifecycle_entered_at?: string | null
          logo_url?: string | null
          name: string
          next_billing_date?: string | null
          onboarding_completed?: boolean
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          pending_amount?: number
          phone?: string | null
          qr_code_url?: string | null
          scheduled_purge_at?: string | null
          subscription_plan?: string
          subscription_renewal_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          system_state?:
            | Database["public"]["Enums"]["school_system_state"]
            | null
          terminated_at?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          billing_cycle?: string
          board?: string | null
          created_at?: string
          custom_per_student_fee?: number | null
          default_classes?: string[] | null
          default_sections?: string[] | null
          discount_percent?: number
          email?: string | null
          expiry_anchor_date?: string | null
          id?: string
          lifecycle_entered_at?: string | null
          logo_url?: string | null
          name?: string
          next_billing_date?: string | null
          onboarding_completed?: boolean
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          pending_amount?: number
          phone?: string | null
          qr_code_url?: string | null
          scheduled_purge_at?: string | null
          subscription_plan?: string
          subscription_renewal_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          system_state?:
            | Database["public"]["Enums"]["school_system_state"]
            | null
          terminated_at?: string | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      student_competency_scores: {
        Row: {
          assessment_id: string
          competency_id: string
          created_at: string
          id: string
          mastery_level: Database["public"]["Enums"]["mastery_level"]
          remarks: string | null
          score: number | null
          student_id: string
        }
        Insert: {
          assessment_id: string
          competency_id: string
          created_at?: string
          id?: string
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          remarks?: string | null
          score?: number | null
          student_id: string
        }
        Update: {
          assessment_id?: string
          competency_id?: string
          created_at?: string
          id?: string
          mastery_level?: Database["public"]["Enums"]["mastery_level"]
          remarks?: string | null
          score?: number | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_competency_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competency_scores_competency_id_fkey"
            columns: ["competency_id"]
            isOneToOne: false
            referencedRelation: "competencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_competency_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          class_name: string | null
          created_at: string
          id: string
          section: string | null
          student_id: string
        }
        Insert: {
          academic_year_id: string
          class_name?: string | null
          created_at?: string
          id?: string
          section?: string | null
          student_id: string
        }
        Update: {
          academic_year_id?: string
          class_name?: string | null
          created_at?: string
          id?: string
          section?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          created_at: string
          fee_structure_id: string
          id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          fee_structure_id: string
          id?: string
          student_id: string
        }
        Update: {
          created_at?: string
          fee_structure_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_marks: {
        Row: {
          assessment_id: string
          created_at: string | null
          grade: Database["public"]["Enums"]["grade_scale"] | null
          id: string
          is_grade_based: boolean
          marks_obtained: number
          max_marks: number
          qualitative_feedback: string | null
          remarks: string | null
          student_id: string
          subject_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string | null
          grade?: Database["public"]["Enums"]["grade_scale"] | null
          id?: string
          is_grade_based?: boolean
          marks_obtained: number
          max_marks?: number
          qualitative_feedback?: string | null
          remarks?: string | null
          student_id: string
          subject_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string | null
          grade?: Database["public"]["Enums"]["grade_scale"] | null
          id?: string
          is_grade_based?: boolean
          marks_obtained?: number
          max_marks?: number
          qualitative_feedback?: string | null
          remarks?: string | null
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_marks_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_marks_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          aadhaar_number: string | null
          access_token: string
          address: string | null
          class_name: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          guardian: string | null
          id: string
          name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          religion: string | null
          roll_number: string | null
          school_id: string
          section: string | null
          social_category: string | null
          telegram_registered: boolean
          updated_at: string
        }
        Insert: {
          aadhaar_number?: string | null
          access_token?: string
          address?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          guardian?: string | null
          id?: string
          name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          religion?: string | null
          roll_number?: string | null
          school_id: string
          section?: string | null
          social_category?: string | null
          telegram_registered?: boolean
          updated_at?: string
        }
        Update: {
          aadhaar_number?: string | null
          access_token?: string
          address?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          guardian?: string | null
          id?: string
          name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          religion?: string | null
          roll_number?: string | null
          school_id?: string
          section?: string | null
          social_category?: string | null
          telegram_registered?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_class_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          school_id: string
          subject_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_class_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_class_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          school_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          school_id: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          school_id?: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_lifecycle_logs: {
        Row: {
          created_at: string
          from_stage: string | null
          id: string
          reason: string | null
          school_id: string
          to_stage: string
        }
        Insert: {
          created_at?: string
          from_stage?: string | null
          id?: string
          reason?: string | null
          school_id: string
          to_stage: string
        }
        Update: {
          created_at?: string
          from_stage?: string | null
          id?: string
          reason?: string | null
          school_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_lifecycle_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_pricing: {
        Row: {
          base_monthly_fee: number
          id: string
          per_student_fee: number
          plan: string
          updated_at: string
        }
        Insert: {
          base_monthly_fee?: number
          id?: string
          per_student_fee?: number
          plan: string
          updated_at?: string
        }
        Update: {
          base_monthly_fee?: number
          id?: string
          per_student_fee?: number
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          payment_provider: string
          price_id: string
          product_id: string
          quantity: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          school_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          payment_provider?: string
          price_id: string
          product_id: string
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          payment_provider?: string
          price_id?: string
          product_id?: string
          quantity?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      teacher_class_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          school_id: string
          section: string | null
          teacher_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          school_id: string
          section?: string | null
          teacher_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          school_id?: string
          section?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_class_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_class_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subject_assignments: {
        Row: {
          class_name: string
          created_at: string
          id: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_name: string
          created_at?: string
          id?: string
          school_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_name?: string
          created_at?: string
          id?: string
          school_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subject_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subject_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subject_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "school_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      template_components: {
        Row: {
          created_at: string
          display_order: number
          id: string
          max_marks: number
          name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          max_marks?: number
          name: string
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          max_marks?: number
          name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_components_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_grade_mappings: {
        Row: {
          created_at: string
          display_order: number
          grade_label: string
          id: string
          max_percentage: number
          min_percentage: number
          numerical_grade: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          grade_label: string
          id?: string
          max_percentage: number
          min_percentage: number
          numerical_grade?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          grade_label?: string
          id?: string
          max_percentage?: number
          min_percentage?: number
          numerical_grade?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_grade_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_terms: {
        Row: {
          assessment_date: string | null
          created_at: string
          display_order: number
          id: string
          name: string
          template_id: string
        }
        Insert: {
          assessment_date?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name: string
          template_id: string
        }
        Update: {
          assessment_date?: string | null
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_terms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "assessment_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invites: {
        Row: {
          accepted_at: string | null
          assignments: Json
          created_at: string
          delivery_method: Database["public"]["Enums"]["invite_delivery_method"]
          email: string
          expires_at: string
          id: string
          invited_by: string
          last_sent_at: string
          name: string
          phone: string | null
          role: string
          school_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assignments?: Json
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["invite_delivery_method"]
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          last_sent_at?: string
          name: string
          phone?: string | null
          role: string
          school_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assignments?: Json
          created_at?: string
          delivery_method?: Database["public"]["Enums"]["invite_delivery_method"]
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          last_sent_at?: string
          name?: string
          phone?: string | null
          role?: string
          school_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invites_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
      volume_discount_tiers: {
        Row: {
          discount_percent: number
          id: string
          max_students: number | null
          min_students: number
          updated_at: string
        }
        Insert: {
          discount_percent?: number
          id?: string
          max_students?: number | null
          min_students: number
          updated_at?: string
        }
        Update: {
          discount_percent?: number
          id?: string
          max_students?: number | null
          min_students?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_assign_fees_for_class: {
        Args: {
          _academic_year_id: string
          _class_name: string
          _fee_structure_id: string
          _new_admission_only?: boolean
        }
        Returns: number
      }
      auto_assign_fees_for_student: {
        Args: { _academic_year_id: string; _student_id: string }
        Returns: undefined
      }
      claim_parent_link_dispatch: {
        Args: {
          _initiated_by: string
          _school_id: string
          _student_id: string
          _window_seconds?: number
        }
        Returns: {
          dispatch_id: string
          is_duplicate: boolean
        }[]
      }
      compute_lifecycle_stage: {
        Args: { _anchor_date: string }
        Returns: string
      }
      create_school_with_primary_admin: {
        Args: { _school_name: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_accountant_school_ids: { Args: never; Returns: string[] }
      get_nep_stage: {
        Args: { class_name: string }
        Returns: Database["public"]["Enums"]["nep_learning_stage"]
      }
      get_school_effective_state: {
        Args: { _school_id: string }
        Returns: Database["public"]["Enums"]["school_system_state"]
      }
      get_student_attendance_by_access_token: {
        Args: { _access_token: string }
        Returns: {
          date: string
          remarks: string
          status: Database["public"]["Enums"]["attendance_status"]
        }[]
      }
      get_student_by_access_token: {
        Args: { _access_token: string }
        Returns: {
          class_name: string
          id: string
          name: string
          roll_number: string
          school_id: string
          section: string
        }[]
      }
      get_student_marks_by_access_token: {
        Args: { _access_token: string }
        Returns: {
          assessment_date: string
          assessment_id: string
          assessment_name: string
          assessment_type: string
          id: string
          marks_obtained: number
          max_marks: number
          remarks: string
          student_id: string
          subject_code: string
          subject_id: string
          subject_name: string
        }[]
      }
      get_teacher_school_ids: { Args: never; Returns: string[] }
      get_user_school_ids: { Args: never; Returns: string[] }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      is_school_admin: { Args: { _school_id: string }; Returns: boolean }
      is_school_restricted: { Args: { _school_id: string }; Returns: boolean }
      is_school_teacher: { Args: { _school_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      normalize_class_name: { Args: { raw_name: string }; Returns: string }
      normalize_indian_phone: { Args: { raw: string }; Returns: string }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_payment_proof_insert: {
        Args: { _installment_id: string; _student_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "platform_admin" | "school_admin" | "teacher" | "accountant"
      assessment_category: "formative" | "summative"
      assessment_domain: "cognitive" | "affective" | "psychomotor"
      attendance_status: "present" | "absent" | "late" | "leave"
      fee_status: "upcoming" | "due" | "overdue" | "paid"
      grade_scale: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "E"
      grading_type: "percentage" | "custom_grades"
      invite_delivery_method: "email" | "whatsapp" | "both"
      mastery_level: "beginning" | "developing" | "proficient" | "advanced"
      nep_learning_stage:
        | "foundational"
        | "preparatory"
        | "middle"
        | "secondary"
      proof_rejection_reason:
        | "amount_mismatch"
        | "old_reused_screenshot"
        | "payment_not_received"
        | "wrong_month_selected"
        | "screenshot_unclear"
        | "incorrect_reference"
        | "other"
        | "amount_mismatch_ocr"
      proof_status: "pending" | "verified" | "rejected"
      school_system_state:
        | "trial_active"
        | "trial_expired"
        | "subscription_active"
        | "restricted_mode"
        | "grace_period"
        | "warning_phase"
        | "suspended"
        | "terminated"
      subject_type: "academic" | "co_curricular" | "vocational"
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
      app_role: ["platform_admin", "school_admin", "teacher", "accountant"],
      assessment_category: ["formative", "summative"],
      assessment_domain: ["cognitive", "affective", "psychomotor"],
      attendance_status: ["present", "absent", "late", "leave"],
      fee_status: ["upcoming", "due", "overdue", "paid"],
      grade_scale: ["A+", "A", "B+", "B", "C+", "C", "D", "E"],
      grading_type: ["percentage", "custom_grades"],
      invite_delivery_method: ["email", "whatsapp", "both"],
      mastery_level: ["beginning", "developing", "proficient", "advanced"],
      nep_learning_stage: [
        "foundational",
        "preparatory",
        "middle",
        "secondary",
      ],
      proof_rejection_reason: [
        "amount_mismatch",
        "old_reused_screenshot",
        "payment_not_received",
        "wrong_month_selected",
        "screenshot_unclear",
        "incorrect_reference",
        "other",
        "amount_mismatch_ocr",
      ],
      proof_status: ["pending", "verified", "rejected"],
      school_system_state: [
        "trial_active",
        "trial_expired",
        "subscription_active",
        "restricted_mode",
        "grace_period",
        "warning_phase",
        "suspended",
        "terminated",
      ],
      subject_type: ["academic", "co_curricular", "vocational"],
    },
  },
} as const
