-- Add missing columns to user_submissions table
ALTER TABLE public.user_submissions
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS target_role TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS service_type TEXT DEFAULT 'CV Revamp',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New',
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS cv_text TEXT;

-- Add UPDATE policy for super_admin to update submissions
CREATE POLICY "Super admins can update submissions"
ON public.user_submissions
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));