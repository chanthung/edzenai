import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';

export interface AssessmentTemplate {
  id: string;
  school_id: string;
  name: string;
  grading_type: 'percentage' | 'custom_grades';
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateTerm {
  id: string;
  template_id: string;
  name: string;
  assessment_date: string | null;
  display_order: number;
}

export interface TemplateComponent {
  id: string;
  template_id: string;
  name: string;
  max_marks: number;
  display_order: number;
}

export interface TemplateGradeMapping {
  id: string;
  template_id: string;
  min_percentage: number;
  max_percentage: number;
  grade_label: string;
  numerical_grade: number | null;
  display_order: number;
}

export interface ClassTemplateAssignment {
  id: string;
  school_id: string;
  template_id: string;
  class_name: string;
  academic_year_id: string;
}

// ─── Templates ───

export function useAssessmentTemplates() {
  const { data: school } = useSchool();
  return useQuery({
    queryKey: ['assessment-templates', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_templates')
        .select('*')
        .eq('school_id', school!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AssessmentTemplate[];
    },
    enabled: !!school?.id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { data: school } = useSchool();
  return useMutation({
    mutationFn: async (input: { name: string; grading_type: 'percentage' | 'custom_grades'; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('assessment_templates')
        .insert({ ...input, school_id: school!.id })
        .select()
        .single();
      if (error) throw error;
      return data as AssessmentTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessment-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssessmentTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('assessment_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessment-templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assessment_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assessment-templates'] }),
  });
}

// ─── Terms ───

export function useTemplateTerms(templateId: string | null) {
  return useQuery({
    queryKey: ['template-terms', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_terms')
        .select('*')
        .eq('template_id', templateId!)
        .order('display_order');
      if (error) throw error;
      return data as TemplateTerm[];
    },
    enabled: !!templateId,
  });
}

export function useSaveTemplateTerms() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, terms }: { templateId: string; terms: { name: string; assessment_date?: string | null; display_order: number }[] }) => {
      // Delete existing, then insert new
      await supabase.from('template_terms').delete().eq('template_id', templateId);
      if (terms.length > 0) {
        const { error } = await supabase
          .from('template_terms')
          .insert(terms.map(t => ({ ...t, assessment_date: t.assessment_date || null, template_id: templateId } as any)));
        if (error) throw error;
      }
    },
    onSuccess: (_, { templateId }) => qc.invalidateQueries({ queryKey: ['template-terms', templateId] }),
  });
}

// ─── Components ───

export function useTemplateComponents(templateId: string | null) {
  return useQuery({
    queryKey: ['template-components', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_components')
        .select('*')
        .eq('template_id', templateId!)
        .order('display_order');
      if (error) throw error;
      return data as TemplateComponent[];
    },
    enabled: !!templateId,
  });
}

export function useSaveTemplateComponents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, components }: { templateId: string; components: { name: string; max_marks: number; display_order: number }[] }) => {
      await supabase.from('template_components').delete().eq('template_id', templateId);
      if (components.length > 0) {
        const { error } = await supabase
          .from('template_components')
          .insert(components.map(c => ({ ...c, template_id: templateId })));
        if (error) throw error;
      }
    },
    onSuccess: (_, { templateId }) => qc.invalidateQueries({ queryKey: ['template-components', templateId] }),
  });
}

// ─── Grade Mappings ───

export function useTemplateGradeMappings(templateId: string | null) {
  return useQuery({
    queryKey: ['template-grade-mappings', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_grade_mappings')
        .select('*')
        .eq('template_id', templateId!)
        .order('display_order');
      if (error) throw error;
      return data as TemplateGradeMapping[];
    },
    enabled: !!templateId,
  });
}

export function useSaveTemplateGradeMappings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, mappings }: { templateId: string; mappings: { min_percentage: number; max_percentage: number; grade_label: string; numerical_grade?: number | null; display_order: number }[] }) => {
      await supabase.from('template_grade_mappings').delete().eq('template_id', templateId);
      if (mappings.length > 0) {
        const { error } = await supabase
          .from('template_grade_mappings')
          .insert(mappings.map(m => ({ ...m, template_id: templateId })));
        if (error) throw error;
      }
    },
    onSuccess: (_, { templateId }) => qc.invalidateQueries({ queryKey: ['template-grade-mappings', templateId] }),
  });
}

// ─── Class Assignments ───

export function useClassTemplateAssignments(academicYearId: string | null) {
  const { data: school } = useSchool();
  return useQuery({
    queryKey: ['class-template-assignments', school?.id, academicYearId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_template_assignments')
        .select('*')
        .eq('school_id', school!.id)
        .eq('academic_year_id', academicYearId!);
      if (error) throw error;
      return data as ClassTemplateAssignment[];
    },
    enabled: !!school?.id && !!academicYearId,
  });
}

export function useAssignTemplateToClass() {
  const qc = useQueryClient();
  const { data: school } = useSchool();
  return useMutation({
    mutationFn: async ({ templateId, className, academicYearId }: { templateId: string; className: string; academicYearId: string }) => {
      const { data, error } = await supabase
        .from('class_template_assignments')
        .upsert(
          { school_id: school!.id, template_id: templateId, class_name: className, academic_year_id: academicYearId },
          { onConflict: 'school_id,class_name,academic_year_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-template-assignments'] }),
  });
}

export function useRemoveClassAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('class_template_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['class-template-assignments'] }),
  });
}
