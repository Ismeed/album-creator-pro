-- Drop the overly permissive participant insert policy that allows database flooding
DROP POLICY IF EXISTS "Unrestricted participant insert" ON public.participants;

-- Create a restrictive policy that only allows service_role to insert participants
-- This ensures all participant creation goes through the validated submit-participant edge function
CREATE POLICY "Service role can create participants"
ON public.participants
FOR INSERT
TO service_role
WITH CHECK (true);