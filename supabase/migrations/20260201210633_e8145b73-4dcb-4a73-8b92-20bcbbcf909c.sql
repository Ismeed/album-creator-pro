-- Create storage bucket for participant photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can upload photos to their submission folder
CREATE POLICY "Anyone can upload photos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- Policy: Photos are publicly readable (for organizers and album viewing)
CREATE POLICY "Photos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'photos');

-- Policy: Organizers can delete photos from their albums
CREATE POLICY "Organizers can delete album photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'photos' AND
  EXISTS (
    SELECT 1 FROM public.albums a
    WHERE a.organizer_id = auth.uid()
    AND (storage.foldername(name))[1] = a.id::text
  )
);