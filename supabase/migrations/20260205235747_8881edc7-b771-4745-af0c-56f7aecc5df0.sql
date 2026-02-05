-- Fix the password_reset_tokens policy to restrict to service_role only
-- The current policy incorrectly uses 'public' role which allows anyone access

DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- Create properly restricted policy for service role only
CREATE POLICY "Service role can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);