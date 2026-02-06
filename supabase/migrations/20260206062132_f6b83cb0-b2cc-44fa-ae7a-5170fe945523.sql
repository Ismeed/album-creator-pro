-- =====================================================
-- FIX 1: handle_new_user trigger uses gen_random_bytes without schema prefix
-- CAUSE: gen_random_bytes is in the extensions schema, not public
-- FIX: Replace with extensions.gen_random_bytes
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  -- Generate verification token using properly qualified function
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  
  -- Insert organizer with verification token
  INSERT INTO public.organizers (id, email, full_name, is_verified, verification_token)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    false,
    v_token
  );
  
  RETURN NEW;
END;
$function$;

-- =====================================================
-- FIX 2: valid_participant_role constraint is too restrictive
-- CAUSE: Custom roles like "Coordinator" from dynamic forms are rejected
-- FIX: Drop constraint - role is now freeform text from organizer-defined schemas
-- =====================================================

ALTER TABLE public.participants DROP CONSTRAINT IF EXISTS valid_participant_role;

-- =====================================================
-- Add note explaining that role is now schema-driven and validated client-side
-- No server constraint needed since organizers define custom roles
-- =====================================================