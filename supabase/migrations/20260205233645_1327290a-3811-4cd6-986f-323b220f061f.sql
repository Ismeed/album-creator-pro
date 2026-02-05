-- Create password reset tokens table for secure, single-use reset tokens
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX idx_password_reset_tokens_token_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_organizer_id ON public.password_reset_tokens(organizer_id);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can manage tokens (edge functions use service role)
CREATE POLICY "Service role can manage password reset tokens"
ON public.password_reset_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Function to generate a secure reset token
CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Function to hash the token for secure storage
CREATE OR REPLACE FUNCTION public.hash_token(token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN encode(sha256(token::bytea), 'hex');
END;
$$;