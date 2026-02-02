-- Drop the existing INSERT policy that may be restrictive
DROP POLICY IF EXISTS "Public can create participants" ON public.participants;

-- Create a new PERMISSIVE INSERT policy for anonymous users
-- Note: participants don't have album_id directly - they're linked via submissions
-- The submission INSERT policy validates the album, so we allow participant creation freely
CREATE POLICY "Public can create participants"
ON public.participants
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Also ensure the policy works for public/anon role
GRANT INSERT ON public.participants TO anon;