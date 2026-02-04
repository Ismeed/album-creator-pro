-- Ensure organizers table has no anonymous access
-- Revoke all grants from anon role
REVOKE ALL ON public.organizers FROM anon;

-- Ensure participants table has no anonymous access  
REVOKE ALL ON public.participants FROM anon;

-- Grant only to authenticated (RLS controls access)
GRANT SELECT ON public.participants TO authenticated;

-- Drop and recreate participants SELECT policy to be PERMISSIVE and scoped to authenticated only
DROP POLICY IF EXISTS "Organizers can view participants in own albums" ON public.participants;

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

-- Add explicit policy to ensure service_role can still access for edge functions
DROP POLICY IF EXISTS "Service role can view participants" ON public.participants;

CREATE POLICY "Service role can view participants"
ON public.participants FOR SELECT
TO service_role
USING (true);