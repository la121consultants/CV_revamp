import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseAdmin, normalizeIdentifier } from "../_shared/usage.ts";
import { getPriceIdForPlan, getStripeClient } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { planType, userEmail } = await req.json();

    if (!planType || (planType !== "monthly" && planType !== "annual")) {
      return new Response(
        JSON.stringify({ error: "Invalid plan type." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "User email is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = getStripeClient();
    const supabaseAdmin = getSupabaseAdmin();
    const normalizedEmail = normalizeIdentifier(userEmail);

    const { data: existingSubscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    const priceId = getPriceIdForPlan(planType);
    const origin = req.headers.get("origin") || Deno.env.get("APP_BASE_URL") || "";

    if (!origin) {
      throw new Error("APP_BASE_URL is not configured");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: normalizedEmail,
      customer: existingSubscription?.stripe_customer_id || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      client_reference_id: normalizedEmail,
      subscription_data: {
        metadata: {
          userIdentifier: normalizedEmail,
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("create-checkout-session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
