-- Create user_submissions table to store user contact details with their CV requests
CREATE TABLE public.user_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  person_spec TEXT,
  linkedin_url TEXT,
  cv_filename TEXT,
  output_type TEXT NOT NULL DEFAULT 'both',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_submissions ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view all submissions (for download/export)
CREATE POLICY "Super admins can view all submissions"
ON public.user_submissions FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Only super_admin can delete submissions
CREATE POLICY "Super admins can delete submissions"
ON public.user_submissions FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Allow anyone to insert (public form submission)
CREATE POLICY "Anyone can submit"
ON public.user_submissions FOR INSERT
WITH CHECK (true);