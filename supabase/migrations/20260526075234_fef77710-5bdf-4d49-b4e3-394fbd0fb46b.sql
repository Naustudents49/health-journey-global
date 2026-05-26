
-- Helper: check if a profile belongs to a verified doctor
CREATE OR REPLACE FUNCTION public.is_verified_doctor_profile(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctor_details
    WHERE profile_id = _profile_id AND is_verified = true
  );
$$;

-- ========== posts ==========
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('doctor','patient','pharmacist','admin')),
  post_type text NOT NULL CHECK (post_type IN ('awareness','question','missing_drug')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  specialty_id uuid REFERENCES public.specialties(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  media_urls text[] DEFAULT '{}',
  city text,
  country text,
  is_pinned boolean DEFAULT false,
  is_resolved boolean DEFAULT false,
  reactions_count int DEFAULT 0,
  replies_count int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_type ON public.posts(post_type);
CREATE INDEX idx_posts_author ON public.posts(author_profile_id);
CREATE INDEX idx_posts_specialty ON public.posts(specialty_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts viewable by everyone"
  ON public.posts FOR SELECT USING (true);

CREATE POLICY "Create posts with role rules"
  ON public.posts FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id)
    AND (
      post_type IN ('question','missing_drug')
      OR (
        post_type = 'awareness'
        AND public.is_verified_doctor_profile(author_profile_id)
      )
    )
  );

CREATE POLICY "Authors update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id));

CREATE POLICY "Authors delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id));

CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== post_drug_info ==========
CREATE TABLE public.post_drug_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE REFERENCES public.posts(id) ON DELETE CASCADE,
  drug_name text NOT NULL CHECK (char_length(drug_name) BETWEEN 1 AND 200),
  dosage text,
  alternative_suggested text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_drug_info_name ON public.post_drug_info(lower(drug_name));

ALTER TABLE public.post_drug_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drug info viewable by everyone"
  ON public.post_drug_info FOR SELECT USING (true);

CREATE POLICY "Post author manages drug info"
  ON public.post_drug_info FOR ALL
  USING (
    auth.uid() IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.posts po ON po.author_profile_id = p.id
      WHERE po.id = post_drug_info.post_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT p.user_id FROM public.profiles p
      JOIN public.posts po ON po.author_profile_id = p.id
      WHERE po.id = post_drug_info.post_id
    )
  );

CREATE TRIGGER trg_drug_info_updated_at
  BEFORE UPDATE ON public.post_drug_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== post_replies ==========
CREATE TABLE public.post_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_role text NOT NULL CHECK (author_role IN ('doctor','patient','pharmacist','admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  parent_reply_id uuid REFERENCES public.post_replies(id) ON DELETE CASCADE,
  is_doctor_verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_replies_post ON public.post_replies(post_id, created_at);
CREATE INDEX idx_replies_author ON public.post_replies(author_profile_id);

ALTER TABLE public.post_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies viewable by everyone"
  ON public.post_replies FOR SELECT USING (true);

CREATE POLICY "Authenticated users create replies"
  ON public.post_replies FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id));

CREATE POLICY "Authors update own replies"
  ON public.post_replies FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id));

CREATE POLICY "Authors delete own replies"
  ON public.post_replies FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = author_profile_id));

CREATE TRIGGER trg_replies_updated_at
  BEFORE UPDATE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.is_doctor_verified := public.is_verified_doctor_profile(NEW.author_profile_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_replies_set_verified
  BEFORE INSERT ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_reply();

CREATE OR REPLACE FUNCTION public.bump_replies_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_replies_count
  AFTER INSERT OR DELETE ON public.post_replies
  FOR EACH ROW EXECUTE FUNCTION public.bump_replies_count();

-- ========== post_reactions ==========
CREATE TABLE public.post_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like','helpful','important')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX idx_reactions_post ON public.post_reactions(post_id);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reactions viewable by everyone"
  ON public.post_reactions FOR SELECT USING (true);

CREATE POLICY "Users create own reactions"
  ON public.post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own reactions"
  ON public.post_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own reactions"
  ON public.post_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_reactions_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reactions_count = reactions_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reactions_count = GREATEST(reactions_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_reactions_count
  AFTER INSERT OR DELETE ON public.post_reactions
  FOR EACH ROW EXECUTE FUNCTION public.bump_reactions_count();

-- ========== post_reports ==========
CREATE TABLE public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  reply_id uuid REFERENCES public.post_replies(id) ON DELETE CASCADE,
  reporter_user_id uuid NOT NULL,
  reason text NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (post_id IS NOT NULL OR reply_id IS NOT NULL)
);

ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users create reports"
  ON public.post_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Reporters view own reports"
  ON public.post_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- ========== Storage bucket for post media ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-media', 'post-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Post media publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-media');

CREATE POLICY "Users upload own post media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own post media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users delete own post media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-media'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
