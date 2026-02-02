-- Drop the incorrectly configured restrictive public policy
DROP POLICY IF EXISTS "Public can view albums for submission" ON public.albums;

-- Recreate as PERMISSIVE policy (allows public read access if album is not locked)
CREATE POLICY "Public can view open albums"
ON public.albums
FOR SELECT
USING (is_locked = false);

-- Note: The existing organizer policies are restrictive, but this permissive policy 
-- will allow public access when is_locked = false using OR logic with other permissive policies