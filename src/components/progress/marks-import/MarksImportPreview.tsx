import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2, Loader2, Save } from 'lucide-react';
import type { PreviewResponse, PreviewRow, KnownStudent, KnownSubject, ImportMode } from '@/hooks/progress/useMarksImport';

interface Props {
  preview: PreviewResponse;
  mode: ImportMode;
  knownStudents: KnownStudent[];
  knownSubjects: KnownSubject[];
  isSaving: boolean;
  onSave: (rows: PreviewRow[]) => void;
  onBack: () => void;
}

function confidenceBadge(row: PreviewRow) {
  if (!row.studentId) return <Badge variant="destructive" className="text-[10px]">Unmatched</Badge>;
  if (row.studentMatchConfidence === 'fuzzy') return <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 text-[10px]">Fuzzy</Badge>;
  return <Badge variant="secondary" className="text-[10px]">Matched</Badge>;
}

function ocrBadge(row: PreviewRow) {
  if (!row.ocrConfidence) return null;
  const map = {
    high: 'bg-emerald-500/15 text-emerald-700',
    medium: 'bg-amber-500/15 text-amber-700',
    low: 'bg-red-500/15 text-red-700',
  } as const;
  return <Badge className={`${map[row.ocrConfidence]} text-[10px] capitalize`}>{row.ocrConfidence}</Badge>;
}

export function MarksImportPreview({ preview, mode, knownStudents, knownSubjects, isSaving, onSave, onBack }: Props) {
  const [rows, setRows] = useState<PreviewRow[]>(preview.rows);

  const updateRow = (i: number, patch: Partial<PreviewRow>) => {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch, issues: recomputeIssues({ ...r, ...patch }) } : r)));
  };

  const blockingIssues = (r: PreviewRow) =>
    !r.studentId || !r.subjectId || r.marksObtained == null || isNaN(r.marksObtained);

  const stats = useMemo(() => ({
    ready: rows.filter((r) => !blockingIssues(r)).length,
    blocking: rows.filter((r) => blockingIssues(r)).length,
  }), [rows]);

  const canSave = stats.ready > 0 && stats.blocking === 0 && !isSaving;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs">
        <Badge variant="outline">Total: {preview.summary.totalRows}</Badge>
        <Badge className="bg-emerald-500/15 text-emerald-700">Matched: {preview.summary.matchedStudents}</Badge>
        {preview.summary.fuzzyStudents > 0 && (
          <Badge className="bg-amber-500/15 text-amber-700">Fuzzy: {preview.summary.fuzzyStudents}</Badge>
        )}
        {preview.summary.unmatchedStudents > 0 && (
          <Badge variant="destructive">Unmatched students: {preview.summary.unmatchedStudents}</Badge>
        )}
        {preview.summary.unmatchedSubjects > 0 && (
          <Badge variant="destructive">Unmatched subjects: {preview.summary.unmatchedSubjects}</Badge>
        )}
        {mode !== 'excel' && preview.summary.lowConfidence > 0 && (
          <Badge className="bg-red-500/15 text-red-700">Low-confidence cells: {preview.summary.lowConfidence}</Badge>
        )}
        {preview.ignoredColumns.length > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            Ignored columns: {preview.ignoredColumns.join(', ')}
          </Badge>
        )}
      </div>

      {stats.blocking > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {stats.blocking} row(s) need attention before save. Pick a student/subject from the dropdown or fix the marks value.
          </span>
        </div>
      )}

      <div className="max-h-[55vh] overflow-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[60px]">Row</TableHead>
              <TableHead>Student (parsed)</TableHead>
              <TableHead className="w-[220px]">Match → Student</TableHead>
              <TableHead>Subject (parsed)</TableHead>
              <TableHead className="w-[180px]">Match → Subject</TableHead>
              <TableHead className="w-[100px]">Marks</TableHead>
              <TableHead className="w-[100px]">Max</TableHead>
              <TableHead className="w-[80px]">Status</TableHead>
              {mode !== 'excel' && <TableHead className="w-[80px]">Conf.</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const isBlocking = blockingIssues(r);
              return (
                <TableRow key={i} className={isBlocking ? 'bg-amber-50/40 dark:bg-amber-500/5' : ''}>
                  <TableCell className="text-xs text-muted-foreground">{r.rowIndex}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.rawStudent || '—'}</div>
                    {r.rawRoll && <div className="text-muted-foreground">Roll: {r.rawRoll}</div>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.studentId ?? 'none'}
                      onValueChange={(v) => updateRow(i, { studentId: v === 'none' ? null : v, studentMatchConfidence: 'exact_name', matchedStudentName: knownStudents.find((s) => s.id === v)?.name ?? null })}
                    >
                      <SelectTrigger className={`h-8 text-xs ${!r.studentId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Pick student" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="none">— Pick a student —</SelectItem>
                        {knownStudents.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} {s.roll_number ? `(${s.roll_number})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-xs">{r.rawSubject}</TableCell>
                  <TableCell>
                    <Select
                      value={r.subjectId ?? 'none'}
                      onValueChange={(v) => updateRow(i, { subjectId: v === 'none' ? null : v, subjectMatchConfidence: 'exact', matchedSubjectName: knownSubjects.find((s) => s.id === v)?.name ?? null })}
                    >
                      <SelectTrigger className={`h-8 text-xs ${!r.subjectId ? 'border-destructive' : ''}`}>
                        <SelectValue placeholder="Pick subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Pick a subject —</SelectItem>
                        {knownSubjects.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.marksObtained ?? ''}
                      onChange={(e) => updateRow(i, { marksObtained: e.target.value === '' ? null : Number(e.target.value) })}
                      className={`h-8 text-xs ${r.marksObtained == null || isNaN(r.marksObtained) ? 'border-destructive' : ''}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={r.maxMarks ?? ''}
                      placeholder="100"
                      onChange={(e) => updateRow(i, { maxMarks: e.target.value === '' ? null : Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </TableCell>
                  <TableCell>{confidenceBadge(r)}</TableCell>
                  {mode !== 'excel' && <TableCell>{ocrBadge(r)}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>Back</Button>
        <Button onClick={() => onSave(rows.filter((r) => !blockingIssues(r)))} disabled={!canSave}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Confirm & Save {stats.ready} mark{stats.ready === 1 ? '' : 's'}
        </Button>
      </div>
    </div>
  );
}

function recomputeIssues(r: PreviewRow): string[] {
  const out: string[] = [];
  if (!r.studentId) out.push('unmatched_student');
  if (!r.subjectId) out.push('unmatched_subject');
  if (r.marksObtained == null || isNaN(r.marksObtained)) out.push('invalid_marks');
  if (r.maxMarks != null && r.marksObtained != null && r.marksObtained > r.maxMarks) out.push('marks_exceed_max');
  return out;
}
