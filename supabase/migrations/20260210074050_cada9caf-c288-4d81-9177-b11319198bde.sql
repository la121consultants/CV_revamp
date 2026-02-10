
-- Create saved_cvs table to store generated CVs for logged-in users
CREATE TABLE public.saved_cvs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT,
  cv_content TEXT NOT NULL,
  cover_letter_content TEXT,
  output_type TEXT NOT NULL DEFAULT 'both',
  cv_style TEXT DEFAULT 'standard',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_cvs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved CVs
CREATE POLICY "Users can view own saved CVs"
  ON public.saved_cvs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved CVs
CREATE POLICY "Users can insert own saved CVs"
  ON public.saved_cvs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved CVs
CREATE POLICY "Users can delete own saved CVs"
  ON public.saved_cvs FOR DELETE
  USING (auth.uid() = user_id);
