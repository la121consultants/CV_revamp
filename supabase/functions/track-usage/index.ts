import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseAdmin, getUsageDate, isActiveSubscription, normalizeIdentifier } from "../_shared/usage.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, mode } = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = normalizeIdentifier(userEmail);
    const supabaseAdmin = getSupabaseAdmin();

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (isActiveSubscription(subscriptionData)) {
      return new Response(
        JSON.stringify({ allowed: true, planType: subscriptionData?.plan_type ?? "monthly", status: subscriptionData?.status ?? "active" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const usageDate = getUsageDate();
    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("user_usage")
      .select("cv_revamp_count")
      .eq("user_identifier", normalizedEmail)
      .eq("usage_date", usageDate)
      .maybeSingle();

    if (usageError) {
      throw usageError;
    }

    const currentUsage = usageData?.cv_revamp_count ?? 0;
    if (currentUsage >= 1) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Usage limit reached." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (mode === "consume") {
      if (!usageData) {
        const { error: insertError } = await supabaseAdmin
          .from("user_usage")
          .insert({
            user_identifier: normalizedEmail,
            usage_date: usageDate,
            cv_revamp_count: 1,
          });
        if (insertError) throw insertError;
      } else {
        const { error: updateError } = await supabaseAdmin
          .from("user_usage")
          .update({ cv_revamp_count: currentUsage + 1 })
          .eq("user_identifier", normalizedEmail)
          .eq("usage_date", usageDate);
        if (updateError) throw updateError;
      }
    }

    return new Response(
      JSON.stringify({ allowed: true, remaining: 1 - currentUsage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("track-usage error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
