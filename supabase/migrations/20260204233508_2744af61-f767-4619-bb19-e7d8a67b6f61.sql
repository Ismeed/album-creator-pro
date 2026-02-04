-- Fix: Ensure organizers table blocks all anonymous access
-- The existing policy "Organizers can view own profile" uses id = auth.uid()
-- which already blocks anon users, but we need to verify RLS is enabled

-- Verify RLS is enabled on organizers (this is idempotent)
ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled on payments (this is idempotent)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Revoke any direct table grants that might bypass RLS
REVOKE ALL ON public.organizers FROM anon;
REVOKE ALL ON public.organizers FROM authenticated;

-- Grant only SELECT to authenticated users (RLS will further restrict)
GRANT SELECT ON public.organizers TO authenticated;

-- For payments table
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.payments FROM authenticated;

-- Grant necessary permissions to authenticated (RLS policies control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;