-- Allow service_role to update participants (for edit submission functionality)
CREATE POLICY "Service role can update participants" 
ON public.participants 
FOR UPDATE 
USING (true)
WITH CHECK (true);