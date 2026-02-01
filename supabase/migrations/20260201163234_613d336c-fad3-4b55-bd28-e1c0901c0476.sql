-- =====================================================
-- TIGHTEN RLS POLICIES FOR PUBLIC INSERT
-- These policies validate that the referenced album exists and is open
-- =====================================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Public can create participants" ON public.participants;
DROP POLICY IF EXISTS "Public can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Public can create payments" ON public.payments;

-- 1. PARTICIPANTS: Anyone can create (needed for unauthenticated submission flow)
-- This is acceptable as participants are just profile data
CREATE POLICY "Public can create participants"
  ON public.participants FOR INSERT
  TO anon
  WITH CHECK (true);

-- 2. SUBMISSIONS: Validate album exists and is open before allowing insert
CREATE OR REPLACE FUNCTION public.is_album_open_for_submission(_album_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.albums
    WHERE id = _album_id 
      AND is_locked = false
      AND (submission_deadline IS NULL OR submission_deadline > now())
  )
$$;

CREATE POLICY "Public can create submissions to open albums"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (public.is_album_open_for_submission(album_id));

-- 3. PAYMENTS: Validate album exists before allowing insert
CREATE OR REPLACE FUNCTION public.is_valid_album(_album_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.albums WHERE id = _album_id
  )
$$;

CREATE POLICY "Public can create payments for valid albums"
  ON public.payments FOR INSERT
  TO anon
  WITH CHECK (public.is_valid_album(album_id));