-- Allow admins (not just super_admins) to view submissions
CREATE POLICY "Admins can view all submissions"
ON public.user_submissions
FOR SELECT
USING (is_admin(auth.uid()));

-- Update the existing super_admin only policies if they conflict
-- First drop the old restrictive policy and replace with the is_admin version
DROP POLICY IF EXISTS "Super admins can view all submissions" ON public.user_submissions;