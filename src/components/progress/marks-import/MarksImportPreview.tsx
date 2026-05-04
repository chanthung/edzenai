import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Loader2, Save, Sparkles } from 'lucide-react';
import type { PreviewResponse, PreviewRow, KnownStudent, KnownSubject, ImportMode } from '@/hooks/progress/useMarksImport';

export type DuplicateStrategy = 'skip' | 'overwrite';

interface Props {
  preview: PreviewResponse;
  mode: ImportMode;
  knownStudents: KnownStudent[];
  knownSubjects: KnownSubject[];
  /** Resolved max marks per subject for THIS assessment (template total or 100). */
  assessmentMaxBySubject: Record<string, number>;
  /** Map of `${student_id}_${subject_id}` → existing marks_obtained */
  existingMarks: Map<string, number>;
  isSaving: boolean;
  onSave: (rows: PreviewRow[], strategy: DuplicateStrategy) => void;
  onBack: () => void;
}

type RowStatus = 'clean' | 'warning' | 'error';

function blocking(r: PreviewRow): boolean {
  return !r.studentId || !r.subjectId || r.marksObtained == null || isNaN(r.marksObtained);
}

function statusOf(r: PreviewRow): RowStatus {
  if (blocking(r)) return 'error';
  if (r.confidenceScore < 70 || r.issues.length > 0) return 'warning';
  return 'clean';
}

function recomputeIssues(r: PreviewRow, assessmentMaxBySubject: Record<string, number>): string[] {
  const out: string[] = [];
  if (!r.studentId) out.push('unmatched_student');
  if (!r.subjectId) out.push('unmatched_subject');
  if (r.marksObtained == null || isNaN(r.marksObtained)) out.push('invalid_marks');
  const aMax = r.subjectId ? assessmentMaxBySubject[r.subjectId] : null;
  if (aMax != null && r.marksObtained != null && r.marksObtained > aMax) out.push('marks_exceed_assessment_max');
  if (r.maxMarks != null && r.marksObtained != null && r.marksObtained > r.maxMarks) out.push('marks_exceed_max');
  return out;
}

function rescore(r: PreviewRow, assessmentMaxBySubject: Record<string, number>): number {
  let s = 100;
  if (!r.studentId) s -= 30;
  else if (r.studentMatchConfidence === 'fuzzy') s -= 15;
  if (!r.subjectId) s -= 30;
  if (r.ocrConfidence === 'low') s -= 25;
  else if (r.ocrConfidence === 'medium') s -= 10;
  const aMax = r.subjectId ? assessmentMaxBySubject[r.subjectId] : null;
  if (aMax != null && r.marksObtained != null && r.marksObtained > aMax) s -= 20;
  if (r.maxMarks != null && r.marksObtained != null && r.marksObtained > r.maxMarks) s -= 20;
  if (r.reportedTotal != null && r.recomputedTotal != null && Math.abs(r.reportedTotal - r.recomputedTotal) > 1) s -= 5;
  return Math.max(0, Math.min(100, s));
}

