-- =====================================================
-- FIX: Restrict participants and password_reset_tokens access
-- This ensures only service_role and authorized organizers can access data
-- =====================================================

-- PARTICIPANTS TABLE FIXES
-- ========================
-- Drop existing overly-permissive policies that allow any authenticated user to access
DROP POLICY IF EXISTS "Service role can view participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can create participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can update participants" ON public.participants;

-- Create policies explicitly restricted to service_role only
CREATE POLICY "Service role can view participants" 
ON public.participants FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role can create participants" 
ON public.participants FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update participants" 
ON public.participants FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- PASSWORD_RESET_TOKENS TABLE FIXES
-- =================================
-- Drop existing overly-permissive policy
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- Create policy explicitly restricted to service_role only
CREATE POLICY "Service role can manage password reset tokens" 
ON public.password_reset_tokens FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly revoke any default grants from anon and public roles
REVOKE ALL ON public.participants FROM anon;
REVOKE ALL ON public.participants FROM public;
REVOKE ALL ON public.password_reset_tokens FROM anon;
REVOKE ALL ON public.password_reset_tokens FROM public;