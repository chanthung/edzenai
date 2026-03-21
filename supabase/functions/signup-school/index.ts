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
    const { schoolName, adminName, email, phone, password, selectedPlan } = await req.json()

    // Validate required fields
    if (!schoolName || !adminName || !email || !phone || !password) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const plan = selectedPlan === 'pro' ? 'pro' : 'starter'

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create the user
    const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: adminName, phone },
    })

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate trial dates
    const today = new Date()
    const trialEndDate = new Date(today)
    trialEndDate.setDate(trialEndDate.getDate() + 30)
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    // Create the school
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        phone,
        email,
        subscription_plan: plan,
        subscription_status: 'trial',
        trial_start_date: formatDate(today),
        trial_end_date: formatDate(trialEndDate),
        system_state: 'trial_active',
        payment_verified: false,
      })
      .select()
      .single()

    if (schoolError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to create school: ${schoolError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Link admin to school
    const { error: adminLinkError } = await supabaseAdmin
      .from('school_admins')
      .insert({ user_id: newUser.user.id, school_id: school.id, is_primary: true })

    if (adminLinkError) {
      await supabaseAdmin.from('schools').delete().eq('id', school.id)
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return new Response(
        JSON.stringify({ error: `Failed to link admin: ${adminLinkError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add school_admin role
    await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: newUser.user.id, role: 'school_admin' })

    // Create default fee categories
    await supabaseAdmin
      .from('fee_categories')
      .insert([
        { school_id: school.id, name: 'Tuition Fee', description: 'Annual tuition fees', is_mandatory: true, display_order: 1 },
        { school_id: school.id, name: 'Transport Fee', description: 'School bus/transport charges', is_mandatory: false, display_order: 2 },
        { school_id: school.id, name: 'Activities Fee', description: 'Sports, arts, and extracurricular activities', is_mandatory: false, display_order: 3 },
      ])

    return new Response(
      JSON.stringify({
        success: true,
        school: { id: school.id, name: school.name },
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