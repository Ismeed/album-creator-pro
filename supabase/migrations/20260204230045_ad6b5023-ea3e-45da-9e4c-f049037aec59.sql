-- Add email column to participants table (required for confirmation emails)
ALTER TABLE public.participants 
ADD COLUMN email text;

-- Add edit token and is_edited columns to submissions table
ALTER TABLE public.submissions 
ADD COLUMN edit_token text UNIQUE,
ADD COLUMN is_edited boolean NOT NULL DEFAULT false;

-- Add is_generated column to albums table (to track if album has been generated)
ALTER TABLE public.albums 
ADD COLUMN is_generated boolean NOT NULL DEFAULT false;

-- Create function to generate secure edit token
CREATE OR REPLACE FUNCTION generate_edit_token()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Create function to check if submission is editable
CREATE OR REPLACE FUNCTION public.is_submission_editable(_submission_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.submissions s
    JOIN public.albums a ON s.album_id = a.id
    WHERE s.id = _submission_id 
      AND a.is_locked = false
      AND a.is_generated = false
      AND (a.submission_deadline IS NULL OR a.submission_deadline > now())
  )
$$;

-- Create index on edit_token for fast lookups
CREATE INDEX idx_submissions_edit_token ON public.submissions (edit_token) WHERE edit_token IS NOT NULL;