import { exportMultiSheetXLSX } from './export-utils';

export interface IssueRow {
  rowNumber: number;
  studentName: string;
  className: string;
  section: string;
  rollNo: string;
  parentName: string;
  phone: string;
  issueType: string;
  issueDetails: string;
  actionRequired: string;
}

export function generateImportReport(
  issueRows: IssueRow[],
  ignoredColumns: string[],
) {
  const date = new Date().toISOString().slice(0, 10);

  const issuesSheet = issueRows.map((r) => ({
    'Row Number': r.rowNumber,
    'Student Name': r.studentName || 'Unknown',
    'Class': r.className || '',
    'Section': r.section || '',
    'Roll No': r.rollNo || '',
    'Parent Name': r.parentName || '',
    'Phone': r.phone || '',
    'Issue Type': r.issueType,
    'Issue Details': r.issueDetails,
    'Action Required': r.actionRequired,
  }));

  const ignoredSheet = ignoredColumns.map((col) => ({
    'Column Name': col,
    'Reason': 'Not a recognized system field',
  }));

  const sheets = [
    { name: 'Issues & Warnings', data: issuesSheet.length > 0 ? issuesSheet : [{ 'Row Number': '', 'Student Name': 'No issues found', 'Class': '', 'Section': '', 'Roll No': '', 'Parent Name': '', 'Phone': '', 'Issue Type': '', 'Issue Details': '', 'Action Required': '' }] },
    { name: 'Ignored Columns', data: ignoredSheet.length > 0 ? ignoredSheet : [{ 'Column Name': 'None', 'Reason': 'All columns were mapped' }] },
  ];

  exportMultiSheetXLSX(sheets, `Import_Issues_${date}`);
}
