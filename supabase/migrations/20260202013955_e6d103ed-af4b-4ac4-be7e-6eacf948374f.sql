-- =============================================================
-- SECURITY FIX: Address Public Data Exposure and Upload Abuse
-- =============================================================

-- 1. Remove overly permissive SELECT policies on participants
DROP POLICY IF EXISTS "Public can view participants" ON public.participants;

-- 2. Remove overly permissive SELECT policies on submissions  
DROP POLICY IF EXISTS "Public can view submissions" ON public.submissions;

-- 3. Add proper SELECT policies for participants (only organizers of related albums can view)
CREATE POLICY "Organizers can view participants in own albums"
ON public.participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.albums a ON s.album_id = a.id
    WHERE s.participant_id = participants.id
    AND a.organizer_id = auth.uid()
  )
);

-- 4. Make photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'photos';

-- 5. Remove public read access policy for photos
DROP POLICY IF EXISTS "Photos are publicly accessible" ON storage.objects;

-- 6. Add policy for organizers to view their own album photos
CREATE POLICY "Organizers can view own album photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.organizer_id = auth.uid()
    AND (storage.foldername(name))[1] = a.id::text
  )
);

-- 7. Remove unrestricted upload policy
DROP POLICY IF EXISTS "Anyone can upload photos" ON storage.objects;

-- 8. Add restricted upload policy - only to valid, open albums
CREATE POLICY "Upload to valid open albums only"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  -- Extract album_id from first folder in path and validate
  (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.albums 
    WHERE is_locked = false
    AND (submission_deadline IS NULL OR submission_deadline > now())
  )
);

-- 9. Add policy for service role to manage processed photos (for edge functions)
CREATE POLICY "Service role can manage photos"
ON storage.objects FOR ALL
USING (bucket_id = 'photos' AND auth.role() = 'service_role')
WITH CHECK (bucket_id = 'photos' AND auth.role() = 'service_role');