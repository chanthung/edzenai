import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { ReportCardData } from "@/hooks/progress/useReportCard";
import { getNepStageLabel } from "@/lib/nep-stages";

interface ReportCardViewProps {
  data: ReportCardData;
}

export function ReportCardView({ data }: ReportCardViewProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report Card - ${data.student.name}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }
          .report-card { max-width: 210mm; margin: 0 auto; }
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
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const nepStage = getNepStageLabel(data.student.className);

  return (
    <div>
      {/* Print button */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button onClick={handlePrint} size="sm" variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print Report Card
        </Button>
      </div>

      {/* Report Card Content */}
      <div ref={printRef} className="bg-white text-foreground rounded-lg border border-border p-6 max-w-4xl mx-auto">
        <div className="report-card">
          {/* Header */}
          <div className="text-center mb-4 pb-3 border-b-4 border-double border-foreground">
            <h1 className="text-xl font-bold tracking-wide uppercase">{data.schoolName}</h1>
            <p className="text-sm font-semibold text-muted-foreground mt-1">Progress Report Card</p>
            <p className="text-xs text-muted-foreground">Academic Year: {data.academicYear}</p>
          </div>

          {/* Student Info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 mb-4 p-3 bg-muted/50 rounded-md text-sm">
            <div><span className="font-semibold text-muted-foreground">Name:</span> {data.student.name}</div>
            <div><span className="font-semibold text-muted-foreground">Class:</span> {data.student.className}{data.student.section ? ` - ${data.student.section}` : ''}</div>
            <div><span className="font-semibold text-muted-foreground">Roll No:</span> {data.student.rollNumber ?? 'N/A'}</div>
            <div><span className="font-semibold text-muted-foreground">NEP Stage:</span> {nepStage}</div>
            {data.student.parentName && (
              <div><span className="font-semibold text-muted-foreground">Parent:</span> {data.student.parentName}</div>
            )}
          </div>

          {/* Scholastic Area */}
          {data.scholastic.length > 0 && (
            <>
              <div className="text-sm font-bold mb-2 px-2 py-1 bg-primary text-primary-foreground rounded">
                Scholastic Areas
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm mb-4">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-3 py-2 text-left font-semibold">Subject</th>
                      {data.termNames.map(t => (
                        <th key={t} className="border border-border px-2 py-2 text-center font-semibold" colSpan={2}>
                          {t}
                        </th>
                      ))}
                      <th className="border border-border px-2 py-2 text-center font-semibold">Overall %</th>
                      <th className="border border-border px-2 py-2 text-center font-semibold">Grade</th>
                    </tr>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-3 py-1 text-left text-xs text-muted-foreground"></th>
                      {data.termNames.map(t => (
                        <>
                          <th key={`${t}-marks`} className="border border-border px-2 py-1 text-center text-xs text-muted-foreground">Marks</th>
                          <th key={`${t}-grade`} className="border border-border px-2 py-1 text-center text-xs text-muted-foreground">Grade</th>
                        </>
                      ))}
                      <th className="border border-border"></th>
                      <th className="border border-border"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.scholastic.map(row => (
                      <tr key={row.subjectId}>
                        <td className="border border-border px-3 py-2 font-medium">{row.subjectName}</td>
                        {data.termNames.map(t => {
                          const term = row.terms[t];
                          return (
                            <>
                              <td key={`${t}-m`} className="border border-border px-2 py-2 text-center">
                                {term ? `${term.marksObtained}/${term.maxMarks}` : '-'}
                              </td>
                              <td key={`${t}-g`} className="border border-border px-2 py-2 text-center font-semibold text-primary">
                                {term?.grade ?? '-'}
                              </td>
                            </>
                          );
                        })}
                        <td className="border border-border px-2 py-2 text-center font-semibold">{row.overallPercentage}%</td>
                        <td className="border border-border px-2 py-2 text-center font-bold text-primary">{row.overallGrade ?? '-'}</td>
                      </tr>
                    ))}
                    {/* Grand Total Row */}
                    <tr className="bg-muted/50 font-bold">
                      <td className="border border-border px-3 py-2">Grand Total</td>
                      {data.termNames.map(t => (
                        <>
                          <td key={`tot-${t}-m`} className="border border-border px-2 py-2 text-center" colSpan={2}>
                            {(() => {
                              const termMarks = data.scholastic.map(r => r.terms[t]).filter(Boolean);
                              const obt = termMarks.reduce((s, m) => s + m!.marksObtained, 0);
                              const max = termMarks.reduce((s, m) => s + m!.maxMarks, 0);
                              return `${obt}/${max}`;
                            })()}
                          </td>
                        </>
                      ))}
                      <td className="border border-border px-2 py-2 text-center">{data.grandTotal.percentage}%</td>
                      <td className="border border-border px-2 py-2 text-center text-primary">{data.grandTotal.grade ?? '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Co-Scholastic Area */}
          {data.coScholastic.length > 0 && (
            <>
              <div className="text-sm font-bold mb-2 px-2 py-1 bg-secondary text-secondary-foreground rounded">
                Co-Scholastic Areas
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm mb-4">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border px-3 py-2 text-left font-semibold">Activity / Subject</th>
                      {data.termNames.map(t => (
                        <th key={t} className="border border-border px-2 py-2 text-center font-semibold">{t}</th>
                      ))}
                      <th className="border border-border px-2 py-2 text-center font-semibold">Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coScholastic.map(row => (
                      <tr key={row.subjectId}>
                        <td className="border border-border px-3 py-2 font-medium">{row.subjectName}</td>
                        {data.termNames.map(t => {
                          const term = row.terms[t];
                          return (
                            <td key={t} className="border border-border px-2 py-2 text-center font-semibold text-primary">
                              {term?.grade ?? (term ? `${term.percentage}%` : '-')}
                            </td>
                          );
                        })}
                        <td className="border border-border px-2 py-2 text-center font-bold text-primary">
                          {row.overallGrade ?? `${row.overallPercentage}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Signature Section */}
          <div className="flex justify-between mt-10 pt-8">
            <div className="border-t border-muted-foreground w-36 text-center pt-1 text-xs text-muted-foreground">
              Class Teacher
            </div>
            <div className="border-t border-muted-foreground w-36 text-center pt-1 text-xs text-muted-foreground">
              Parent / Guardian
            </div>
            <div className="border-t border-muted-foreground w-36 text-center pt-1 text-xs text-muted-foreground">
              Principal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
