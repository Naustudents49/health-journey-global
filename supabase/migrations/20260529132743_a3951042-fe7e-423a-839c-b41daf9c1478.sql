ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'approved'
    CHECK (status IN ('pending','approved','rejected')),
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz,
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_notes text;

UPDATE public.reviews SET status = 'approved' WHERE status IS NULL;

ALTER TABLE public.reviews
  ALTER COLUMN status SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS idx_reviews_status_doctor
  ON public.reviews (doctor_id, status, created_at DESC);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_public_read_approved ON public.reviews;
CREATE POLICY reviews_public_read_approved
  ON public.reviews FOR SELECT
  USING (status = 'approved' OR has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS reviews_admin_update ON public.reviews;
CREATE POLICY reviews_admin_update
  ON public.reviews FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS reviews_owner_read ON public.reviews;
CREATE POLICY reviews_owner_read
  ON public.reviews FOR SELECT
  USING (
    patient_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR doctor_id IN (
      SELECT dd.id FROM public.doctor_details dd
      JOIN public.profiles p ON p.id = dd.profile_id
      WHERE p.user_id = auth.uid()
    )
  );