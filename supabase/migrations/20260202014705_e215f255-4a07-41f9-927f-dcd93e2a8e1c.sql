-- =============================================================
-- SECURITY FIX: Add input validation constraints to participants table
-- =============================================================

-- Add CHECK constraints to enforce length limits at database level
-- This prevents bypass of client-side validation via direct API calls

ALTER TABLE public.participants 
  ADD CONSTRAINT check_full_name_length 
    CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100);

ALTER TABLE public.participants 
  ADD CONSTRAINT check_dept_length 
    CHECK (department_or_class IS NULL OR 
           (char_length(department_or_class) >= 1 AND char_length(department_or_class) <= 100));

ALTER TABLE public.participants 
  ADD CONSTRAINT check_identifier_length 
    CHECK (identifier IS NULL OR char_length(identifier) <= 50);