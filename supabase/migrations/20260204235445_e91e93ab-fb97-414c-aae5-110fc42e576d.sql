-- Fix all error-level security issues by converting policies to PERMISSIVE 
-- and explicitly targeting only authenticated role

-- ============================================
-- 1. FIX ORGANIZERS TABLE
-- ============================================
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Organizers can view own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can insert own profile" ON public.organizers;

-- Create PERMISSIVE policies for authenticated only
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

-- Revoke all access from anon role
REVOKE ALL ON public.organizers FROM anon;

-- ============================================
-- 2. FIX PARTICIPANTS TABLE  
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can view participants in own albums" ON public.participants;
DROP POLICY IF EXISTS "Service role can view participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can create participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can update participants" ON public.participants;

-- Create PERMISSIVE policies for authenticated organizers only
CREATE POLICY "Organizers can view participants in own albums"
ON public.participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM submissions s
    JOIN albums a ON s.album_id = a.id
    WHERE s.participant_id = participants.id 
    AND a.organizer_id = auth.uid()
  )
);

-- Service role policies (for edge functions) - PERMISSIVE
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

-- Revoke all access from anon role
REVOKE ALL ON public.participants FROM anon;

-- ============================================
-- 3. FIX PAYMENTS TABLE
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Organizers can view own album payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can update own album payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can delete own album payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated can create payments for valid albums" ON public.payments;

-- Create PERMISSIVE policies for authenticated only
CREATE POLICY "Organizers can view own album payments"
ON public.payments FOR SELECT
TO authenticated
USING (is_album_owner(album_id));

CREATE POLICY "Organizers can update own album payments"
ON public.payments FOR UPDATE
TO authenticated
USING (is_album_owner(album_id));

CREATE POLICY "Organizers can delete own album payments"
ON public.payments FOR DELETE
TO authenticated
USING (is_album_owner(album_id));

CREATE POLICY "Authenticated can create payments for valid albums"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (is_valid_album(album_id));

-- Service role policy for edge functions (payment webhooks)
CREATE POLICY "Service role can manage payments"
ON public.payments FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Revoke all access from anon role
REVOKE ALL ON public.payments FROM anon;