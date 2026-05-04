import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { MarksImportMethodDialog, METHOD_ACCEPT } from './MarksImportMethodDialog';
import { MarksImportUploader } from './MarksImportUploader';
import { MarksImportPreview, type DuplicateStrategy } from './MarksImportPreview';
import {
  useParseMarksImport, useLogMarksImport, useExistingMarksForAssessment,
  type ImportMode, type PreviewResponse, type PreviewRow, type KnownStudent, type KnownSubject,
} from '@/hooks/progress/useMarksImport';
import { useSaveMarks } from '@/hooks/progress/useStudentMarks';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assessmentId: string;
  knownStudents: KnownStudent[];
  knownSubjects: KnownSubject[];
  /** Resolved max marks per subject for THIS assessment. */
  assessmentMaxBySubject: Record<string, number>;
  /** Currently selected class name, used for smart tab detection in multi-sheet Excel files. */
  className?: string;
}

type Step = 'method' | 'upload' | 'preview' | 'success';

export function MarksImportDialog({
  open, onOpenChange, assessmentId, knownStudents, knownSubjects, assessmentMaxBySubject, className,
}: Props) {
  const [step, setStep] = useState<Step>('method');
  const [mode, setMode] = useState<ImportMode>('excel');
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [savedAvgConf, setSavedAvgConf] = useState(100);
  const [savedExceedsMax, setSavedExceedsMax] = useState(0);
  const [savedSections, setSavedSections] = useState<Record<string, number>>({});
  const [fileName, setFileName] = useState('');

  const parse = useParseMarksImport();
  const saveMarks = useSaveMarks();
  const logImport = useLogMarksImport();
  const { data: existingMarks = new Map<string, number>() } = useExistingMarksForAssessment(assessmentId);
  const { toast } = useToast();

  const reset = () => {
    setStep('method'); setPreview(null); setSavedCount(0); setSavedSections({}); setFileName('');
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const res = await parse.mutateAsync({ mode, file, knownSubjects, knownStudents, assessmentMaxBySubject });
    setPreview(res);
    setStep('preview');
  };

  const handleSave = async (rows: PreviewRow[], _strategy: DuplicateStrategy) => {
    if (!assessmentId) {
      toast({ title: 'Select an assessment first', variant: 'destructive' });
      return;
    }
    const marks = rows
      .filter((r) => r.studentId && r.subjectId && r.marksObtained != null)
      .map((r) => ({
        student_id: r.studentId!,
        assessment_id: assessmentId,
        subject_id: r.subjectId!,
        marks_obtained: r.marksObtained!,
        max_marks: r.maxMarks ?? (r.subjectId ? assessmentMaxBySubject[r.subjectId] ?? 100 : 100),
      }));
    if (marks.length === 0) {
      toast({ title: 'No valid rows to save', variant: 'destructive' });
      return;
    }
    try {
      await saveMarks.mutateAsync(marks);
      setSavedCount(marks.length);
      setSavedAvgConf(preview?.summary.avgConfidence ?? 100);
      setSavedExceedsMax(preview?.summary.exceedsMax ?? 0);
      setSavedSections(preview?.summary.sectionBreakdown ?? {});
      logImport.mutate({
        fileName, mode,
        total: preview?.summary.totalRows ?? marks.length,
        saved: marks.length,
        failed: (preview?.summary.totalRows ?? marks.length) - marks.length,
        ignoredColumns: preview?.ignoredColumns ?? [],
        issueRows: rows.filter((r) => r.issues.length > 0),
      });
      setStep('success');
    } catch (e) {
      // toast handled by useSaveMarks
    }
  };

  const aiAnalysisOk = savedAvgConf >= 70 && savedExceedsMax === 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>Import Marks</DialogTitle>
          <DialogDescription>
            {step === 'method' && 'Choose how you want to import marks for this assessment.'}
            {step === 'upload' && 'Upload your file. We will parse it and show a preview before saving.'}
            {step === 'preview' && 'Review parsed rows. Fix any unmatched students or subjects, then confirm.'}
            {step === 'success' && 'Marks imported successfully.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'method' && (
          <MarksImportMethodDialog onPick={(m) => { setMode(m); setStep('upload'); }} />
        )}

        {step === 'upload' && (
          <div className="space-y-3">
            <MarksImportUploader
              accept={METHOD_ACCEPT[mode]}
              isLoading={parse.isPending}
              onFile={handleFile}
              hint={mode === 'excel' ? 'Supports .xlsx and .csv. Headers like Name, Roll No, and subject columns are auto-detected.' : 'Use a clear, well-lit photo. Higher resolution = better accuracy.'}
            />
            <div className="flex justify-start">
              <Button variant="ghost" onClick={() => setStep('method')} disabled={parse.isPending}>Back</Button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <MarksImportPreview
            preview={preview}
            mode={mode}
            knownStudents={knownStudents}
            knownSubjects={knownSubjects}
            assessmentMaxBySubject={assessmentMaxBySubject}
            existingMarks={existingMarks}
            isSaving={saveMarks.isPending}
            onSave={handleSave}
            onBack={() => setStep('upload')}
          />
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <div className="text-lg font-semibold">
                Imported {savedCount} mark{savedCount === 1 ? '' : 's'}
                {Object.keys(savedSections).length > 1 && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    across sections {Object.keys(savedSections).sort().join(', ')}
                  </span>
                )}
              </div>
              {aiAnalysisOk ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Confidence is high — you can run AI analysis from the Progress Dashboard.
                </p>
              ) : (
                <p className="mt-1 text-sm text-amber-700">
                  Average confidence below 70% or some marks exceeded the max. Re-check the entries before running AI analysis.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { reset(); }}>Import another</Button>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
