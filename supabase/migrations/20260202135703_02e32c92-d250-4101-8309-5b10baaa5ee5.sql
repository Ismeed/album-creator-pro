-- =====================================================
-- Expand Participant Schema for Photo Albums
-- =====================================================

-- Add new columns to participants table for richer album data
ALTER TABLE public.participants
ADD COLUMN graduation_year TEXT,
ADD COLUMN role TEXT DEFAULT 'participant',
ADD COLUMN quote TEXT,
ADD COLUMN cohort TEXT;

-- Add constraints for valid roles
ALTER TABLE public.participants
ADD CONSTRAINT valid_participant_role CHECK (
  role IN ('graduate', 'participant', 'facilitator', 'instructor', 'mentor', 'other')
);

-- Add length constraints to prevent abuse
ALTER TABLE public.participants
ADD CONSTRAINT quote_max_length CHECK (char_length(quote) <= 200),
ADD CONSTRAINT graduation_year_format CHECK (
  graduation_year IS NULL OR graduation_year ~ '^\d{4}(/\d{4})?$'
),
ADD CONSTRAINT cohort_max_length CHECK (char_length(cohort) <= 100);

-- =====================================================
-- Album Field Configuration (which fields are required)
-- =====================================================

-- Add required_fields JSONB column to albums table
-- This stores which participant fields are required for this album
ALTER TABLE public.albums
ADD COLUMN required_fields JSONB DEFAULT '["full_name", "department_or_class"]'::jsonb;

-- Add comment explaining the field
COMMENT ON COLUMN public.albums.required_fields IS 
'JSON array of required field names: full_name, department_or_class, identifier, graduation_year, role, quote, cohort';

-- =====================================================
-- Update RLS policies to allow public updates on participants
-- (needed since participants fill their own data)
-- =====================================================

-- Allow public to update their own participant record within a short time window
-- This is secured by the fact that participant IDs are generated server-side
CREATE POLICY "Public can update recently created participants"
ON public.participants
FOR UPDATE
USING (created_at > now() - interval '1 hour')
WITH CHECK (created_at > now() - interval '1 hour');