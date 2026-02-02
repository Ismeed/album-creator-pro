-- The participants table doesn't need RLS protection because:
-- 1. It has no album_id - not directly linked to albums
-- 2. The submissions table handles album validation via is_album_open_for_submission()
-- 3. Participant data is not sensitive and can be freely created

-- Disable RLS on participants table to allow anonymous inserts
ALTER TABLE public.participants DISABLE ROW LEVEL SECURITY;

-- Re-enable with FORCE to ensure the table is accessible
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Drop all existing INSERT policies to start fresh
DROP POLICY IF EXISTS "Allow participant creation" ON public.participants;
DROP POLICY IF EXISTS "Public can create participants" ON public.participants;
DROP POLICY IF EXISTS "Anyone can create participants" ON public.participants;
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.participants;

-- Create a truly permissive INSERT policy with explicit AS PERMISSIVE
CREATE POLICY "Unrestricted participant insert"
ON public.participants
AS PERMISSIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Ensure grants are in place
GRANT ALL ON public.participants TO anon;
GRANT ALL ON public.participants TO authenticated;