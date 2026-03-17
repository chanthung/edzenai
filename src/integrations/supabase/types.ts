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
      fee_categories: {
        Row: {
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
      payment_proofs: {
        Row: {
          admin_notes: string | null
          bank_verified: boolean | null
          created_at: string
          file_url: string
          id: string
          installment_id: string
          reference_number: string | null
          rejection_message: string | null
          rejection_reason:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
          status: Database["public"]["Enums"]["proof_status"]
          student_id: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          bank_verified?: boolean | null
          created_at?: string
          file_url: string
          id?: string
          installment_id: string
          reference_number?: string | null
          rejection_message?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
          status?: Database["public"]["Enums"]["proof_status"]
          student_id: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          bank_verified?: boolean | null
          created_at?: string
          file_url?: string
          id?: string
          installment_id?: string
          reference_number?: string | null
          rejection_message?: string | null
          rejection_reason?:
            | Database["public"]["Enums"]["proof_rejection_reason"]
            | null
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
      school_teachers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
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
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          payment_verified: boolean | null
          payment_verified_at: string | null
          payment_verified_by: string | null
          phone: string | null
          qr_code_url: string | null
          subscription_renewal_date: string | null
          subscription_start_date: string | null
          subscription_status: string | null
          subscription_type: string | null
          system_state:
            | Database["public"]["Enums"]["school_system_state"]
            | null
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone?: string | null
          qr_code_url?: string | null
          subscription_renewal_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          system_state?:
            | Database["public"]["Enums"]["school_system_state"]
            | null
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          payment_verified_by?: string | null
          phone?: string | null
          qr_code_url?: string | null
          subscription_renewal_date?: string | null
          subscription_start_date?: string | null
          subscription_status?: string | null
          subscription_type?: string | null
          system_state?:
            | Database["public"]["Enums"]["school_system_state"]
            | null
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
          access_token: string
          address: string | null
          class_name: string | null
          created_at: string
          guardian: string | null
          id: string
          name: string
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          roll_number: string | null
          school_id: string
          section: string | null
          telegram_registered: boolean
          updated_at: string
        }
        Insert: {
          access_token?: string
          address?: string | null
          class_name?: string | null
          created_at?: string
          guardian?: string | null
          id?: string
          name: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          roll_number?: string | null
          school_id: string
          section?: string | null
          telegram_registered?: boolean
          updated_at?: string
        }
        Update: {
          access_token?: string
          address?: string | null
          class_name?: string | null
          created_at?: string
          guardian?: string | null
          id?: string
          name?: string
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          roll_number?: string | null
          school_id?: string
          section?: string | null
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
      subjects: {
        Row: {
          class_name: string | null
          code: string | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          school_id: string
          subject_type: Database["public"]["Enums"]["subject_type"]
        }
        Insert: {
          class_name?: string | null
          code?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          school_id: string
          subject_type?: Database["public"]["Enums"]["subject_type"]
        }
        Update: {
          class_name?: string | null
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
          created_at: string
          display_order: number
          id: string
          name: string
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          template_id: string
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_school_with_primary_admin: {
        Args: { _school_name: string }
        Returns: string
      }
      get_nep_stage: {
        Args: { class_name: string }
        Returns: Database["public"]["Enums"]["nep_learning_stage"]
      }
      get_school_effective_state: {
        Args: { _school_id: string }
        Returns: Database["public"]["Enums"]["school_system_state"]
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
    }
    Enums: {
      app_role: "platform_admin" | "school_admin" | "teacher"
      assessment_category: "formative" | "summative"
      assessment_domain: "cognitive" | "affective" | "psychomotor"
      fee_status: "upcoming" | "due" | "overdue" | "paid"
      grade_scale: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "E"
      grading_type: "percentage" | "custom_grades"
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
      proof_status: "pending" | "verified" | "rejected"
      school_system_state:
        | "trial_active"
        | "trial_expired"
        | "subscription_active"
        | "restricted_mode"
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
      app_role: ["platform_admin", "school_admin", "teacher"],
      assessment_category: ["formative", "summative"],
      assessment_domain: ["cognitive", "affective", "psychomotor"],
      fee_status: ["upcoming", "due", "overdue", "paid"],
      grade_scale: ["A+", "A", "B+", "B", "C+", "C", "D", "E"],
      grading_type: ["percentage", "custom_grades"],
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
      ],
      proof_status: ["pending", "verified", "rejected"],
      school_system_state: [
        "trial_active",
        "trial_expired",
        "subscription_active",
        "restricted_mode",
      ],
      subject_type: ["academic", "co_curricular", "vocational"],
    },
  },
} as const
