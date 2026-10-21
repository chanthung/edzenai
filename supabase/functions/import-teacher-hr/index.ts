import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { COLUMNS, validateRows, previewOutcomes, summarizeOutcomes, type RowOutcome, type ExistingTeacher } from './validation.ts';

const values = z.object(Object.fromEntries(COLUMNS.map(key => [key, z.string().max(1000).optional()]))).strict();
const bodySchema = z.object({
  schoolId: z.string().uuid(),
  rows: z.array(z.object({ rowNumber: z.number().int().positive(), values, expectedUpdatedAt: z.string().optional() }).strict()).min(1).max(500),
}).strict();
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return response({ error: 'Sign in required.' }, 401);
    const url = Deno.env.get('SUPABASE_URL'); const key = Deno.env.get('SUPABASE_ANON_KEY');
    if (!url || !key) return response({ error: 'Import unavailable.' }, 500);
    const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
    const { data: auth, error: authError } = await client.auth.getClaims(authorization.slice(7));
    if (authError || !auth?.claims?.sub) return response({ error: 'Sign in required.' }, 401);
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) return response({ error: 'Invalid import request.' }, 400);
    const { schoolId, rows } = parsed.data;
    const reject = (error: string, status: number) => response(summarizeOutcomes(rows.map(row => ({ rowNumber: row.rowNumber, status: 'blocked', reasons: [error] })), error), status);
    // The browser's school is a selector, never an authority. Verify exact membership.
    const { data: membership, error: memberError } = await client.from('school_admins').select('school_id').eq('user_id', auth.claims.sub).eq('school_id', schoolId).maybeSingle();
    if (memberError || !membership) return reject('Only an administrator of this school can import teachers. No records were saved.', 403);
    const [restricted, blocked] = await Promise.all([
      client.rpc('is_school_restricted', { _school_id: membership.school_id }),
      client.rpc('is_school_access_blocked', { _school_id: membership.school_id }),
    ]);
    if (restricted.error || blocked.error || restricted.data !== false || blocked.data !== false) return reject('School changes are currently restricted. No records were saved.', 403);
    const { data: teachers, error } = await client.from('school_teachers').select('*').eq('school_id', membership.school_id);
    if (error) return response({ error: 'Could not read school teachers.' }, 500);
    const checked = validateRows(rows, (teachers ?? []) as ExistingTeacher[]);
    const issues = checked.flatMap(row => row.issues);
    if (issues.some(issue => issue.severity === 'error')) {
      const outcomes = previewOutcomes(checked).map(row => row.status === 'ready' ? { ...row, status: 'blocked' as const, reasons: ['Not saved: another workbook row needs correction.'] } : row);
      return response({ ...summarizeOutcomes(outcomes, 'Correct the workbook before importing. No records were saved.'), issues }, 400);
    }
    // Recheck dates on the server and reject stale previews before the first write (updates only; creates have no prior record).
    if (checked.some((row, i) => row.action === 'update' && (!rows[i].expectedUpdatedAt || rows[i].expectedUpdatedAt !== row.teacher?.updated_at))) return reject('Teacher records changed since preview. Reload and review again. No records were saved.', 409);
    const results: RowOutcome[] = [];
    for (const row of checked) {
      if (row.action === 'invitation_required') {
        results.push({ rowNumber: row.rowNumber, status: 'invitation_required', reasons: ['No existing teacher matches this email. Invite them via Add User; nothing was saved for this row.'] });
        continue;
      }
      if (results.some(r => r.status === 'failed')) {
        results.push({ rowNumber: row.rowNumber, status: 'blocked', reasons: ['Not attempted: an earlier write failed. Review saved rows before retrying.'] });
        continue;
      }
      if (row.action === 'create') {
        // HR-only record: no auth account, no email, Employee ID assigned by the database trigger.
        const { data, error: insertError } = await client.from('school_teachers')
          .insert({ school_id: membership.school_id, name: row.values.full_name!.trim(), role: 'teacher', ...row.updates })
          .select('id');
        results.push({ rowNumber: row.rowNumber, status: !insertError && data?.length === 1 ? 'created' : 'failed',
          reasons: [!insertError && data?.length === 1 ? 'Teacher record created without login access (Not invited). Employee ID was system-generated.' : 'Create failed. This row was not saved.'] });
        continue;
      }
      if (!row.teacher) continue;
      if (!Object.keys(row.updates).length) {
        results.push({ rowNumber: row.rowNumber, status: 'blocked', reasons: ['No non-blank supported HR fields to update. Existing values were preserved.'] });
        continue;
      }
      const { data, error: updateError } = await client.from('school_teachers').update(row.updates)
        .eq('id', row.teacher.id).eq('school_id', membership.school_id).eq('role', 'teacher')
        .eq('updated_at', row.teacher.updated_at).select('id');
      results.push({ rowNumber: row.rowNumber, status: !updateError && data?.length === 1 ? 'updated' : 'failed',
        reasons: [!updateError && data?.length === 1 ? 'HR fields saved. Account, Employee ID and assignments unchanged.' : 'Update failed or record changed. This row was not saved.'] });
    }
    return response(summarizeOutcomes(results));
  } catch { return response({ error: 'Import could not be processed.' }, 400); }
});
