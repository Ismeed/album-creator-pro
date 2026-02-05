-- Drop and recreate get_public_album_info with new columns
DROP FUNCTION IF EXISTS public.get_public_album_info(uuid);

CREATE FUNCTION public.get_public_album_info(_album_id uuid)
RETURNS TABLE(
  id uuid, 
  title text, 
  institution_name text, 
  album_type album_type, 
  submission_deadline timestamp with time zone, 
  is_locked boolean, 
  payment_mode payment_mode, 
  price_per_participant numeric, 
  required_fields jsonb,
  template_id text,
  custom_fields jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    a.id,
    a.title,
    a.institution_name,
    a.album_type,
    a.submission_deadline,
    a.is_locked,
    a.payment_mode,
    a.price_per_participant,
    a.required_fields,
    a.template_id,
    a.custom_fields
  FROM public.albums a
  WHERE a.id = _album_id AND a.is_locked = false
$function$;