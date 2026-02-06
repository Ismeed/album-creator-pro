-- =====================================================
-- FIX: Restrict participants and password_reset_tokens access
-- Add explicit TO service_role clause to prevent public access
-- =====================================================

-- PARTICIPANTS TABLE FIXES
-- ========================
-- Drop existing policies that are missing the TO service_role clause
DROP POLICY IF EXISTS "Service role can view participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can create participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can update participants" ON public.participants;

-- Recreate policies explicitly restricted to service_role only
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

-- Explicitly revoke any default grants from anon and public roles
REVOKE ALL ON public.participants FROM anon;
REVOKE ALL ON public.participants FROM public;

-- PASSWORD_RESET_TOKENS TABLE FIXES
-- =================================
-- Drop existing policy that is missing the TO service_role clause
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- Recreate policy explicitly restricted to service_role only
CREATE POLICY "Service role can manage password reset tokens" 
ON public.password_reset_tokens FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly revoke any default grants from anon and public roles
REVOKE ALL ON public.password_reset_tokens FROM anon;
REVOKE ALL ON public.password_reset_tokens FROM public;