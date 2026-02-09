import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.1.3";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export const getSupabaseAdmin = () => {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role credentials are not configured");
  }
  return createClient(url, serviceRoleKey);
};

export const normalizeIdentifier = (identifier: string) => identifier.trim().toLowerCase();

export const getUsageDate = (now = new Date()) =>
  formatInTimeZone(now, "Europe/London", "yyyy-MM-dd");

export type SubscriptionRecord = {
  user_identifier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_type: string;
  plan_name: string | null;
  price: number | null;
  billing_interval: string | null;
  status: string;
  start_date: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export const isActiveSubscription = (subscription: SubscriptionRecord | null) =>
  Boolean(subscription && subscription.status === "active");
