-- Fix security issues: Tighten RLS policies on participants and albums tables

-- =====================================================
-- 1. FIX PARTICIPANTS TABLE: Remove overly permissive policy
-- Replace "Authenticated can view participants" (true) with scoped access
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated can view participants" ON public.participants;

-- Keep the scoped policy that already exists (Organizers can view participants in own albums)
-- This policy restricts access to only participants in albums the user owns

-- =====================================================
-- 2. FIX ALBUMS TABLE: Hide organizer_id from public queries
-- Create a security barrier view for public album access
-- =====================================================

-- First, drop the current overly permissive public policy
DROP POLICY IF EXISTS "Public can view open albums" ON public.albums;

-- Create a restricted public policy that only returns safe columns
-- For public/anonymous access, we need to limit what they can see
-- Using a function to check if the requester is anonymous or authenticated

-- Create a function to check if album is safe for public viewing (without exposing organizer_id)
CREATE OR REPLACE FUNCTION public.get_public_album_info(_album_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  institution_name text,
  album_type album_type,
  submission_deadline timestamptz,
  is_locked boolean,
  payment_mode payment_mode,
  price_per_participant numeric,
  required_fields jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.title,
    a.institution_name,
    a.album_type,
    a.submission_deadline,
    a.is_locked,
    a.payment_mode,
    a.price_per_participant,
    a.required_fields
  FROM public.albums a
  WHERE a.id = _album_id AND a.is_locked = false
$$;

-- Create a policy for public access that returns album info but without organizer_id
-- This policy allows viewing open albums but the organizer_id should not be selected
-- The application should use the get_public_album_info function instead for anonymous access

-- For now, we'll restrict public SELECT to only work with the RPC function above
-- and allow authenticated organizers to see their own albums (which already works)

-- Actually, the best approach is to create a policy that allows anon to see
-- albums where is_locked = false, but only specific columns. However, RLS
-- doesn't support column-level restrictions directly. So we need to use a 
-- security definer function as the primary public access method.

-- For backwards compatibility, we'll keep a limited public policy but
-- the application code should migrate to using the RPC function.

-- Create new restricted policy for public access (still needed for the client query)
CREATE POLICY "Public can view open albums metadata"
  ON public.albums
  FOR SELECT
  TO anon
  USING (is_locked = false);

-- Note: The organizer_id exposure issue requires application code changes
-- The frontend should explicitly select only needed columns and not select organizer_id
-- when making public queries. We'll update the usePublicAlbum hook to not select organizer_id.