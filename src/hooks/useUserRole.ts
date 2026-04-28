import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'platform_admin' | 'school_admin' | 'teacher' | 'accountant' | 'partner' | null;

export interface UserRoleInfo {
  role: UserRole;
  schoolId: string | null;
  isTeacher: boolean;
  isAccountant: boolean;
  isSchoolAdmin: boolean;
  isPlatformAdmin: boolean;
  isPartner: boolean;
}

export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async (): Promise<UserRoleInfo> => {
      const empty = { role: null as UserRole, schoolId: null, isTeacher: false, isAccountant: false, isSchoolAdmin: false, isPlatformAdmin: false, isPartner: false };
      if (!user?.id) return empty;

      // Check if platform admin
      const { data: platformRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'platform_admin')
        .maybeSingle();

      if (platformRole) {
        return { role: 'platform_admin', schoolId: null, isTeacher: false, isAccountant: false, isSchoolAdmin: false, isPlatformAdmin: true, isPartner: false };
      }

      // Check if school admin
      const { data: schoolAdmin } = await supabase
        .from('school_admins')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (schoolAdmin) {
        return { role: 'school_admin', schoolId: schoolAdmin.school_id, isTeacher: false, isAccountant: false, isSchoolAdmin: true, isPlatformAdmin: false, isPartner: false };
      }

      // Check school_teachers for role
      const { data: staffMember } = await supabase
        .from('school_teachers')
        .select('school_id, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffMember) {
        const staffRole = (staffMember as any).role || 'teacher';
        if (staffRole === 'accountant') {
          return { role: 'accountant', schoolId: staffMember.school_id, isTeacher: false, isAccountant: true, isSchoolAdmin: false, isPlatformAdmin: false, isPartner: false };
        }
        return { role: 'teacher', schoolId: staffMember.school_id, isTeacher: true, isAccountant: false, isSchoolAdmin: false, isPlatformAdmin: false, isPartner: false };
      }

      // Check partner
      const { data: partner } = await (supabase as any)
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (partner) {
        return { role: 'partner', schoolId: null, isTeacher: false, isAccountant: false, isSchoolAdmin: false, isPlatformAdmin: false, isPartner: true };
      }

      return empty;
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
    isAccountant: data?.isAccountant ?? false,
    isSchoolAdmin: data?.isSchoolAdmin ?? false,
    isPlatformAdmin: data?.isPlatformAdmin ?? false,
    isPartner: data?.isPartner ?? false,
  };
}
