-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Recreate the function to use the extension properly
CREATE OR REPLACE FUNCTION public.generate_password_reset_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$function$;

-- Also fix the hash_token function to use proper schema
CREATE OR REPLACE FUNCTION public.hash_token(token text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(extensions.digest(token::bytea, 'sha256'), 'hex');
END;
$function$;

-- Also fix generate_edit_token and generate_verification_token
CREATE OR REPLACE FUNCTION public.generate_edit_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_verification_token()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN encode(extensions.gen_random_bytes(32), 'hex');
END;
$function$;