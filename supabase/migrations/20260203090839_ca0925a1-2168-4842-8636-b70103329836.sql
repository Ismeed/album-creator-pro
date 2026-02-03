-- Fix 1: Drop the public SELECT policy on albums table that exposes organizer_id
-- Anonymous users should use the get_public_album_info RPC function instead
DROP POLICY IF EXISTS "Public can view open albums metadata" ON public.albums;

-- Fix 2: Remove the dangerous public UPDATE policy on participants
-- This policy allowed anyone to modify any participant's data within 1 hour
-- Participants are created via the submit-participant edge function and should not be updated
DROP POLICY IF EXISTS "Public can update recently created participants" ON public.participants;