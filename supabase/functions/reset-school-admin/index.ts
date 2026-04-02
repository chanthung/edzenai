import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify caller using getUser()
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id

    // Verify platform admin
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'platform_admin')
      .maybeSingle()

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Only platform admins can reset school admin passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { schoolId, action, redirectTo } = await req.json()

    if (!schoolId) {
      return new Response(
        JSON.stringify({ error: 'schoolId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the primary admin for this school
    const { data: primaryAdmin, error: adminError } = await supabaseAdmin
      .from('school_admins')
      .select('user_id')
      .eq('school_id', schoolId)
      .eq('is_primary', true)
      .maybeSingle()

    if (adminError || !primaryAdmin) {
      return new Response(
        JSON.stringify({ error: 'No primary admin found for this school' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resolve the admin's auth email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(primaryAdmin.user_id)

    if (authError || !authUser?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'Could not resolve admin login email' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adminEmail = authUser.user.email

    if (action === 'get-admin-email') {
      return new Response(
        JSON.stringify({ adminEmail }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'send-reset') {
      // Use resetPasswordForEmail which actually SENDS the recovery email
      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
        adminEmail,
        { redirectTo: redirectTo || undefined }
      )

      if (resetError) {
        return new Response(
          JSON.stringify({ error: `Failed to send reset: ${resetError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ success: true, adminEmail }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "get-admin-email" or "send-reset"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
