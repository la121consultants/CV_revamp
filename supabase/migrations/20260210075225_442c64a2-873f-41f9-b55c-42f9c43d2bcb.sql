
-- Create table for admin-granted unlimited CV access
CREATE TABLE public.unlimited_access_grants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  granted_by UUID NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.unlimited_access_grants ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage grants
CREATE POLICY "Super admins can manage unlimited grants"
  ON public.unlimited_access_grants FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Index for quick email lookups
CREATE INDEX idx_unlimited_grants_email ON public.unlimited_access_grants (user_email, is_active);
