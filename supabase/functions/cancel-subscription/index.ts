import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseAdmin, normalizeIdentifier } from "../_shared/usage.ts";
import { getStripeClient, mapStripeStatus, getPlanByPriceId } from "../_shared/stripe.ts";
import { requireAuth } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;

    const supabaseAdmin = getSupabaseAdmin();
    const stripe = getStripeClient();
    const normalizedEmail = normalizeIdentifier(authResult.email);

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_identifier", normalizedEmail)
      .maybeSingle();

    if (subscriptionError) {
      throw subscriptionError;
    }

    if (!subscriptionData?.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ error: "No active subscription found." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(subscriptionData.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const priceId = updatedSubscription.items.data[0]?.price?.id;
    const plan = getPlanByPriceId(priceId);

    const { error: updateError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        status: mapStripeStatus(updatedSubscription.status),
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        plan_type: plan?.planType ?? subscriptionData.plan_type,
        plan_name: plan?.planName ?? subscriptionData.plan_name,
        price: plan?.price ?? subscriptionData.price,
        billing_interval: plan?.billingInterval ?? subscriptionData.billing_interval,
      })
      .eq("user_identifier", normalizedEmail);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("cancel-subscription error:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