export function MarksImportPreview({
  preview, mode, knownStudents, knownSubjects, assessmentMaxBySubject,
  existingMarks, isSaving, onSave, onBack,
}: Props) {
  const [rows, setRows] = useState<PreviewRow[]>(preview.rows);
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');
  const [reviewed, setReviewed] = useState(false);

  const updateRow = (i: number, patch: Partial<PreviewRow>) => {
    setRows((prev) => prev.map((r, idx) => {
      if (idx !== i) return r;
      const merged = { ...r, ...patch };
      const issues = recomputeIssues(merged, assessmentMaxBySubject);
      return { ...merged, issues, confidenceScore: rescore({ ...merged, issues }, assessmentMaxBySubject) };
    }));
  };

  // Outlier detection: per subject, marks > 2.5σ from mean (≥5 rows in group)
  const outlierSet = useMemo(() => {
    const bySubject = new Map<string, number[]>();
    rows.forEach((r) => {
      if (r.subjectId && r.marksObtained != null && !isNaN(r.marksObtained)) {
        const arr = bySubject.get(r.subjectId) ?? [];
        arr.push(r.marksObtained);
        bySubject.set(r.subjectId, arr);
      }
    });
    const stats = new Map<string, { mean: number; sd: number }>();
    bySubject.forEach((arr, id) => {
      if (arr.length < 5) return;
      const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
      const sd = Math.sqrt(arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length);
      if (sd > 0) stats.set(id, { mean, sd });
    });
    const out = new Set<number>();
    rows.forEach((r, i) => {
      if (!r.subjectId || r.marksObtained == null) return;
      const s = stats.get(r.subjectId);
      if (s && Math.abs(r.marksObtained - s.mean) > 2.5 * s.sd) out.add(i);
    });
    return out;
  }, [rows]);

  // Categorise each row vs existing DB
  const categories = useMemo(() => {
    const cat = new Map<number, 'new' | 'update' | 'identical' | 'invalid'>();
    rows.forEach((r, i) => {
      if (blocking(r)) { cat.set(i, 'invalid'); return; }
      const key = `${r.studentId}_${r.subjectId}`;
      const existing = existingMarks.get(key);
      if (existing == null) cat.set(i, 'new');
      else if (Math.abs(existing - (r.marksObtained ?? 0)) < 0.001) cat.set(i, 'identical');
      else cat.set(i, 'update');
    });
    return cat;
  }, [rows, existingMarks]);

  const counts = useMemo(() => {
    let create = 0, update = 0, identical = 0, blocked = 0, warnings = 0;
    rows.forEach((r, i) => {
      const c = categories.get(i)!;
      if (c === 'invalid') { blocked++; return; }
      if (c === 'identical') { identical++; return; }
      if (c === 'new') create++;
      else if (c === 'update') update++;
      if (statusOf(r) === 'warning') warnings++;
    });
    // If user picks "skip", updates won't actually fire
    const willSave = strategy === 'overwrite' ? create + update : create;
    const willSkip = identical + (strategy === 'skip' ? update : 0);
    return { create, update, identical, blocked, warnings, willSave, willSkip };
  }, [rows, categories, strategy]);

  const requiresReviewGate = mode !== 'excel';
  const canSave = counts.willSave > 0 && counts.blocked === 0 && (!requiresReviewGate || reviewed) && !isSaving;

  const handleConfirm = () => {
    const toSave = rows.filter((r, i) => {
      const c = categories.get(i);
      if (c === 'invalid' || c === 'identical') return false;
      if (c === 'update' && strategy === 'skip') return false;
      return true;
    });
    onSave(toSave, strategy);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top stats row */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs">
        <Badge variant="outline">Total: {preview.summary.totalRows}</Badge>
        <Badge className={`${preview.summary.avgConfidence >= 70 ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}`}>
          Avg confidence: {preview.summary.avgConfidence}/100
        </Badge>
        {preview.summary.fuzzyStudents > 0 && (
          <Badge className="bg-amber-500/15 text-amber-700">Fuzzy students: {preview.summary.fuzzyStudents}</Badge>
        )}
        {preview.summary.unmatchedStudents > 0 && (
          <Badge variant="destructive">Unmatched students: {preview.summary.unmatchedStudents}</Badge>
        )}
        {preview.summary.unmatchedSubjects > 0 && (
          <Badge variant="destructive">Unmatched subjects: {preview.summary.unmatchedSubjects}</Badge>
        )}
        {preview.summary.exceedsMax > 0 && (
          <Badge variant="destructive">Over max: {preview.summary.exceedsMax}</Badge>
        )}
        {mode !== 'excel' && preview.summary.lowConfidence > 0 && (
          <Badge className="bg-red-500/15 text-red-700">Low-confidence cells: {preview.summary.lowConfidence}</Badge>
        )}
        {preview.ignoredColumns.length > 0 && (
          <Badge variant="outline" className="text-muted-foreground">
            Ignored columns: {preview.ignoredColumns.join(', ')}
          </Badge>
        )}
        {preview.summary.sectionBreakdown && Object.keys(preview.summary.sectionBreakdown).length > 1 && (
          <Badge variant="outline" className="text-indigo-700 bg-indigo-500/10 border-indigo-500/30">
            Sections: {Object.entries(preview.summary.sectionBreakdown).sort(([a], [b]) => a.localeCompare(b)).map(([sec, count]) => `${sec} (${count})`).join(' · ')}
          </Badge>
        )}
        {preview.selectedSheet && (preview.availableSheets?.length ?? 0) > 1 && (
          <Badge variant="outline" className="text-purple-700 bg-purple-500/10 border-purple-500/30">
            Source sheet: {preview.selectedSheet} ({preview.availableSheets!.length} tabs detected)
          </Badge>
        )}
      </div>

      {/* Duplicate strategy */}
      {(counts.update > 0 || counts.identical > 0) && (
        <div className="rounded-xl border border-border/60 bg-card p-3">
          <div className="mb-2 text-xs font-semibold text-foreground">Duplicate handling</div>
          <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as DuplicateStrategy)} className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="skip" value="skip" />
              <Label htmlFor="skip" className="cursor-pointer text-xs">
                Skip rows that already have marks <span className="text-muted-foreground">(default — safest)</span>
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="overwrite" value="overwrite" />
              <Label htmlFor="overwrite" className="cursor-pointer text-xs">
                Overwrite existing marks with values from the file
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Table */}
      <div className="max-h-[50vh] overflow-auto rounded-xl border border-border/60">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-[50px]">Row</TableHead>
              <TableHead>Student (parsed)</TableHead>
              <TableHead className="w-[200px]">Match → Student</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[170px]">Match → Subject</TableHead>
              <TableHead className="w-[90px]">Marks</TableHead>
              <TableHead className="w-[80px]">Conf.</TableHead>
              <TableHead className="w-[90px]">Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => {
              const status = statusOf(r);
              const cat = categories.get(i)!;
              const isOutlier = outlierSet.has(i);
              const aMax = r.subjectId ? assessmentMaxBySubject[r.subjectId] : null;
              const fileMax = r.maxMarks ?? null;
              const overAssessmentMax = aMax != null && r.marksObtained != null && r.marksObtained > aMax;
              const overFileMax = fileMax != null && r.marksObtained != null && r.marksObtained > fileMax;
              const totalMismatch = r.reportedTotal != null && r.recomputedTotal != null && Math.abs(r.reportedTotal - r.recomputedTotal) > 1;
              const ambiguous = r.issues.includes('ambiguous_chars');

              const rowBg =
                status === 'error' ? 'bg-red-50/60 dark:bg-red-500/5' :
                status === 'warning' ? 'bg-amber-50/60 dark:bg-amber-500/5' :
                '';

              return (
                <TableRow key={i} className={rowBg}>
                  <TableCell className="text-xs text-muted-foreground">{r.rowIndex}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.rawStudent || '—'}</div>
                    {r.rawRoll && <div className="text-muted-foreground">Roll: {r.rawRoll}</div>}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.studentId ?? 'none'}
                      onValueChange={(v) => updateRow(i, {
                        studentId: v === 'none' ? null : v,
                        studentMatchConfidence: 'exact_name',
                        matchedStudentName: knownStudents.find((s) => s.id === v)?.name ?? null,
                      })}
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
                      onValueChange={(v) => updateRow(i, {
                        subjectId: v === 'none' ? null : v,
                        subjectMatchConfidence: 'exact',
                        matchedSubjectName: knownSubjects.find((s) => s.id === v)?.name ?? null,
                      })}
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
                      className={`h-8 text-xs ${(r.marksObtained == null || isNaN(r.marksObtained) || overAssessmentMax || overFileMax) ? 'border-destructive' : ''}`}
                    />
                    {aMax != null && <div className="mt-0.5 text-[10px] text-muted-foreground">/{aMax}</div>}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      r.confidenceScore >= 80 ? 'bg-emerald-500/15 text-emerald-700' :
                      r.confidenceScore >= 50 ? 'bg-amber-500/15 text-amber-700' :
                      'bg-red-500/15 text-red-700'
                    }`}>{r.confidenceScore}</span>
                  </TableCell>
                  <TableCell>
                    {status === 'error' && <Badge variant="destructive" className="text-[10px]">Error</Badge>}
                    {status === 'warning' && <Badge className="bg-amber-500/20 text-amber-800 text-[10px]">Warning</Badge>}
                    {status === 'clean' && <Badge className="bg-emerald-500/15 text-emerald-700 text-[10px]">Clean</Badge>}
                  </TableCell>
                  <TableCell className="text-[10px] text-muted-foreground space-y-0.5">
                    {cat === 'identical' && <div className="text-muted-foreground">↻ Same as saved</div>}
                    {cat === 'update' && <div className="text-amber-700">✏ Will update existing</div>}
                    {cat === 'new' && <div className="text-emerald-700">+ New mark</div>}
                    {overAssessmentMax && (
                      <button
                        type="button"
                        onClick={() => updateRow(i, { marksObtained: aMax! })}
                        className="block text-left text-red-700 hover:underline"
                      >
                        Over max ({aMax}). Cap?
                      </button>
                    )}
                    {totalMismatch && (
                      <div className="text-amber-700">Total mismatch: file says {r.reportedTotal}, sum is {r.recomputedTotal}</div>
                    )}
                    {ambiguous && r.rawText && (
                      <div className="text-amber-700">Ambiguous chars: "{r.rawText}"</div>
                    )}
                    {isOutlier && <div className="text-amber-700">⚡ Class outlier</div>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Impact summary */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs sm:grid-cols-5">
        <div><span className="text-emerald-700 font-semibold">✔ {counts.create}</span> new</div>
        <div><span className="text-amber-700 font-semibold">✏ {strategy === 'overwrite' ? counts.update : 0}</span> updates {strategy === 'skip' && counts.update > 0 && `(${counts.update} skipped)`}</div>
        <div><span className="text-muted-foreground font-semibold">↻ {counts.identical}</span> identical</div>
        <div><span className="text-amber-700 font-semibold">⚠ {counts.warnings}</span> warnings</div>
        <div><span className="text-red-700 font-semibold">✗ {counts.blocked}</span> blocked</div>
      </div>

      {counts.blocked > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{counts.blocked} row(s) need attention before save. Pick a student/subject or fix the marks value.</span>
        </div>
      )}

      {requiresReviewGate && (
        <label className="flex items-center gap-2 rounded-lg border border-border/60 bg-card p-3 text-xs cursor-pointer">
          <Checkbox checked={reviewed} onCheckedChange={(v) => setReviewed(v === true)} />
          <span>I have reviewed every row above and the marks are correct.</span>
        </label>
      )}

      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>Back</Button>
        <Button onClick={handleConfirm} disabled={!canSave}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Confirm & Save {counts.willSave} mark{counts.willSave === 1 ? '' : 's'}
        </Button>
      </div>
    </div>
  );
}
