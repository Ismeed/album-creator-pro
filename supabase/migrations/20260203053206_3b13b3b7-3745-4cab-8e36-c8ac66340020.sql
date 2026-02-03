-- Add database-level constraints to participants table for defense-in-depth
-- These match the validation logic in submit-participant edge function

-- Full name: must be 2-100 characters
ALTER TABLE public.participants
  ADD CONSTRAINT full_name_length CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);

-- Identifier: must be ≤50 characters if provided
ALTER TABLE public.participants
  ADD CONSTRAINT identifier_length CHECK (identifier IS NULL OR char_length(identifier) <= 50);

-- Department/class: must be ≤100 characters if provided
ALTER TABLE public.participants
  ADD CONSTRAINT department_length CHECK (department_or_class IS NULL OR char_length(department_or_class) <= 100);