
-- 1. Extend doctor_details
ALTER TABLE public.doctor_details
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT ARRAY['Arabic']::text[],
  ADD COLUMN IF NOT EXISTS education text,
  ADD COLUMN IF NOT EXISTS certifications text[],
  ADD COLUMN IF NOT EXISTS about_ar text,
  ADD COLUMN IF NOT EXISTS about_en text;

-- 2. Clinics table
CREATE TABLE IF NOT EXISTS public.clinics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  city text,
  country text DEFAULT 'Egypt',
  lat double precision,
  lng double precision,
  phone text,
  consultation_fee numeric DEFAULT 0,
  currency text DEFAULT 'EGP',
  is_primary boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinics viewable by everyone"
  ON public.clinics FOR SELECT USING (true);

CREATE POLICY "Doctors manage own clinics insert"
  ON public.clinics FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = clinics.doctor_id
  ));

CREATE POLICY "Doctors manage own clinics update"
  ON public.clinics FOR UPDATE
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = clinics.doctor_id
  ));

CREATE POLICY "Doctors manage own clinics delete"
  ON public.clinics FOR DELETE
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = clinics.doctor_id
  ));

CREATE INDEX IF NOT EXISTS idx_clinics_doctor ON public.clinics(doctor_id);
CREATE INDEX IF NOT EXISTS idx_clinics_city ON public.clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_geo ON public.clinics(lat, lng);

CREATE TRIGGER trg_clinics_updated_at
  BEFORE UPDATE ON public.clinics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Clinic schedules
CREATE TABLE IF NOT EXISTS public.clinic_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_duration_minutes integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schedules viewable by everyone"
  ON public.clinic_schedules FOR SELECT USING (true);

CREATE POLICY "Doctors manage own schedules insert"
  ON public.clinic_schedules FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    JOIN public.clinics c ON c.doctor_id = dd.id
    WHERE c.id = clinic_schedules.clinic_id
  ));

CREATE POLICY "Doctors manage own schedules update"
  ON public.clinic_schedules FOR UPDATE
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    JOIN public.clinics c ON c.doctor_id = dd.id
    WHERE c.id = clinic_schedules.clinic_id
  ));

CREATE POLICY "Doctors manage own schedules delete"
  ON public.clinic_schedules FOR DELETE
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    JOIN public.clinics c ON c.doctor_id = dd.id
    WHERE c.id = clinic_schedules.clinic_id
  ));

CREATE INDEX IF NOT EXISTS idx_schedules_clinic ON public.clinic_schedules(clinic_id);

-- 4. Exchange rates
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  currency_code text PRIMARY KEY,
  rate_to_usd numeric NOT NULL,
  symbol text,
  name_en text,
  name_ar text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exchange rates viewable by everyone"
  ON public.exchange_rates FOR SELECT USING (true);

-- Seed common currencies (rates approximate, May 2026)
INSERT INTO public.exchange_rates (currency_code, rate_to_usd, symbol, name_en, name_ar) VALUES
  ('USD', 1.0,   '$',   'US Dollar',       'دولار أمريكي'),
  ('EUR', 0.92,  '€',   'Euro',            'يورو'),
  ('GBP', 0.79,  '£',   'British Pound',   'جنيه إسترليني'),
  ('EGP', 49.0,  'ج.م', 'Egyptian Pound',  'جنيه مصري'),
  ('SAR', 3.75,  'ر.س', 'Saudi Riyal',     'ريال سعودي'),
  ('AED', 3.67,  'د.إ', 'UAE Dirham',      'درهم إماراتي'),
  ('KWD', 0.31,  'د.ك', 'Kuwaiti Dinar',   'دينار كويتي'),
  ('QAR', 3.64,  'ر.ق', 'Qatari Riyal',    'ريال قطري'),
  ('BHD', 0.38,  'د.ب', 'Bahraini Dinar',  'دينار بحريني'),
  ('OMR', 0.38,  'ر.ع', 'Omani Rial',      'ريال عُماني'),
  ('JOD', 0.71,  'د.أ', 'Jordanian Dinar', 'دينار أردني'),
  ('MAD', 9.95,  'د.م', 'Moroccan Dirham', 'درهم مغربي'),
  ('TND', 3.10,  'د.ت', 'Tunisian Dinar',  'دينار تونسي'),
  ('DZD', 134.0, 'د.ج', 'Algerian Dinar',  'دينار جزائري')
ON CONFLICT (currency_code) DO NOTHING;
