import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canInviteExistingHrRecord } from '../../supabase/functions/create-user-invite/hr-record-compatibility';

// Execute the actual function body with isolated Cloud responses. No network,
// invitation delivery, database writes or account creation occurs in this suite.
const source = readFileSync('supabase/functions/create-user-invite/index.ts', 'utf8')
  .replace(/^import .*;\r?\n/gm, '');
const javascript = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const targetId = '00000000-0000-4000-8000-000000000004';
let records: { user_id: string | null; name: string; role: string }[];
let issueError: { code: string; message: string } | null;
let insertError: { message: string } | null;
let inserted: any[];
let rpc: ReturnType<typeof vi.fn>;
let handler: (req: Request) => Promise<Response>;

beforeEach(() => {
  records = []; issueError = null; insertError = null; inserted = [];
  rpc = vi.fn(async () => ({ data: issueError ? null : [{ invite_id: 'invite', invite_token: 'test-only',
    invite_expires_at: '2026-10-28' }], error: issueError }));
  const client = {
    auth: { getUser: async () => ({ data: { user: { id: 'admin', user_metadata: { full_name: 'Admin' } } }, error: null }) },
    rpc,
    functions: { invoke: vi.fn(async () => ({ error: null })) },
    from(table: string) {
      let action = 'select';
      const result = () => {
        if (table === 'school_admins') return { data: { school_id: 'school' }, error: null };
        if (table === 'schools') return { data: { name: 'Test School' }, error: null };
        if (table === 'school_teachers') return { data: records, error: null };
        if (action === 'insert') return { data: insertError ? null : { id: 'invite', token: 'test-only', expires_at: '2026-10-28' }, error: insertError };
        return { data: null, error: null };
      };
      const query: any = {
        select: () => query, eq: () => query, is: () => query, ilike: () => query,
        delete: () => { action = 'delete'; return query; },
        insert: (row: any) => { action = 'insert'; inserted.push(row); return query; },
        single: async () => result(), maybeSingle: async () => result(),
        then: (resolve: any, reject: any) => Promise.resolve(result()).then(resolve, reject),
      };
      return query;
    },
  };
  new Function('createClient', 'canInviteExistingHrRecord', 'Deno', javascript)(
    () => client, canInviteExistingHrRecord,
    { env: { get: () => 'test-value' }, serve: (fn: typeof handler) => { handler = fn; } },
  );
});

async function send(extra: object = {}) {
  return handler(new Request('https://app.example.test/invite', { method: 'POST',
    headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'New Teacher', email: 'unused@example.test', role: 'teacher', ...extra }),
  }));
}

describe('Existing new-teacher and Accountant server paths', () => {
  it('creates a legacy invitation for a genuinely unused email, without targeted RPC', async () => {
    expect((await send()).status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({ email: 'unused@example.test', role: 'teacher', school_id: 'school' });
    expect(inserted[0]).not.toHaveProperty('target_teacher_id');
  });
  it('keeps Accountant invitations on the legacy path', async () => {
    expect((await send({ role: 'accountant' })).status).toBe(200);
    expect(inserted[0].role).toBe('accountant');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('rejects an email belonging to a linked teacher account', async () => {
    records = [{ user_id: 'existing-account', name: 'New Teacher', role: 'teacher' }];
    expect((await send()).status).toBe(409);
    expect(inserted).toHaveLength(0);
  });
  it('rejects ambiguous duplicate HR emails rather than merging records', async () => {
    records = [1, 2].map(() => ({ user_id: null, name: 'New Teacher', role: 'teacher' }));
    expect((await send()).status).toBe(409);
    expect(inserted).toHaveLength(0);
  });
  it('preserves compatible single HR-record legacy invitations', async () => {
    records = [{ user_id: null, name: 'New Teacher', role: 'teacher' }];
    expect((await send()).status).toBe(200);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('preserves database rejection of a legacy invite conflicting with a targeted invite', async () => {
    insertError = { message: 'Conflicting invitation already exists; cancel or resend it' };
    const response = await send();
    expect(response.status).toBe(409);
    expect((await response.json()).error).toContain('already pending');
  });
});

describe('Targeted server path never falls back to legacy insertion', () => {
  it('delegates exact record targeting to the authorized database operation', async () => {
    expect((await send({ target_teacher_id: targetId })).status).toBe(200);
    expect(rpc).toHaveBeenCalledWith('issue_teacher_link_invite', {
      _actor: 'admin', _teacher: targetId, _email: 'unused@example.test', _delivery: 'email', _phone: null,
    });
    expect(inserted).toHaveLength(0);
  });
  it.each([
    ['P0001', 'Email is already associated with another record or account', 409],
    ['P0001', 'Conflicting invitation already exists; cancel or resend it', 409],
    ['42501', 'Teacher not authorized', 403],
  ])('preserves server rejection: %s %s', async (code, message, status) => {
    issueError = { code, message };
    const response = await send({ target_teacher_id: targetId });
    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(message);
    expect(inserted).toHaveLength(0);
  });
});