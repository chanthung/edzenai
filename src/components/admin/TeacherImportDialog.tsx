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
import { COLUMNS, parseTeacherWorkbook, validateRows, previewOutcomes, summarizeOutcomes, type RawRow, type Issue, type ImportResult } from '@/lib/teacher-import';
import { exportToXLSX } from '@/lib/export-utils';
import template from '@/assets/teacher-import-template.asset.json';

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
  const [result, setResult] = useState<ImportResult | null>(null);
  const checked = useMemo(() => validateRows(rows, teachers), [rows, teachers]);
  const issues = [...workbookIssues, ...checked.flatMap(r => r.issues)];
  const hasErrors = issues.some(i => i.severity === 'error');
  const preview = summarizeOutcomes(previewOutcomes(checked));
  const outcomes = result ?? preview;
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
    const entries = [...issues, ...(result?.results.filter(r => r.status !== 'updated').map(r => ({ rowNumber: r.rowNumber, field: 'save', severity: 'error', problem: r.reasons.join(' '), correction: 'Review this row before retrying.' })) ?? [])];
    exportToXLSX(entries.map(i => ({ Row: i.rowNumber, Field: i.field, Severity: i.severity, Problem: i.problem, Correction: i.correction })), { filename: 'EdZenAI_Teacher_Import_Errors', sheetName: 'Errors' });
  };
  const save = async () => {
    if (!school || isRestricted || !isSchoolAdmin || !approved || hasErrors || !rows.length || busy || result) return;
    setBusy(true); setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('import-teacher-hr', { body: {
        schoolId: school.id, rows: checked.map(r => ({ rowNumber: r.rowNumber, values: r.values, expectedUpdatedAt: r.teacher?.updated_at })),
      } });
      let body = data as ImportResult | null;
      if (invokeError && 'context' in invokeError) {
        try { body = await (invokeError.context as Response).json() as ImportResult; } catch { /* Fall back to an unconfirmed outcome. */ }
      }
      if (body && Array.isArray(body.results)) {
        setResult(body); setApproved(false); setError(body.error ?? '');
        if (body.updated > 0 || (body.created ?? 0) > 0) await queryClient.invalidateQueries({ queryKey: ['teachers', school.id] });
      } else {
        throw new Error(body?.error ?? 'Save outcome could not be confirmed. Refresh Users before retrying; do not assume records were saved.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save outcome could not be confirmed.';
      setError(message); setApproved(false);
      setResult(summarizeOutcomes(rows.map(row => ({ rowNumber: row.rowNumber, status: 'failed', reasons: [message] })), message));
    }
    finally { setBusy(false); }
  };
  if (!isSchoolAdmin) return null;
  return <>
    <Button variant="outline" disabled={isRestricted} onClick={() => { reset(); setOpen(true); }}><Upload className="h-4 w-4 mr-2" />Import Teachers</Button>
    <Dialog open={open} onOpenChange={v => { if (!busy) { setOpen(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader><DialogTitle>{result ? 'Import results' : 'Import Teachers'}</DialogTitle><DialogDescription>Email is optional: rows without an email are saved as teacher records marked Not invited — they get no login access until you invite them via Add User. Rows with a new email need the Add User invitation first. Blank HR cells preserve saved values. Importing never creates accounts or changes assignments.</DialogDescription></DialogHeader>
        <div className="overflow-y-auto min-h-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" asChild><a href={template.url} download="EdZenAI_Teacher_Import_Template.xlsx"><Download className="h-4 w-4 mr-2" />Download template</a></Button>
            <Input aria-label="Teacher workbook" type="file" accept=".xlsx" disabled={busy || isLoading} className="max-w-sm" onChange={e => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          {filename && <p className="text-sm break-all">{filename} · {rows.length} detected records</p>}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          {rows.length > 0 && <Alert><AlertDescription>
            <strong>{outcomes.created} created · {outcomes.updated} updated · {outcomes.invitationRequired} awaiting invitation · {outcomes.blocked} blocked · {outcomes.failed} failed</strong>
            {!result && <span> · {outcomes.ready} ready for review. Uploading alone saves nothing.</span>}
            {result && <p>{result.updated + result.created > 0 ? 'Saved records are available in the Users list (refreshed). Created records show as Not invited until you invite them via Add User.' : 'No records were confirmed saved.'}</p>}
          </AlertDescription></Alert>}
          {result && <div className="overflow-x-auto border rounded-xl"><Table><TableHeader><TableRow><TableHead>Excel row</TableHead><TableHead>Teacher</TableHead><TableHead>Result</TableHead><TableHead>Reason / next action</TableHead></TableRow></TableHeader><TableBody>{result.results.map((r, i) => <TableRow key={`${r.rowNumber}-${i}`}><TableCell>{r.rowNumber}</TableCell><TableCell>{rows.find(row => row.rowNumber === r.rowNumber)?.values.full_name}</TableCell><TableCell className="capitalize">{r.status}</TableCell><TableCell className="min-w-64">{r.reasons.join(' ')}</TableCell></TableRow>)}</TableBody></Table></div>}
          {rows.length > 0 && <>
            <p className="text-sm font-medium">{checked.filter(r => r.action === 'update').length} existing matches · {checked.filter(r => r.action === 'create').length} new records · {checked.filter(r => r.action === 'invitation_required').length} needing invitation · {issues.filter(i => i.severity === 'error').length} errors · {issues.filter(i => i.severity === 'warning').length} warnings</p>
            <div className="overflow-x-auto border rounded-xl">
              <Table><TableHeader><TableRow><TableHead>Row / Match</TableHead>{COLUMNS.map(c => <TableHead key={c}>{c}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{checked.map((row, index) => <TableRow key={row.rowNumber}>
                  <TableCell className="min-w-40 align-top">{row.rowNumber}<p className="text-xs text-muted-foreground">{row.teacher?.role === 'teacher' ? `${row.teacher.name} · ${row.teacher.employee_id ?? 'No ID'}` : row.action === 'create' ? 'New record · Not invited' : row.action === 'invitation_required' ? 'New teacher · invitation required' : 'Unmatched'}</p><p className="text-xs capitalize">{outcomes.results.find(r => r.rowNumber === row.rowNumber)?.status.replace('_', ' ')}</p></TableCell>
                  {COLUMNS.map(c => <TableCell key={c} className="min-w-44 align-top"><Input aria-label={`Row ${row.rowNumber} ${c}`} value={row.values[c] ?? ''} disabled={busy || !!result || c === 'employee_id'} onChange={e => { setApproved(false); setRows(previous => previous.map((r, i) => i === index ? { ...r, values: { ...r.values, [c]: e.target.value } } : r)); }} /></TableCell>)}
                </TableRow>)}</TableBody></Table>
            </div>
          </>}
          {issues.length > 0 && <div className="space-y-2">
            <Button variant="outline" size="sm" onClick={report}><Download className="mr-2 h-4 w-4" />Download error report</Button>
            <ul className="space-y-2 text-sm">{issues.map((i, index) => <li key={index} className={i.severity === 'error' ? 'text-destructive' : 'text-muted-foreground'}><strong>Row {i.rowNumber} · {i.field} · {i.severity}</strong>: {i.problem} {i.correction}</li>)}</ul>
          </div>}
          {result && (result.failed > 0 || result.blocked > 0) && <Button variant="outline" onClick={report}><Download className="mr-2 h-4 w-4" />Download save results</Button>}
        </div>
        <div className="border-t pt-4 space-y-3">
          {!result && rows.length > 0 && <label className="flex items-start gap-2 text-sm"><Checkbox checked={approved} disabled={hasErrors || busy} onCheckedChange={v => setApproved(v === true)} />I have reviewed all rows and approve these teacher record changes. I understand importing never grants login access.</label>}
          <div className="flex justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => { setOpen(false); reset(); }}>{result ? 'Close' : 'Cancel'}</Button>
            {result && <Button variant="outline" onClick={() => { setResult(null); setError(''); setApproved(false); void queryClient.invalidateQueries({ queryKey: ['teachers', school?.id] }); }}>Review again</Button>}
            {!result && <Button onClick={() => void save()} disabled={busy || isLoading || isRestricted || !rows.length || hasErrors || !approved}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Confirm import</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>;
}