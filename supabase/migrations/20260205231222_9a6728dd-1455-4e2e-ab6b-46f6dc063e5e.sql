-- Update handle_new_user function to generate verification token and trigger email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  -- Generate verification token
  v_token := encode(gen_random_bytes(32), 'hex');
  
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
$$;