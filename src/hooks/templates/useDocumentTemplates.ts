import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from '@/hooks/progress/useResolvedSchoolId';
import type { DocumentTemplate, CanvasElementNode } from '@/lib/templates/types';

const TABLE = 'document_templates';

export function useDocumentTemplates(docType: 'report_card' = 'report_card') {
  const { data: schoolId } = useResolvedSchoolId();
  return useQuery({
    queryKey: ['document-templates', schoolId, docType],
    queryFn: async () => {
      if (!schoolId) return [] as DocumentTemplate[];
      const { data, error } = await supabase
        .from(TABLE as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('doc_type', docType)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as DocumentTemplate[];
    },
    enabled: !!schoolId,
  });
}

export function useDocumentTemplate(id: string | null) {
  return useQuery({
    queryKey: ['document-template', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(TABLE as any)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DocumentTemplate | null;
    },
    enabled: !!id,
  });
}

export function useDefaultDocumentTemplate(docType: 'report_card' = 'report_card') {
  const { data: schoolId } = useResolvedSchoolId();
  return useQuery({
    queryKey: ['document-template-default', schoolId, docType],
    queryFn: async () => {
      if (!schoolId) return null;
      const { data, error } = await supabase
        .from(TABLE as any)
        .select('*')
        .eq('school_id', schoolId)
        .eq('doc_type', docType)
        .eq('is_default', true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as DocumentTemplate | null;
    },
    enabled: !!schoolId,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  return useMutation({
    mutationFn: async (input: { name: string; elements: CanvasElementNode[] }) => {
      if (!schoolId) throw new Error('No school');
      const { data, error } = await supabase
        .from(TABLE as any)
        .insert({
          school_id: schoolId,
          doc_type: 'report_card',
          name: input.name,
          elements: input.elements as any,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as DocumentTemplate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: DocumentTemplate) => {
      if (!t.id) throw new Error('No id');
      const { error } = await supabase
        .from(TABLE as any)
        .update({
          name: t.name,
          paper_size: t.paper_size,
          orientation: t.orientation,
          margins: t.margins as any,
          elements: t.elements as any,
        } as any)
        .eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: (_d, t) => {
      qc.invalidateQueries({ queryKey: ['document-templates'] });
      qc.invalidateQueries({ queryKey: ['document-template', t.id] });
      qc.invalidateQueries({ queryKey: ['document-template-default'] });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(TABLE as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['document-templates'] }),
  });
}

export function useSetDefaultTemplate() {
  const qc = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!schoolId) throw new Error('No school');
      // Clear existing default for this school+doc_type
      const { error: clearErr } = await supabase
        .from(TABLE as any)
        .update({ is_default: false } as any)
        .eq('school_id', schoolId)
        .eq('doc_type', 'report_card')
        .eq('is_default', true);
      if (clearErr) throw clearErr;
      const { error } = await supabase
        .from(TABLE as any)
        .update({ is_default: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document-templates'] });
      qc.invalidateQueries({ queryKey: ['document-template-default'] });
    },
  });
}
