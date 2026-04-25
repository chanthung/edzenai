export interface FieldDef {
  token: string;
  label: string;
  group: 'Student' | 'Academic' | 'School' | 'Signatures';
  sample: string;
}

export const FIELD_REGISTRY: FieldDef[] = [
  // Student
  { token: '{student_name}', label: 'Student Name', group: 'Student', sample: 'James Inr' },
  { token: '{roll_number}', label: 'Roll No.', group: 'Student', sample: '12' },
  { token: '{class_section}', label: 'Class & Section', group: 'Student', sample: 'Class 5 - A' },
  { token: '{dob}', label: 'Date of Birth', group: 'Student', sample: '12-Mar-2014' },
  { token: '{admission_number}', label: 'Admission No.', group: 'Student', sample: 'ADM-2024-045' },
  { token: '{parent_name}', label: 'Parent Name', group: 'Student', sample: 'Robert Inr' },
  { token: '{parent_phone}', label: 'Parent Phone', group: 'Student', sample: '+91 98765 43210' },

  // Academic
  { token: '{total_marks}', label: 'Total Marks', group: 'Academic', sample: '420' },
  { token: '{max_marks_total}', label: 'Max Marks', group: 'Academic', sample: '500' },
  { token: '{percentage}', label: 'Percentage', group: 'Academic', sample: '84.00%' },
  { token: '{grade}', label: 'Overall Grade', group: 'Academic', sample: 'A' },
  { token: '{rank}', label: 'Rank', group: 'Academic', sample: '3' },
  { token: '{attendance_percentage}', label: 'Attendance %', group: 'Academic', sample: '94%' },
  { token: '{days_present}', label: 'Days Present', group: 'Academic', sample: '178' },
  { token: '{days_absent}', label: 'Days Absent', group: 'Academic', sample: '12' },
  { token: '{teacher_remarks}', label: 'Teacher Remarks', group: 'Academic', sample: 'Excellent progress.' },
  { token: '{principal_remarks}', label: 'Principal Remarks', group: 'Academic', sample: 'Keep it up!' },

  // School
  { token: '{school_name}', label: 'School Name', group: 'School', sample: 'Stepping Stones School' },
  { token: '{school_address}', label: 'School Address', group: 'School', sample: '123 Main Road, City' },
  { token: '{school_phone}', label: 'School Phone', group: 'School', sample: '+91 11 2345 6789' },
  { token: '{academic_year}', label: 'Academic Year', group: 'School', sample: '2025-2026' },
  { token: '{term_name}', label: 'Term Name', group: 'School', sample: 'Term 1' },
  { token: '{print_date}', label: 'Print Date', group: 'School', sample: new Date().toLocaleDateString() },
];

export const FIELD_GROUPS = ['Student', 'Academic', 'School', 'Signatures'] as const;

export function getFieldDef(token: string) {
  return FIELD_REGISTRY.find(f => f.token === token);
}
