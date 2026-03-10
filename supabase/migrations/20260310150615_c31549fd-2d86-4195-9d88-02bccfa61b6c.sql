-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Organizers can update own profile" ON public.organizers;

-- Recreate with WITH CHECK that prevents self-verification bypass
CREATE POLICY "Organizers can update own profile"
ON public.organizers
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND is_verified IS NOT DISTINCT FROM (SELECT o.is_verified FROM public.organizers o WHERE o.id = auth.uid())
  AND verified_at IS NOT DISTINCT FROM (SELECT o.verified_at FROM public.organizers o WHERE o.id = auth.uid())
  AND verification_token IS NOT DISTINCT FROM (SELECT o.verification_token FROM public.organizers o WHERE o.id = auth.uid())
);