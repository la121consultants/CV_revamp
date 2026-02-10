import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const caller = userData.user;
    if (!caller) throw new Error("Not authenticated");

    // Check super_admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Insufficient permissions - super_admin required");

    const { action, email, grant_id, notes } = await req.json();

    if (action === "list") {
      const { data, error } = await supabase
        .from("unlimited_access_grants")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ grants: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant") {
      if (!email) throw new Error("Email is required");

      // Check if already granted
      const { data: existing } = await supabase
        .from("unlimited_access_grants")
        .select("id")
        .eq("user_email", email.toLowerCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (existing) throw new Error("User already has unlimited access");

      const { data, error } = await supabase
        .from("unlimited_access_grants")
        .insert({
          user_email: email.toLowerCase().trim(),
          granted_by: caller.id,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, grant: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      if (!grant_id) throw new Error("Grant ID is required");

      const { error } = await supabase
        .from("unlimited_access_grants")
        .update({ is_active: false, revoked_at: new Date().toISOString() })
        .eq("id", grant_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      if (!email) throw new Error("Email is required");
      const { data } = await supabase
        .from("unlimited_access_grants")
        .select("id")
        .eq("user_email", email.toLowerCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      return new Response(JSON.stringify({ has_unlimited: !!data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("manage-unlimited-access error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
