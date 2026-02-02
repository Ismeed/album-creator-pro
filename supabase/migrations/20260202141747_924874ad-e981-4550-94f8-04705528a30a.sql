-- Fix submissions INSERT policy to allow both anon and authenticated users
DROP POLICY IF EXISTS "Public can create submissions to open albums" ON public.submissions;

CREATE POLICY "Public can create submissions to open albums"
ON public.submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (is_album_open_for_submission(album_id));

-- Grant necessary permissions to anon role for participant submission flow
GRANT INSERT ON public.participants TO anon;
GRANT SELECT ON public.participants TO anon;
GRANT INSERT ON public.submissions TO anon;
GRANT SELECT ON public.albums TO anon;

-- Also grant to authenticated for when organizers test their own albums
GRANT INSERT ON public.participants TO authenticated;
GRANT INSERT ON public.submissions TO authenticated;