import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export type PlanDescriptor = {
  planType: "monthly" | "annual";
  planName: string;
  price: number;
  billingInterval: "monthly" | "yearly";
  priceId: string;
};

export const getStripeClient = () => {
  const secretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(secretKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  });
};

export const getPlanByPriceId = (priceId: string | null | undefined): PlanDescriptor | null => {
  const monthlyId = Deno.env.get("STRIPE_MONTHLY_PRICE_ID");
  const annualId = Deno.env.get("STRIPE_ANNUAL_PRICE_ID");
  if (!priceId || !monthlyId || !annualId) {
    return null;
  }
  if (priceId === monthlyId) {
    return {
      planType: "monthly",
      planName: "Unlimited CV Revamps – Monthly",
      price: 16.99,
      billingInterval: "monthly",
      priceId: monthlyId,
    };
  }
  if (priceId === annualId) {
    return {
      planType: "annual",
      planName: "Unlimited CV Revamps – Annual",
      price: 149,
      billingInterval: "yearly",
      priceId: annualId,
    };
  }
  return null;
};

export const getPriceIdForPlan = (planType: "monthly" | "annual") => {
  const monthlyId = Deno.env.get("STRIPE_MONTHLY_PRICE_ID");
  const annualId = Deno.env.get("STRIPE_ANNUAL_PRICE_ID");
  if (!monthlyId || !annualId) {
    throw new Error("Stripe price IDs are not configured");
  }
  return planType === "monthly" ? monthlyId : annualId;
};

export const mapStripeStatus = (status: string) => {
  if (status === "active" || status === "trialing") {
    return "active";
  }
  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return "past_due";
  }
  return "cancelled";
};
