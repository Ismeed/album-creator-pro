-- Fix organizers table: Convert to PERMISSIVE policies with proper restrictions
-- First, drop existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Organizers can view own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;
DROP POLICY IF EXISTS "Organizers can insert own profile" ON public.organizers;

-- Create PERMISSIVE policies that only allow authenticated users to access their own data
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

-- Fix payments table: Convert to PERMISSIVE policies with proper restrictions
DROP POLICY IF EXISTS "Organizers can view own album payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can update own album payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can delete own album payments" ON public.payments;
DROP POLICY IF EXISTS "Public can create payments for valid albums" ON public.payments;

-- Create PERMISSIVE policies for authenticated organizers only
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

-- Allow authenticated users to create payments for valid albums
CREATE POLICY "Authenticated can create payments for valid albums"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (is_valid_album(album_id));

-- Ensure no anonymous access via grants
REVOKE ALL ON public.organizers FROM anon;
REVOKE ALL ON public.payments FROM anon;

-- Grant only to authenticated (RLS controls access)
GRANT SELECT, UPDATE ON public.organizers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;