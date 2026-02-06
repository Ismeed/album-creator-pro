-- =====================================================
-- FIX: Restrict participants and organizers table access
-- Ensures only service_role and authorized users can access data
-- =====================================================

-- PARTICIPANTS TABLE FIXES
-- ========================
-- Drop existing overly-permissive policies (missing TO service_role clause)
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

-- Explicitly revoke any default grants from anon and public roles on participants
REVOKE ALL ON public.participants FROM anon;
REVOKE ALL ON public.participants FROM public;

-- ORGANIZERS TABLE FIXES  
-- ======================
-- Drop existing policies to recreate with explicit role targeting
DROP POLICY IF EXISTS "Organizers can view own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can insert own profile" ON public.organizers;

-- Recreate policies explicitly restricted to authenticated role only
CREATE POLICY "Organizers can view own profile" 
ON public.organizers FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Organizers can update own profile" 
ON public.organizers FOR UPDATE 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Organizers can insert own profile" 
ON public.organizers FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Add service role policy for edge functions (password reset, verification)
CREATE POLICY "Service role can manage organizers" 
ON public.organizers FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly revoke any default grants from anon and public roles on organizers
REVOKE ALL ON public.organizers FROM anon;
REVOKE ALL ON public.organizers FROM public;