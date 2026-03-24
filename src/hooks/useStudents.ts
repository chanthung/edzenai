import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from './useSchool';
import { useSubscriptionStatus } from './useSubscriptionStatus';

export interface Student {
  id: string;
  school_id: string;
  name: string;
  roll_number: string | null;
  class_name: string | null;
  section: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  guardian: string | null;
  address: string | null;
  gender: string | null;
  date_of_birth: string | null;
  social_category: string | null;
  aadhaar_number: string | null;
  religion: string | null;
  access_token: string;
  telegram_registered: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentInsert {
  name: string;
  roll_number?: string;
  class_name?: string;
  section?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  guardian?: string;
  address?: string;
  gender?: string;
  date_of_birth?: string;
  social_category?: string;
  aadhaar_number?: string;
  religion?: string;
  academic_year_id?: string;
}

export function useStudents() {
  const { data: school } = useSchool();
  
  return useQuery({
    queryKey: ['students', school?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('school_id', school!.id)
        .order('name');
      
      if (error) throw error;
      return data as Student[];
    },
    enabled: !!school,
  });
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId!)
        .single();
      
      if (error) throw error;
      return data as Student;
    },
    enabled: !!studentId,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (student: StudentInsert) => {
      if (isRestricted && !canPerform('add_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      // Extract academic_year_id from the input (not to be inserted into students table)
      const { academic_year_id, ...studentData } = student;
      
      // 1. Create the student record
      const { data, error } = await supabase
        .from('students')
        .insert({ ...studentData, school_id: school!.id })
        .select()
        .single();
      
      if (error) throw error;
      
      // 2. Create the enrollment record if academic_year_id is provided
      if (academic_year_id && data) {
        const { error: enrollmentError } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: data.id,
            academic_year_id: academic_year_id,
            class_name: studentData.class_name || null,
            section: studentData.section || null,
          });
        
        if (enrollmentError) {
          console.error('Failed to create enrollment:', enrollmentError);
        }

        // 3. Auto-assign fees based on class
        try {
          await supabase.rpc('auto_assign_fees_for_student', {
            _student_id: data.id,
            _academic_year_id: academic_year_id,
          });
        } catch (feeError) {
          console.error('Failed to auto-assign fees:', feeError);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
      queryClient.invalidateQueries({ queryKey: ['student-enrollments'] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Student> & { id: string }) => {
      if (isRestricted && !canPerform('edit_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  const { data: school } = useSchool();
  const { isRestricted, canPerform } = useSubscriptionStatus();
  
  return useMutation({
    mutationFn: async (id: string) => {
      if (isRestricted && !canPerform('delete_student')) {
        throw new Error('Operation not permitted. School is in restricted mode.');
      }
      
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', school?.id] });
    },
  });
}
