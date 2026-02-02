-- Fix: Grant table-level permissions to anon and authenticated roles
-- The RLS policy exists but the roles don't have basic table access

-- Grant INSERT permission to anon role (for anonymous participant submission)
GRANT INSERT ON public.participants TO anon;

-- Grant SELECT permission to anon role (needed for the .select().single() after insert)
GRANT SELECT ON public.participants TO anon;

-- Grant all necessary permissions to authenticated role
GRANT SELECT, INSERT, UPDATE ON public.participants TO authenticated;

-- Also ensure the sequence for id generation is accessible
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify submissions table also has proper grants for the full flow
GRANT INSERT ON public.submissions TO anon;
GRANT SELECT ON public.submissions TO anon;