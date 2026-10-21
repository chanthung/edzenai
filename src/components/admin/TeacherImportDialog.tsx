import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';
import { useTeachers } from '@/hooks/useTeachers';
import { useUserRole } from '@/hooks/useUserRole';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { COLUMNS, parseTeacherWorkbook, validateRows, type RawRow, type Issue } from '@/lib/teacher-import';
import { exportToXLSX } from '@/lib/export-utils';
import template from '@/assets/teacher-import-template.asset.json';

type Result = { updated: number; failed: number; results: { rowNumber: number; success: boolean; error?: string }[] };

export function TeacherImportDialog() {
  const { isSchoolAdmin } = useUserRole();
  const { isRestricted } = useSubscriptionStatus();
  const { data: school } = useSchool();
  const { teachers, isLoading } = useTeachers();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [workbookIssues, setWorkbookIssues] = useState<Issue[]>([]);
  const [filename, setFilename] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [approved, setApproved] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const checked = useMemo(() => validateRows(rows, teachers), [rows, teachers]);
  const issues = [...workbookIssues, ...checked.flatMap(r => r.issues)];
  const hasErrors = issues.some(i => i.severity === 'error');
  const reset = () => { setRows([]); setWorkbookIssues([]); setFilename(''); setError(''); setApproved(false); setResult(null); };
  const onFile = async (file?: File) => {
    reset(); if (!file) return; setFilename(file.name);
    if (!file.name.toLowerCase().endsWith('.xlsx')) { setError('Choose an .xlsx workbook.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Workbook must be smaller than 5 MB.'); return; }
    setBusy(true);
    try { const parsed = parseTeacherWorkbook(await file.arrayBuffer()); setRows(parsed.rows); setWorkbookIssues(parsed.issues); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not read workbook.'); }
    finally { setBusy(false); }
  };
  const report = () => {
    const entries = [...issues, ...(result?.results.filter(r => !r.success).map(r => ({ rowNumber: r.rowNumber, field: 'save', severity: 'error', problem: r.error ?? 'Update failed.', correction: 'Review and retry this row.' })) ?? [])];
    exportToXLSX(entries.map(i => ({ Row: i.rowNumber, Field: i.field, Severity: i.severity, Problem: i.problem, Correction: i.correction })), { filename: 'EdZenAI_Teacher_Import_Errors', sheetName: 'Errors' });
  };
  const save = async () => {
    if (!school || isRestricted || !isSchoolAdmin || !approved || hasErrors || !rows.length || busy || result) return;
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('import-teacher-hr', { body: {
        schoolId: school.id, rows: checked.map(r => ({ rowNumber: r.rowNumber, values: r.values, expectedUpdatedAt: r.teacher?.updated_at })),
      } });
      if (invokeError || data?.error) {
        let message = data?.error;
        if (!message && invokeError && 'context' in invokeError) {
          try { const body = await (invokeError.context as Response).json(); message = body.error; } catch { /* Use safe fallback. */ }
        }
        throw new Error(message ?? 'Import failed. Refresh the preview before retrying.');
      }
      setResult(data as Result); setApproved(false);
      await queryClient.invalidateQueries({ queryKey: ['teachers', school.id] });
    } catch (e) { setError(e instanceof Error ? e.message : 'Import failed.'); }
    finally { setBusy(false); }
  };
  if (!isSchoolAdmin) return null;
  return <>
    <Button variant="outline" disabled={isRestricted} onClick={() => { reset(); setOpen(true); }}><Upload className="h-4 w-4 mr-2" />Import Teachers</Button>
    <Dialog open={open} onOpenChange={v => { if (!busy) { setOpen(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader><DialogTitle>Import Teachers</DialogTitle><DialogDescription>Existing Teacher accounts only. Blank HR cells preserve saved values. No invitations, login changes or assignment changes.</DialogDescription></DialogHeader>
        <div className="overflow-y-auto min-h-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild><a href={template.url} download="EdZenAI_Teacher_Import_Template.xlsx"><Download className="h-4 w-4 mr-2" />Download template</a></Button>
            <Input aria-label="Teacher workbook" type="file" accept=".xlsx" disabled={busy || isLoading} className="max-w-sm" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          {filename && <p className="text-sm break-all">{filename} · {rows.length} detected records</p>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {result && <Alert><AlertDescription>{result.updated} existing records updated · {result.failed} failed · 0 new records created · 0 skipped</AlertDescription></Alert>}
          {rows.length > 0 && <>
            <p className="text-sm font-medium">{checked.filter(r => r.teacher && r.teacher.role === 'teacher').length} existing matches · {issues.filter(i => i.severity === 'error').length} errors · {issues.filter(i => i.severity === 'warning').length} warnings</p>
            <div className="overflow-x-auto border rounded-xl">
              <Table><TableHeader><TableRow><TableHead>Row / Match</TableHead>{COLUMNS.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{checked.map((row, index) => <TableRow key={row.rowNumber}>
                  <TableCell className="min-w-40 align-top">{row.rowNumber}<p className="text-xs text-muted-foreground">{row.teacher?.role === 'teacher' ? `${row.teacher.name} · ${row.teacher.employee_id ?? 'No ID'}` : 'Blocked / unmatched'}</p></TableCell>
                  {COLUMNS.map(c => <TableCell key={c} className="min-w-44 align-top"><Input aria-label={`Row ${row.rowNumber} ${c}`} value={row.values[c] ?? ''} disabled={busy || !!result || c === 'employee_id'} onChange={e => { setApproved(false); setRows(previous => previous.map((r, i) => i === index ? { ...r, values: { ...r.values, [c]: e.target.value } } : r)); }} /></TableCell>)}
                </TableRow>)}</TableBody></Table>
            </div>
          </>}
          {issues.length > 0 && <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={report}><Download className="mr-2 h-4 w-4" />Download error report</Button>
            <ul className="space-y-2 text-sm">{issues.map((i, index) => <li key={index} className={i.severity === 'error' ? 'text-destructive' : 'text-muted-foreground'}><strong>Row {i.rowNumber} · {i.field} · {i.severity}</strong>: {i.problem} {i.correction}</li>)}</ul>
          </div>}
          {result && result.failed > 0 && <><Button variant="outline" onClick={report}>Download error report</Button>{result.results.filter(r => !r.success).map(r => <p key={r.rowNumber} className="text-sm text-destructive">Row {r.rowNumber}: {r.error}</p>)}</>}
        </div>
        <div className="border-t pt-4 space-y-3">
          {!result && rows.length > 0 && <label className="flex items-start gap-2 text-sm"><Checkbox checked={approved} disabled={hasErrors || busy} onCheckedChange={v => setApproved(v === true)} />I have reviewed all rows and approve updating these existing teachers.</label>}
          <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>{result ? 'Close' : 'Cancel'}</Button>
            {!result && <Button onClick={() => void save()} disabled={busy || isLoading || isRestricted || !rows.length || hasErrors || !approved}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirm import</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}