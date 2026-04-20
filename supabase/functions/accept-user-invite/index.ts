import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);

    // GET → validate token (used by accept-invite page on load)
    if (req.method === 'GET') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response(JSON.stringify({ error: 'token required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: invite } = await supabaseAdmin
        .from('user_invites')
        .select('id, email, name, role, school_id, expires_at, accepted_at')
        .eq('token', token)
        .maybeSingle();

      if (!invite) {
        return new Response(JSON.stringify({ valid: false, reason: 'invalid' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (invite.accepted_at) {
        return new Response(JSON.stringify({ valid: false, reason: 'used' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (new Date(invite.expires_at) < new Date()) {
        return new Response(JSON.stringify({ valid: false, reason: 'expired' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: school } = await supabaseAdmin
        .from('schools').select('name').eq('id', invite.school_id).single();

      return new Response(JSON.stringify({
        valid: true,
        email: invite.email,
        name: invite.name,
        role: invite.role,
        schoolName: school?.name,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // POST → accept invite
    const { token, password } = await req.json();
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'token and password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: invite } = await supabaseAdmin
      .from('user_invites').select('*').eq('token', token).maybeSingle();

    if (!invite) {
      return new Response(JSON.stringify({ error: 'Invalid invite' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (invite.accepted_at) {
      return new Response(JSON.stringify({ error: 'Invite already accepted' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'Invite has expired' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the auth user
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

    if (authErr || !authData?.user) {
      console.error('Create user error:', authErr);
      return new Response(JSON.stringify({ error: authErr?.message || 'Failed to create account' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUserId = authData.user.id;
    const appRole = invite.role === 'accountant' ? 'accountant' : 'teacher';

    // user_roles
    const { error: roleErr } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUserId, role: appRole,
    });
    if (roleErr) {
      console.error('Role insert error:', roleErr);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // school_teachers record
    const { data: teacherRow, error: teacherErr } = await supabaseAdmin
      .from('school_teachers')
      .insert({
        user_id: newUserId,
        school_id: invite.school_id,
        name: invite.name,
        email: invite.email,
        role: invite.role,
      })
      .select('id')
      .single();

    if (teacherErr || !teacherRow) {
      console.error('Teacher record error:', teacherErr);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: 'Failed to create user record' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply pending assignments (subjects + classes)
    const assignments = invite.assignments as any[] | null;
    if (Array.isArray(assignments) && assignments.length > 0) {
      const subjectAssigns = assignments.filter(a => a.type === 'subject').map(a => ({
        teacher_id: teacherRow.id,
        school_id: invite.school_id,
        subject_id: a.subject_id,
        class_name: a.class_name,
      }));
      const classAssigns = assignments.filter(a => a.type === 'class').map(a => ({
        teacher_id: teacherRow.id,
        school_id: invite.school_id,
        class_name: a.class_name,
        section: a.section ?? null,
      }));

      if (subjectAssigns.length > 0) {
        await supabaseAdmin.from('teacher_subject_assignments').insert(subjectAssigns);
      }
      if (classAssigns.length > 0) {
        await supabaseAdmin.from('teacher_class_assignments').insert(classAssigns);
      }
    }

    // Mark invite as accepted
    await supabaseAdmin
      .from('user_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    console.log(`Invite accepted: ${invite.email} as ${invite.role}`);

    return new Response(JSON.stringify({
      success: true,
      email: invite.email,
      role: invite.role,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
