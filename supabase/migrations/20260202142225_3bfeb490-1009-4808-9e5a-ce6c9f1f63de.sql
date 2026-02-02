-- First, drop all existing INSERT policies on participants to start fresh
DROP POLICY IF EXISTS "Public can create participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can create participants" ON public.participants;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.participants;

-- Create a simple, permissive INSERT policy that works for all roles
-- Using 'public' role which includes both anon and authenticated
CREATE POLICY "Allow participant creation"
ON public.participants
FOR INSERT
TO public
WITH CHECK (true);

-- Ensure proper grants exist
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT INSERT, SELECT ON public.participants TO anon;
GRANT INSERT, SELECT ON public.participants TO authenticated;
GRANT SELECT ON public.albums TO anon;
GRANT SELECT ON public.albums TO authenticated;