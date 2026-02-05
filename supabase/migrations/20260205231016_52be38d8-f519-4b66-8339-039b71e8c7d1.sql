-- Add email verification fields to organizers table
ALTER TABLE public.organizers
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_token text,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create index for verification token lookup
CREATE INDEX IF NOT EXISTS idx_organizers_verification_token ON public.organizers(verification_token) WHERE verification_token IS NOT NULL;

-- Add updated_at column to submissions for tracking edit timestamps
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger to update updated_at on submissions
CREATE OR REPLACE FUNCTION public.update_submission_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_submission_updated_at();

-- Function to generate verification token
CREATE OR REPLACE FUNCTION public.generate_verification_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;