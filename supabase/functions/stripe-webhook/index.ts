import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getSupabaseAdmin, corsHeaders } from "../_shared/usage.ts";
import { getPlanByPriceId, getStripeClient, mapStripeStatus } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = getStripeClient();
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return new Response(
      JSON.stringify({ error: "STRIPE_WEBHOOK_SECRET is not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing Stripe signature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.text();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    const supabaseAdmin = getSupabaseAdmin();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userIdentifier = session.client_reference_id || session.customer_details?.email || session.customer_email;
      if (!userIdentifier || !session.subscription) {
        throw new Error("Missing user identifier or subscription in checkout session.");
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = getPlanByPriceId(priceId);
      const status = mapStripeStatus(subscription.status);
      const normalizedIdentifier = userIdentifier.trim().toLowerCase();

      await supabaseAdmin.from("subscriptions").upsert(
        {
          user_identifier: normalizedIdentifier,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: subscription.id,
          plan_type: plan?.planType ?? "free",
          plan_name: plan?.planName ?? null,
          price: plan?.price ?? null,
          billing_interval: plan?.billingInterval ?? null,
          status,
          start_date: new Date(subscription.start_date * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        },
        { onConflict: "user_identifier" }
      );
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id;
        const plan = getPlanByPriceId(priceId);
        const status = mapStripeStatus(subscription.status);

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status,
            plan_type: plan?.planType ?? "free",
            plan_name: plan?.planName ?? null,
            price: plan?.price ?? null,
            billing_interval: plan?.billingInterval ?? null,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string | null;
      if (subscriptionId) {
        await supabaseAdmin
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price?.id;
      const plan = getPlanByPriceId(priceId);
      const status = mapStripeStatus(subscription.status);

      await supabaseAdmin
        .from("subscriptions")
        .update({
          status,
          plan_type: plan?.planType ?? "free",
          plan_name: plan?.planName ?? null,
          price: plan?.price ?? null,
          billing_interval: plan?.billingInterval ?? null,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await supabaseAdmin
        .from("subscriptions")
        .update({
          status: "cancelled",
          plan_type: "free",
          plan_name: null,
          price: null,
          billing_interval: null,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq("stripe_subscription_id", subscription.id);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
