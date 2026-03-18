import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useResolvedSchoolId } from '@/hooks/progress/useResolvedSchoolId';
import { useAuth } from '@/contexts/AuthContext';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'leave';

export interface AttendanceRecord {
  id: string;
  student_id: string;
  school_id: string;
  date: string;
  status: AttendanceStatus;
  marked_by: string | null;
  remarks: string | null;
}

export interface AttendanceBulkEntry {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string;
}

/**
 * Fetch attendance records for a given date and optional class filter.
 */
export function useAttendanceByDate(date: string, className?: string, section?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['attendance', schoolId, date, className, section],
    queryFn: async () => {
      if (!schoolId) return [];

      // First get students for this class and section
      let studentQuery = supabase
        .from('students')
        .select('id, name, roll_number, class_name, section')
        .eq('school_id', schoolId)
        .order('name');

      if (className) {
        studentQuery = studentQuery.eq('class_name', className);
      }
      if (section) {
        studentQuery = studentQuery.eq('section', section);
      }

      const { data: students, error: studentsError } = await studentQuery;
      if (studentsError) throw studentsError;

      // Then get attendance for these students on the given date
      const studentIds = (students ?? []).map(s => s.id);
      if (studentIds.length === 0) return [];

      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('school_id', schoolId)
        .eq('date', date)
        .in('student_id', studentIds);

      if (attendanceError) throw attendanceError;

      // Merge: for each student, find their attendance record or default to null
      const attendanceMap = new Map(
        (attendance ?? []).map(a => [a.student_id, a as AttendanceRecord])
      );

      return (students ?? []).map(s => ({
        student: s,
        attendance: attendanceMap.get(s.id) || null,
      }));
    },
    enabled: !!schoolId && !!date,
  });
}

/**
 * Bulk upsert attendance for a class on a given date.
 */
export function useSaveAttendance() {
  const queryClient = useQueryClient();
  const { data: schoolId } = useResolvedSchoolId();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ date, entries }: { date: string; entries: AttendanceBulkEntry[] }) => {
      if (!schoolId || !user) throw new Error('Not authenticated');

      const records = entries.map(e => ({
        student_id: e.student_id,
        school_id: schoolId,
        date,
        status: e.status as 'present' | 'absent' | 'late' | 'leave',
        marked_by: user.id,
        remarks: e.remarks || null,
      }));

      // Upsert: insert or update on conflict (student_id, date)
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,date' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

/**
 * Fetch monthly attendance summary for a student (parent view).
 */
export function useStudentAttendanceSummary(accessToken: string | undefined) {
  return useQuery({
    queryKey: ['student-attendance-summary', accessToken],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_student_attendance_by_access_token', { _access_token: accessToken });

      if (error) throw error;

      const records = (data ?? []) as { date: string; status: string; remarks: string | null }[];

      // Calculate summary
      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const leave = records.filter(r => r.status === 'leave').length;
      const percentage = total > 0 ? Math.round((present + late) * 100 / total) : 0;

      // Group by month
      const byMonth: Record<string, { present: number; absent: number; late: number; leave: number; total: number }> = {};
      records.forEach(r => {
        const month = r.date.substring(0, 7); // YYYY-MM
        if (!byMonth[month]) byMonth[month] = { present: 0, absent: 0, late: 0, leave: 0, total: 0 };
        byMonth[month].total++;
        if (r.status === 'present') byMonth[month].present++;
        else if (r.status === 'absent') byMonth[month].absent++;
        else if (r.status === 'late') byMonth[month].late++;
        else if (r.status === 'leave') byMonth[month].leave++;
      });

      return {
        records,
        summary: { total, present, absent, late, leave, percentage },
        byMonth,
      };
    },
    enabled: !!accessToken,
  });
}

/**
 * Fetch attendance summary for admin reports - class-wise for a date range.
 */
export function useAttendanceReport(startDate: string, endDate: string, className?: string) {
  const { data: schoolId } = useResolvedSchoolId();

  return useQuery({
    queryKey: ['attendance-report', schoolId, startDate, endDate, className],
    queryFn: async () => {
      if (!schoolId) return [];

      let query = supabase
        .from('attendance')
        .select('student_id, date, status')
        .eq('school_id', schoolId)
        .gte('date', startDate)
        .lte('date', endDate);

      // If class filter, first get student IDs for that class
      if (className) {
        const { data: students } = await supabase
          .from('students')
          .select('id')
          .eq('school_id', schoolId)
          .eq('class_name', className);
        
        const ids = (students ?? []).map(s => s.id);
        if (ids.length === 0) return [];
        query = query.in('student_id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!schoolId && !!startDate && !!endDate,
  });
}
