-- Revoke all privileges from anon role on sensitive tables
REVOKE ALL ON public.participants FROM anon;
REVOKE ALL ON public.password_reset_tokens FROM anon;

-- Also revoke from public role to be safe
REVOKE ALL ON public.participants FROM public;
REVOKE ALL ON public.password_reset_tokens FROM public;

-- Ensure authenticated users only have access through proper RLS policies
-- For participants: organizers can only view via album ownership check
-- For password_reset_tokens: only service_role should access

-- Drop any existing overly permissive policies and recreate properly
DROP POLICY IF EXISTS "Service role can view participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can create participants" ON public.participants;
DROP POLICY IF EXISTS "Service role can update participants" ON public.participants;

-- Recreate service role policies with explicit role targeting
CREATE POLICY "Service role can view participants" 
ON public.participants 
FOR SELECT 
TO service_role
USING (true);

CREATE POLICY "Service role can create participants" 
ON public.participants 
FOR INSERT 
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update participants" 
ON public.participants 
FOR UPDATE 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure the organizer view policy is properly scoped to authenticated only
DROP POLICY IF EXISTS "Organizers can view participants in own albums" ON public.participants;

CREATE POLICY "Organizers can view participants in own albums" 
ON public.participants 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.submissions s
    JOIN public.albums a ON s.album_id = a.id
    WHERE s.participant_id = participants.id 
    AND a.organizer_id = auth.uid()
  )
);