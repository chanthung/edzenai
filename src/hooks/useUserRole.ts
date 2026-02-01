import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'platform_admin' | 'school_admin' | 'teacher' | null;

export interface UserRoleInfo {
  role: UserRole;
  schoolId: string | null;
  isTeacher: boolean;
  isSchoolAdmin: boolean;
  isPlatformAdmin: boolean;
}

export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRoleInfo> => {
      if (!user?.id) {
        return { role: null, schoolId: null, isTeacher: false, isSchoolAdmin: false, isPlatformAdmin: false };
      }

      // Check if platform admin
      const { data: platformRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'platform_admin')
        .maybeSingle();

      if (platformRole) {
        return { 
          role: 'platform_admin', 
          schoolId: null, 
          isTeacher: false, 
          isSchoolAdmin: false, 
          isPlatformAdmin: true 
        };
      }

      // Check if school admin
      const { data: schoolAdmin } = await supabase
        .from('school_admins')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (schoolAdmin) {
        return { 
          role: 'school_admin', 
          schoolId: schoolAdmin.school_id, 
          isTeacher: false, 
          isSchoolAdmin: true, 
          isPlatformAdmin: false 
        };
      }

      // Check if teacher
      const { data: teacher } = await supabase
        .from('school_teachers')
        .select('school_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (teacher) {
        return { 
          role: 'teacher', 
          schoolId: teacher.school_id, 
          isTeacher: true, 
          isSchoolAdmin: false, 
          isPlatformAdmin: false 
        };
      }

      return { role: null, schoolId: null, isTeacher: false, isSchoolAdmin: false, isPlatformAdmin: false };
    },
    enabled: !!user?.id,
  });

  return {
    ...data,
    isLoading,
    error,
    role: data?.role ?? null,
    schoolId: data?.schoolId ?? null,
    isTeacher: data?.isTeacher ?? false,
    isSchoolAdmin: data?.isSchoolAdmin ?? false,
    isPlatformAdmin: data?.isPlatformAdmin ?? false,
  };
}
