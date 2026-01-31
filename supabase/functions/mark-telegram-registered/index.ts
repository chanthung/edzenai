import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone } = await req.json();

    // Validate phone input
    if (!phone || typeof phone !== "string") {
      console.log("Invalid request: missing or invalid phone");
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Normalize phone to 10 digits (remove country code, spaces, dashes)
    const normalizedPhone = phone
      .replace(/\D/g, "") // Remove non-digits
      .replace(/^91/, "") // Remove India country code if present
      .slice(-10); // Take last 10 digits

    if (normalizedPhone.length !== 10) {
      console.log(`Invalid phone format: ${phone} -> ${normalizedPhone}`);
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing registration for phone: ${normalizedPhone}`);

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update all students with matching parent_phone
    const { data, error, count } = await supabase
      .from("students")
      .update({ telegram_registered: true })
      .eq("parent_phone", normalizedPhone)
      .select("id, name");

    if (error) {
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const updatedCount = data?.length || 0;
    console.log(`Updated ${updatedCount} student(s) for phone ${normalizedPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${updatedCount} student(s)`,
        updated_students: data,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
