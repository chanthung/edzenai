import * as XLSX from 'xlsx';
import type { Teacher } from '@/hooks/useTeachers';

export const TEACHER_DOWNLOAD_HEADERS = ['Full Name', 'Email Address', 'Employee ID', 'Date of Birth', 'Gender', 'Date of Joining', 'Experience Years', 'Designation', 'Department', 'Qualification', 'Employment Type', 'Employment Status'] as const;

export function teacherExportRows(teachers: Teacher[], schoolId: string) {
  if (!schoolId || teachers.some(teacher => teacher.school_id !== schoolId)) {
    throw new Error('Teacher records could not be confirmed for this school. Refresh Users and try again.');
  }
  return teachers.filter(teacher => teacher.role === 'teacher').map(teacher => [
    teacher.name, teacher.email ?? '', teacher.employee_id ?? '', teacher.date_of_birth ?? '',
    teacher.gender ?? '', teacher.date_of_joining ?? '', teacher.experience_years ?? '',
    teacher.designation ?? '', teacher.department ?? '', teacher.qualification ?? '',
    teacher.employment_type ?? '', teacher.employment_status ?? '',
    teacher.user_id ? teacher.is_active ? 'Active' : 'Inactive' : 'Not invited',
  ]);
}

export function teacherExportBlob(teachers: Teacher[], schoolId: string): Blob {
  const rows = teacherExportRows(teachers, schoolId);
  if (!rows.length) throw new Error('No teacher records to export.');
  const sheet = XLSX.utils.aoa_to_sheet([[...TEACHER_DOWNLOAD_HEADERS, 'Account Status'], ...rows]);
  sheet['!cols'] = [28, 34, 18, 18, 23, 18, 20, 26, 26, 32, 23, 23, 18].map(wch => ({ wch }));
  sheet['!autofilter'] = { ref: `A1:M${rows.length + 1}` };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Teacher Data');
  return new Blob([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// Called with an already prepared file so the browser retains click activation on iOS.
export async function deliverTeacherFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return true; }
    catch (error) { if ((error as DOMException).name === 'AbortError') return false; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}