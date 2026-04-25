import type { ReportCardData } from '@/hooks/progress/useReportCard';
import { getFieldDef } from './field-registry';

export interface ResolveContext {
  data?: ReportCardData | null;
  schoolPhone?: string | null;
  termName?: string | null;
}

/** Resolve a {token} to a string. Falls back to sample when no data. */
export function resolveField(token: string, ctx: ResolveContext): string {
  const def = getFieldDef(token);
  const data = ctx.data;

  if (!data) return def?.sample ?? token;

  switch (token) {
    case '{student_name}': return data.student.name || '';
    case '{roll_number}': return data.student.rollNumber ?? '';
    case '{class_section}':
      return [data.student.className, data.student.section].filter(Boolean).join(' - ');
    case '{parent_name}': return data.student.parentName ?? '';
    case '{parent_phone}': return '';
    case '{dob}': return '';
    case '{admission_number}': return '';

    case '{total_marks}': return String(data.grandTotal.obtained);
    case '{max_marks_total}': return String(data.grandTotal.max);
    case '{percentage}': return `${data.grandTotal.percentage}%`;
    case '{grade}': return data.grandTotal.grade ?? '';
    case '{rank}': return '';
    case '{attendance_percentage}': return '';
    case '{days_present}': return '';
    case '{days_absent}': return '';
    case '{teacher_remarks}': return '';
    case '{principal_remarks}': return '';

    case '{school_name}': return data.schoolName || '';
    case '{school_address}': return data.schoolAddress ?? '';
    case '{school_phone}': return ctx.schoolPhone ?? '';
    case '{academic_year}': return data.academicYear || '';
    case '{term_name}': return ctx.termName ?? data.termNames[0] ?? '';
    case '{print_date}': return new Date().toLocaleDateString();
    default: return def?.sample ?? token;
  }
}
