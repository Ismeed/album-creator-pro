-- =====================================================
-- OLEX MVP Data Models
-- =====================================================

-- 1. Create enum types
CREATE TYPE public.album_type AS ENUM ('class', 'department', 'faculty', 'training', 'bootcamp', 'other');
CREATE TYPE public.payment_mode AS ENUM ('organizer_pays', 'participant_pays');
CREATE TYPE public.payment_status AS ENUM ('pending', 'successful', 'failed');
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- =====================================================
-- 2. ORGANIZERS (Profiles table linked to auth.users)
-- =====================================================
CREATE TABLE public.organizers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.organizers ENABLE ROW LEVEL SECURITY;

-- Organizers can only view/manage their own profile
CREATE POLICY "Organizers can view own profile"
  ON public.organizers FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Organizers can update own profile"
  ON public.organizers FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Organizers can insert own profile"
  ON public.organizers FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 3. ALBUMS
-- =====================================================
CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.organizers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  institution_name TEXT,
  album_type public.album_type NOT NULL DEFAULT 'other',
  payment_mode public.payment_mode NOT NULL DEFAULT 'organizer_pays',
  price_per_participant DECIMAL(10, 2),
  submission_deadline TIMESTAMPTZ,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Helper function to check album ownership
CREATE OR REPLACE FUNCTION public.is_album_owner(_album_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.albums
    WHERE id = _album_id AND organizer_id = auth.uid()
  )
$$;

-- Organizers can CRUD their own albums
CREATE POLICY "Organizers can view own albums"
  ON public.albums FOR SELECT
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can create albums"
  ON public.albums FOR INSERT
  TO authenticated
  WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Organizers can update own albums"
  ON public.albums FOR UPDATE
  TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Organizers can delete own albums"
  ON public.albums FOR DELETE
  TO authenticated
  USING (organizer_id = auth.uid());

-- Public can view album info for submission pages (using anon key)
CREATE POLICY "Public can view albums for submission"
  ON public.albums FOR SELECT
  TO anon
  USING (is_locked = false);

-- =====================================================
-- 4. PARTICIPANTS
-- =====================================================
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  identifier TEXT, -- matric number / employee ID
  department_or_class TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Public can insert participants (during submission)
CREATE POLICY "Public can create participants"
  ON public.participants FOR INSERT
  TO anon
  WITH CHECK (true);

-- Organizers can view participants (via submissions)
CREATE POLICY "Authenticated can view participants"
  ON public.participants FOR SELECT
  TO authenticated
  USING (true);

-- Public can view participants for confirmation
CREATE POLICY "Public can view participants"
  ON public.participants FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- 5. SUBMISSIONS
-- =====================================================
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  processed_photo_url TEXT,
  background_color TEXT,
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  approval_status public.approval_status NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Enforce one submission per participant per album
  UNIQUE (album_id, participant_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Helper function to check submission ownership via album
CREATE OR REPLACE FUNCTION public.is_submission_owner(_submission_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.submissions s
    JOIN public.albums a ON s.album_id = a.id
    WHERE s.id = _submission_id AND a.organizer_id = auth.uid()
  )
$$;

-- Helper to get album_id from submission
CREATE OR REPLACE FUNCTION public.get_album_id_from_submission(_submission_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT album_id FROM public.submissions WHERE id = _submission_id
$$;

-- Public can create submissions
CREATE POLICY "Public can create submissions"
  ON public.submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Organizers can view submissions for their albums
CREATE POLICY "Organizers can view own album submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (public.is_album_owner(album_id));

-- Organizers can update submissions for their albums
CREATE POLICY "Organizers can update own album submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (public.is_album_owner(album_id));

-- Organizers can delete submissions for their albums
CREATE POLICY "Organizers can delete own album submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (public.is_album_owner(album_id));

-- Public can view their own submission (by participant_id for confirmation)
CREATE POLICY "Public can view submissions"
  ON public.submissions FOR SELECT
  TO anon
  USING (true);

-- =====================================================
-- 6. PAYMENTS
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_reference TEXT,
  payment_channel TEXT,
  status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper function to check payment ownership via album
CREATE OR REPLACE FUNCTION public.is_payment_owner(_payment_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.payments p
    JOIN public.albums a ON p.album_id = a.id
    WHERE p.id = _payment_id AND a.organizer_id = auth.uid()
  )
$$;

-- Public can create payments (during submission for participant_pays)
CREATE POLICY "Public can create payments"
  ON public.payments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Organizers can view payments for their albums
CREATE POLICY "Organizers can view own album payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (public.is_album_owner(album_id));

-- Organizers can update payments for their albums
CREATE POLICY "Organizers can update own album payments"
  ON public.payments FOR UPDATE
  TO authenticated
  USING (public.is_album_owner(album_id));

-- Organizers can delete payments for their albums
CREATE POLICY "Organizers can delete own album payments"
  ON public.payments FOR DELETE
  TO authenticated
  USING (public.is_album_owner(album_id));

-- =====================================================
-- 7. VALIDATION TRIGGER: Prevent submissions after deadline
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_submission_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  album_deadline TIMESTAMPTZ;
  album_locked BOOLEAN;
BEGIN
  SELECT submission_deadline, is_locked 
  INTO album_deadline, album_locked
  FROM public.albums 
  WHERE id = NEW.album_id;
  
  -- Check if album is locked
  IF album_locked THEN
    RAISE EXCEPTION 'This album is locked and no longer accepting submissions';
  END IF;
  
  -- Check if deadline has passed
  IF album_deadline IS NOT NULL AND album_deadline < now() THEN
    RAISE EXCEPTION 'The submission deadline for this album has passed';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_submission_deadline
  BEFORE INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_submission_deadline();

-- =====================================================
-- 8. AUTO-CREATE ORGANIZER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.organizers (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_albums_organizer_id ON public.albums(organizer_id);
CREATE INDEX idx_submissions_album_id ON public.submissions(album_id);
CREATE INDEX idx_submissions_participant_id ON public.submissions(participant_id);
CREATE INDEX idx_payments_album_id ON public.payments(album_id);
CREATE INDEX idx_payments_submission_id ON public.payments(submission_id);