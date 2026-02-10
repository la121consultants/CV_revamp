
-- Allow authenticated users to check their own grants (by email match)
CREATE POLICY "Users can check own unlimited grants"
  ON public.unlimited_access_grants FOR SELECT
  USING (user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
