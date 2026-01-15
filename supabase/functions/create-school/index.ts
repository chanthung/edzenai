import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the caller is authenticated and is a platform admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client for user management
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create client with user's token to check permissions
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user's JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub

    // Check if the caller is a platform admin
    const { data: isPlatformAdmin, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .eq('role', 'platform_admin')
      .single()

    if (roleError || !isPlatformAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only platform admins can create schools' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { schoolName, schoolEmail, schoolPhone, adminEmail, adminPassword } = await req.json()

    if (!schoolName || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ error: 'School name, admin email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (adminPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the school admin user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm the email
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: `Failed to create admin user: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the school
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        email: schoolEmail || null,
        phone: schoolPhone || null,
      })
      .select()
      .single()

    if (schoolError) {
      // Cleanup: delete the created user if school creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create school: ${schoolError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Link the admin to the school
    const { error: adminLinkError } = await supabaseAdmin
      .from('school_admins')
      .insert({
        user_id: newUser.user.id,
        school_id: school.id,
        is_primary: true,
      })

    if (adminLinkError) {
      // Cleanup on failure
      await supabaseAdmin.from('schools').delete().eq('id', school.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to link admin: ${adminLinkError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add school_admin role to user_roles
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'school_admin',
      })

    if (roleInsertError) {
      console.error('Warning: Failed to insert school_admin role:', roleInsertError)
      // Non-fatal - the school_admins table link is the primary authorization
    }

    // Create default fee categories
    const { error: categoriesError } = await supabaseAdmin
      .from('fee_categories')
      .insert([
        { school_id: school.id, name: 'Tuition Fee', description: 'Annual tuition fees', is_mandatory: true, display_order: 1 },
        { school_id: school.id, name: 'Transport Fee', description: 'School bus/transport charges', is_mandatory: false, display_order: 2 },
        { school_id: school.id, name: 'Activities Fee', description: 'Sports, arts, and extracurricular activities', is_mandatory: false, display_order: 3 },
      ])

    if (categoriesError) {
      console.error('Warning: Failed to create default fee categories:', categoriesError)
      // Non-fatal - school can add categories later
    }

    return new Response(
      JSON.stringify({
        success: true,
        school: { id: school.id, name: school.name },
        admin: { id: newUser.user.id, email: newUser.user.email },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
