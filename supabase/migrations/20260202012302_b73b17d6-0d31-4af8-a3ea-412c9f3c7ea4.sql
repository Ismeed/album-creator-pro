-- Create album_generations table to track PDF generation status
CREATE TABLE public.album_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  template_id TEXT NOT NULL DEFAULT 'classic',
  file_path TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  participant_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(album_id, status) -- Prevent multiple active generations
);

-- Enable RLS
ALTER TABLE public.album_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only album owners can manage generations
CREATE POLICY "Organizers can view own album generations"
ON public.album_generations
FOR SELECT
USING (is_album_owner(album_id));

CREATE POLICY "Organizers can create generations for own albums"
ON public.album_generations
FOR INSERT
WITH CHECK (is_album_owner(album_id));

CREATE POLICY "Organizers can update own album generations"
ON public.album_generations
FOR UPDATE
USING (is_album_owner(album_id));

CREATE POLICY "Organizers can delete own album generations"
ON public.album_generations
FOR DELETE
USING (is_album_owner(album_id));

-- Create storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('album-pdfs', 'album-pdfs', false);

-- Storage policies: Only album owners can access their PDFs
CREATE POLICY "Organizers can view own album PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'album-pdfs' 
  AND (storage.foldername(name))[1]::uuid IN (
    SELECT id FROM public.albums WHERE organizer_id = auth.uid()
  )
);

CREATE POLICY "Service role can upload album PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'album-pdfs');

CREATE POLICY "Service role can update album PDFs"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'album-pdfs');

CREATE POLICY "Service role can delete album PDFs"
ON storage.objects
FOR DELETE
USING (bucket_id = 'album-pdfs');

-- Create index for faster lookups
CREATE INDEX idx_album_generations_album_id ON public.album_generations(album_id);
CREATE INDEX idx_album_generations_status ON public.album_generations(status);