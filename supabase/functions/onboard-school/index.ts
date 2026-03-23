import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's JWT to verify identity
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub as string

    // Verify email is confirmed before allowing school creation
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (!userData?.user?.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: 'Email not verified. Please verify your email first.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { schoolName, adminName, phone, selectedPlan } = await req.json()

    if (!schoolName) {
      return new Response(
        JSON.stringify({ error: 'School name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const plan = selectedPlan === 'pro' ? 'pro' : 'starter'

    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user already has a school
    const { data: existingAdmin } = await supabaseAdmin
      .from('school_admins')
      .select('school_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingAdmin) {
      return new Response(
        JSON.stringify({ error: 'You already have a school linked to your account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update user metadata if provided
    if (adminName || phone) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...(adminName && { full_name: adminName }),
          ...(phone && { phone }),
        },
      })
    }

    // Calculate trial dates
    const today = new Date()
    const trialEndDate = new Date(today)
    trialEndDate.setDate(trialEndDate.getDate() + 30)
    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    // Get user email for school record
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId)
    const userEmail = userData?.user?.email || ''

    // Create the school
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .insert({
        name: schoolName,
        phone: phone || null,
        email: userEmail,
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
      return new Response(
        JSON.stringify({ error: `Failed to create school: ${schoolError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Link admin to school
    const { error: adminLinkError } = await supabaseAdmin
      .from('school_admins')
      .insert({ user_id: userId, school_id: school.id, is_primary: true })

    if (adminLinkError) {
      await supabaseAdmin.from('schools').delete().eq('id', school.id)
      return new Response(
        JSON.stringify({ error: `Failed to link admin: ${adminLinkError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add school_admin role
    await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'school_admin' })

    // Create default fee categories
    await supabaseAdmin
      .from('fee_categories')
      .insert([
        { school_id: school.id, name: 'Tuition Fee', description: 'Annual tuition fees', is_mandatory: true, display_order: 1 },
        { school_id: school.id, name: 'Transport Fee', description: 'School bus/transport charges', is_mandatory: false, display_order: 2 },
        { school_id: school.id, name: 'Activities Fee', description: 'Sports, arts, and extracurricular activities', is_mandatory: false, display_order: 3 },
      ])

    return new Response(
      JSON.stringify({ success: true, school: { id: school.id, name: school.name } }),
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
