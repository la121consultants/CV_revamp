
-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'free',
  plan_name TEXT,
  price NUMERIC,
  billing_interval TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  start_date TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on user_identifier
CREATE UNIQUE INDEX idx_subscriptions_user_identifier ON public.subscriptions (user_identifier);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access; no direct client access needed
CREATE POLICY "Service role full access on subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create user_usage table for tracking daily usage
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  cv_revamp_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on user + date
CREATE UNIQUE INDEX idx_user_usage_identifier_date ON public.user_usage (user_identifier, usage_date);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) full access
CREATE POLICY "Service role full access on user_usage"
  ON public.user_usage
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add trigger for subscriptions updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
