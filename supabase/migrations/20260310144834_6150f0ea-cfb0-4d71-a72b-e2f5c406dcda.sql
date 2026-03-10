
-- Drop the overly permissive INSERT policy on payments
DROP POLICY IF EXISTS "Authenticated can create payments for valid albums" ON public.payments;

-- Create a stricter policy: only album owners can insert payments
CREATE POLICY "Organizers can create payments for own albums"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (is_album_owner(album_id));
