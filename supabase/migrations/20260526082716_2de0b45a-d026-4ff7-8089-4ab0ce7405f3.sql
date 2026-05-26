
-- Add pharmacy role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pharmacy';

-- Pharmacy chains
CREATE TABLE public.pharmacy_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  license_number TEXT,
  description TEXT,
  description_ar TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verified chains viewable by everyone"
  ON public.pharmacy_chains FOR SELECT
  USING (is_verified = true OR auth.uid() = owner_user_id);

CREATE POLICY "Users create own chain"
  ON public.pharmacy_chains FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner updates own chain"
  ON public.pharmacy_chains FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE TRIGGER update_pharmacy_chains_updated_at
  BEFORE UPDATE ON public.pharmacy_chains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pharmacy branches
CREATE TABLE public.pharmacy_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES public.pharmacy_chains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Egypt',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  phone TEXT,
  working_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Branches viewable by everyone"
  ON public.pharmacy_branches FOR SELECT USING (true);

CREATE POLICY "Chain owner manages branches insert"
  ON public.pharmacy_branches FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = pharmacy_branches.chain_id));

CREATE POLICY "Chain owner manages branches update"
  ON public.pharmacy_branches FOR UPDATE
  USING (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = pharmacy_branches.chain_id));

CREATE POLICY "Chain owner manages branches delete"
  ON public.pharmacy_branches FOR DELETE
  USING (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = pharmacy_branches.chain_id));

CREATE TRIGGER update_pharmacy_branches_updated_at
  BEFORE UPDATE ON public.pharmacy_branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_branches_chain ON public.pharmacy_branches(chain_id);
CREATE INDEX idx_branches_city ON public.pharmacy_branches(city);

-- Pharmacy drug listings (display only — no online reservation)
CREATE TABLE public.pharmacy_drug_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID NOT NULL REFERENCES public.pharmacy_chains(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.pharmacy_branches(id) ON DELETE SET NULL,
  drug_name TEXT NOT NULL,
  dosage TEXT,
  alternative_name TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'EGP',
  stock_status TEXT NOT NULL DEFAULT 'available',
  notes TEXT,
  linked_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pharmacy_drug_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active listings of verified chains viewable"
  ON public.pharmacy_drug_listings FOR SELECT
  USING (
    is_active = true
    AND EXISTS (SELECT 1 FROM public.pharmacy_chains c WHERE c.id = chain_id AND c.is_verified = true)
    OR auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = chain_id)
  );

CREATE POLICY "Chain owner manages listings insert"
  ON public.pharmacy_drug_listings FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = chain_id));

CREATE POLICY "Chain owner manages listings update"
  ON public.pharmacy_drug_listings FOR UPDATE
  USING (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = chain_id));

CREATE POLICY "Chain owner manages listings delete"
  ON public.pharmacy_drug_listings FOR DELETE
  USING (auth.uid() IN (SELECT owner_user_id FROM public.pharmacy_chains WHERE id = chain_id));

CREATE TRIGGER update_pharmacy_drug_listings_updated_at
  BEFORE UPDATE ON public.pharmacy_drug_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_listings_drug ON public.pharmacy_drug_listings(drug_name);
CREATE INDEX idx_listings_chain ON public.pharmacy_drug_listings(chain_id);
CREATE INDEX idx_listings_active ON public.pharmacy_drug_listings(is_active, expires_at);

-- Storage bucket for pharmacy logos (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pharmacy-logos', 'pharmacy-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Pharmacy logos public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pharmacy-logos');

CREATE POLICY "Authenticated upload pharmacy logo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pharmacy-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner deletes own logo"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pharmacy-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
