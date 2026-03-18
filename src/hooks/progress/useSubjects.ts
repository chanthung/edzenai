import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from './useResolvedSchoolId';
import { useToast } from '@/hooks/use-toast';

export type SubjectType = 'academic' | 'co_curricular' | 'vocational';

export interface Subject {
  id: string;
  school_id: string;
  name: string;
  code: string | null;
  display_order: number | null;
  created_at: string | null;
  subject_type: SubjectType;
}

export interface SubjectWithClasses extends Subject {
  assigned_classes: string[];
}

/**
 * Fetch subjects. When className is provided, filters via subject_class_assignments junction table.
 */
export function useSubjects(className?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['subjects', schoolId, className],
    queryFn: async () => {
      if (!schoolId) return [];

      if (className) {
        // Get subject IDs assigned to this class
        const { data: assignments, error: aErr } = await supabase
          .from('subject_class_assignments')
          .select('subject_id')
          .eq('school_id', schoolId)
          .eq('class_name', className);
        if (aErr) throw aErr;
        const subjectIds = (assignments || []).map(a => a.subject_id);
        if (subjectIds.length === 0) return [];

        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolId)
          .in('id', subjectIds)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true });
        if (error) throw error;
        return data as Subject[];
      }

      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', schoolId)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Subject[];
    },
    enabled: !!schoolId,
  });
}

/**
 * Fetch subjects with their assigned classes for the subjects list page.
 */
export function useSubjectsWithClasses() {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['subjects-with-classes', schoolId],
    queryFn: async () => {
      if (!schoolId) return [];

      const [subjectsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('subjects')
          .select('*')
          .eq('school_id', schoolId)
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),
        supabase
          .from('subject_class_assignments')
          .select('subject_id, class_name')
          .eq('school_id', schoolId),
      ]);

      if (subjectsRes.error) throw subjectsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      const classMap = new Map<string, string[]>();
      for (const a of assignmentsRes.data || []) {
        const list = classMap.get(a.subject_id) || [];
        list.push(a.class_name);
        classMap.set(a.subject_id, list);
      }

      return (subjectsRes.data || []).map(s => ({
        ...s,
        assigned_classes: (classMap.get(s.id) || []).sort(),
      })) as SubjectWithClasses[];
    },
    enabled: !!schoolId,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      code?: string;
      class_names: string[];
      display_order?: number;
      subject_type?: SubjectType;
    }) => {
      if (!schoolId) throw new Error('No school found');

      // Check if subject already exists (case-insensitive)
      const { data: existing } = await supabase
        .from('subjects')
        .select('id')
        .eq('school_id', schoolId)
        .ilike('name', input.name.trim())
        .eq('subject_type', input.subject_type || 'academic')
        .maybeSingle();

      let subjectId: string;

      if (existing) {
        subjectId = existing.id;
      } else {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            school_id: schoolId,
            name: input.name.trim(),
            code: input.code || null,
            display_order: input.display_order || 0,
            subject_type: input.subject_type || 'academic',
          })
          .select()
          .single();
        if (error) throw error;
        subjectId = data.id;
      }

      // Insert class assignments
      if (input.class_names.length > 0) {
        const assignments = input.class_names.map(cn => ({
          subject_id: subjectId,
          school_id: schoolId,
          class_name: cn,
        }));
        const { error: aErr } = await supabase
          .from('subject_class_assignments')
          .upsert(assignments, { onConflict: 'subject_id,class_name' });
        if (aErr) throw aErr;
      }

      return { id: subjectId, existed: !!existing };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects-with-classes'] });
      toast({
        title: result.existed
          ? 'Subject assigned to selected classes'
          : 'Subject created and assigned successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to create subject',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      class_names,
      ...updates
    }: {
      id: string;
      name?: string;
      code?: string;
      display_order?: number;
      subject_type?: SubjectType;
      class_names?: string[];
    }) => {
      // Update subject fields
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('subjects')
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      }

      // Update class assignments if provided
      if (class_names !== undefined && schoolId) {
        // Delete existing assignments
        await supabase
          .from('subject_class_assignments')
          .delete()
          .eq('subject_id', id);

        // Insert new ones
        if (class_names.length > 0) {
          const assignments = class_names.map(cn => ({
            subject_id: id,
            school_id: schoolId,
            class_name: cn,
          }));
          const { error: aErr } = await supabase
            .from('subject_class_assignments')
            .insert(assignments);
          if (aErr) throw aErr;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects-with-classes'] });
      toast({ title: 'Subject updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update subject',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['subjects-with-classes'] });
      toast({ title: 'Subject deleted successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete subject',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
