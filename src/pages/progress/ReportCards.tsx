import { useState, useRef } from "react";
import { ProgressLayout } from "@/components/progress/ProgressLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportCardView } from "@/components/progress/ReportCardView";
import { useResolvedStudents } from "@/hooks/progress/useResolvedStudents";
import { useResolvedAcademicYears, useResolvedActiveAcademicYear } from "@/hooks/progress/useResolvedAcademicYears";
import { useReportCard } from "@/hooks/progress/useReportCard";
import { useClassReportCards } from "@/hooks/progress/useClassReportCards";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportCards() {
  const { data: students = [], isLoading: studentsLoading } = useResolvedStudents();
  const { data: academicYears = [], isLoading: yearsLoading } = useResolvedAcademicYears();
  const activeYear = useResolvedActiveAcademicYear();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedYearId, setSelectedYearId] = useState("");
  const [viewMode, setViewMode] = useState<"individual" | "class">("individual");

  const effectiveYearId = selectedYearId || activeYear?.id || "";
  const classNames = [...new Set(students.map(s => s.class_name).filter(Boolean) as string[])].sort();
  const filteredStudents = selectedClass && selectedClass !== "__all__"
    ? students.filter(s => s.class_name === selectedClass)
    : students;

  const { data: reportCard, isLoading: reportLoading } = useReportCard(
    viewMode === "individual" ? (selectedStudentId || null) : null,
    effectiveYearId || null
  );

  const classForBulk = viewMode === "class" && selectedClass && selectedClass !== "__all__" ? selectedClass : null;
  const { data: classReportCards = [], isLoading: classLoading } = useClassReportCards(
    classForBulk,
    effectiveYearId || null
  );

  const bulkPrintRef = useRef<HTMLDivElement>(null);

  const handleBulkPrint = () => {
    const content = bulkPrintRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Cards - ${selectedClass}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
          .report-card { max-width: 210mm; margin: 0 auto; }
          .page-break { page-break-after: always; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 3px double #1a1a1a; padding-bottom: 12px; }
          .school-name { font-size: 22px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          .report-title { font-size: 14px; font-weight: 600; margin-top: 4px; color: #444; }
          .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 16px; padding: 10px; background: #f8f9fa; border-radius: 6px; }
          .info-item { font-size: 11px; }
          .info-label { font-weight: 600; color: #555; }
          .section-title { font-size: 13px; font-weight: 700; margin: 14px 0 6px; padding: 4px 8px; background: #1a1a1a; color: white; border-radius: 3px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
          th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: center; font-size: 10.5px; }
          th { background: #eef2f7; font-weight: 600; color: #333; }
          td:first-child { text-align: left; font-weight: 500; }
          .grade-cell { font-weight: 700; color: #2563eb; }
          .total-row { background: #f0f4f8; font-weight: 700; }
          .footer { margin-top: 32px; display: flex; justify-content: space-between; padding-top: 40px; }
          .signature-line { border-top: 1px solid #666; width: 140px; text-align: center; padding-top: 4px; font-size: 10px; color: #555; }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  return (
    <ProgressLayout>
      <PageHeader
        title="Report Cards"
        description="Generate and print student report cards with term-wise marks and grades"
      />

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "individual" | "class")} className="mt-6">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="individual" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Individual Student
          </TabsTrigger>
          <TabsTrigger value="class" className="gap-1.5">
            <Users className="h-4 w-4" />
            Class-wise View
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Academic Year */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Academic Year</label>
                {yearsLoading ? (
                  <Skeleton className="h-9 w-40" />
                ) : (
                  <Select value={effectiveYearId} onValueChange={setSelectedYearId}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map(y => (
                        <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Class */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Class</label>
                {studentsLoading ? (
                  <Skeleton className="h-9 w-32" />
                ) : (
                  <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedStudentId(""); }}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={viewMode === "class" ? "Select Class" : "All Classes"} />
                    </SelectTrigger>
                    <SelectContent>
                      {viewMode === "individual" && (
                        <SelectItem value="__all__">All Classes</SelectItem>
                      )}
                      {classNames.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Student — only in individual mode */}
              {viewMode === "individual" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Student</label>
                  {studentsLoading ? (
                    <Skeleton className="h-9 w-52" />
                  ) : (
                    <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredStudents.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.roll_number ? `(${s.roll_number})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Print All button — only in class mode when data is ready */}
              {viewMode === "class" && classReportCards.length > 0 && (
                <Button onClick={handleBulkPrint} size="sm" variant="outline" className="ml-auto">
                  <Printer className="h-4 w-4 mr-2" />
                  Print All ({classReportCards.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Tab Content */}
        <TabsContent value="individual" className="mt-4">
          {!selectedStudentId ? (
            <EmptyState
              icon={FileText}
              title="Select a student"
              description="Choose a class and student above to generate their report card"
            />
          ) : reportLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
            </div>
          ) : !reportCard || (reportCard.scholastic.length === 0 && reportCard.coScholastic.length === 0) ? (
            <EmptyState
              icon={FileText}
              title="No marks data"
              description="This student doesn't have any marks recorded for the selected academic year"
            />
          ) : (
            <ReportCardView data={reportCard} />
          )}
        </TabsContent>

        {/* Class-wise Tab Content */}
        <TabsContent value="class" className="mt-4">
          {!classForBulk ? (
            <EmptyState
              icon={Users}
              title="Select a class"
              description="Choose a specific class above to view all student report cards"
            />
          ) : classLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
            </div>
          ) : classReportCards.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No report cards"
              description="No marks data found for students in this class for the selected academic year"
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {classReportCards.length} report card{classReportCards.length !== 1 ? 's' : ''} for {selectedClass}
              </p>

              {/* On-screen view */}
              <div className="space-y-8">
                {classReportCards.map((rc) => (
                  <ReportCardView key={rc.student.id} data={rc} />
                ))}
              </div>

              {/* Hidden bulk print container */}
              <div ref={bulkPrintRef} className="hidden">
                {classReportCards.map((rc, idx) => (
                  <div key={rc.student.id} className={idx < classReportCards.length - 1 ? "page-break" : ""}>
                    <BulkReportCardContent data={rc} />
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </ProgressLayout>
  );
}

/** Inline print-friendly HTML for bulk printing (no React hooks) */
function BulkReportCardContent({ data }: { data: ReportCardData }) {
  const nepStage = getNepStageLabel(data.student.className);

  return (
    <div className="report-card">
      <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '3px double #1a1a1a', paddingBottom: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const }}>{data.schoolName}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: '#444' }}>Progress Report Card</div>
        <div style={{ fontSize: 11, color: '#666' }}>Academic Year: {data.academicYear}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', marginBottom: 16, padding: 10, background: '#f8f9fa', borderRadius: 6, fontSize: 11 }}>
        <div><strong>Name:</strong> {data.student.name}</div>
        <div><strong>Class:</strong> {data.student.className}{data.student.section ? ` - ${data.student.section}` : ''}</div>
        <div><strong>Roll No:</strong> {data.student.rollNumber ?? 'N/A'}</div>
        <div><strong>NEP Stage:</strong> {nepStage}</div>
        {data.student.parentName && <div><strong>Parent:</strong> {data.student.parentName}</div>}
      </div>

      {data.scholastic.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, padding: '4px 8px', background: '#1a1a1a', color: 'white', borderRadius: 3 }}>
            Scholastic Areas
          </div>
          <table>
            <thead>
              <tr style={{ background: '#eef2f7' }}>
                <th style={{ textAlign: 'left' }}>Subject</th>
                {data.termNames.map(t => (
                  <th key={t} colSpan={2}>{t}</th>
                ))}
                <th>Overall %</th>
                <th>Grade</th>
              </tr>
              <tr>
                <th></th>
                {data.termNames.map(t => (
                  <React.Fragment key={t}>
                    <th style={{ fontSize: '9px' }}>Marks</th>
                    <th style={{ fontSize: '9px' }}>Grade</th>
                  </React.Fragment>
                ))}
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.scholastic.map(row => (
                <tr key={row.subjectId}>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>{row.subjectName}</td>
                  {data.termNames.map(t => {
                    const term = row.terms[t];
                    return (
                      <React.Fragment key={t}>
                        <td>{term ? `${term.marksObtained}/${term.maxMarks}` : '-'}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{term?.grade ?? '-'}</td>
                      </React.Fragment>
                    );
                  })}
                  <td style={{ fontWeight: 600 }}>{row.overallPercentage}%</td>
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{row.overallGrade ?? '-'}</td>
                </tr>
              ))}
              <tr style={{ background: '#f0f4f8', fontWeight: 700 }}>
                <td style={{ textAlign: 'left' }}>Grand Total</td>
                {data.termNames.map(t => {
                  const termMarks = data.scholastic.map(r => r.terms[t]).filter(Boolean);
                  const obt = termMarks.reduce((s, m) => s + m!.marksObtained, 0);
                  const max = termMarks.reduce((s, m) => s + m!.maxMarks, 0);
                  return <td key={t} colSpan={2}>{obt}/{max}</td>;
                })}
                <td>{data.grandTotal.percentage}%</td>
                <td style={{ color: '#2563eb' }}>{data.grandTotal.grade ?? '-'}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {data.coScholastic.length > 0 && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, padding: '4px 8px', background: '#555', color: 'white', borderRadius: 3 }}>
            Co-Scholastic Areas
          </div>
          <table>
            <thead>
              <tr style={{ background: '#eef2f7' }}>
                <th style={{ textAlign: 'left' }}>Activity / Subject</th>
                {data.termNames.map(t => <th key={t}>{t}</th>)}
                <th>Overall</th>
              </tr>
            </thead>
            <tbody>
              {data.coScholastic.map(row => (
                <tr key={row.subjectId}>
                  <td style={{ textAlign: 'left', fontWeight: 500 }}>{row.subjectName}</td>
                  {data.termNames.map(t => {
                    const term = row.terms[t];
                    return <td key={t} style={{ fontWeight: 600, color: '#2563eb' }}>{term?.grade ?? (term ? `${term.percentage}%` : '-')}</td>;
                  })}
                  <td style={{ fontWeight: 700, color: '#2563eb' }}>{row.overallGrade ?? `${row.overallPercentage}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 40 }}>
        <div style={{ borderTop: '1px solid #666', width: 140, textAlign: 'center', paddingTop: 4, fontSize: 10, color: '#555' }}>Class Teacher</div>
        <div style={{ borderTop: '1px solid #666', width: 140, textAlign: 'center', paddingTop: 4, fontSize: 10, color: '#555' }}>Parent / Guardian</div>
        <div style={{ borderTop: '1px solid #666', width: 140, textAlign: 'center', paddingTop: 4, fontSize: 10, color: '#555' }}>Principal</div>
      </div>
    </div>
  );
}

// Imports needed for BulkReportCardContent
import React from "react";
import type { ReportCardData } from "@/hooks/progress/useReportCard";
import { getNepStageLabel } from "@/lib/nep-stages";
