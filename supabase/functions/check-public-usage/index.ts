import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getGlobalAppSettings, getSupabaseAdmin, getUsageDate, isActiveSubscription, normalizeIdentifier } from "../_shared/usage.ts";
import { errorResponse } from "../_shared/errors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return errorResponse("ERR_2002_INVALID_REQUEST", "Email is required.");
    }

    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = normalizeIdentifier(email);
    const usageDate = getUsageDate();

    const globalSettings = await getGlobalAppSettings(supabaseAdmin);

    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const { data: subscriptionData } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    const { data: usageData } = await supabaseAdmin
      .from("user_usage")
      .select("cv_revamp_count")
      .eq("user_identifier", normalizedEmail)
      .eq("usage_date", usageDate)
      .maybeSingle();

    const hasActiveSubscription = isActiveSubscription(subscriptionData);
    const usedToday = usageData?.cv_revamp_count ?? 0;

    if (globalSettings.free_mode_enabled || hasActiveSubscription) {
      return new Response(
        JSON.stringify({
          registered: Boolean(profileData),
          allowed: true,
          usedToday,
          remaining: null,
          limit: null,
          hasActiveSubscription,
          freeModeEnabled: globalSettings.free_mode_enabled,
          freeModeBanner: globalSettings.free_mode_banner,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const limit = 1;
    const remaining = Math.max(0, limit - usedToday);

    return new Response(
      JSON.stringify({
        registered: Boolean(profileData),
        allowed: usedToday < limit,
        usedToday,
        remaining,
        limit,
        hasActiveSubscription: false,
        freeModeEnabled: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("check-public-usage error:", e);
    return errorResponse("ERR_2500_INTERNAL_ERROR");
  }
});
