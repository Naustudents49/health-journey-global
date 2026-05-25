
-- 1. Drop user_roles self-insert (server-side signup uses service role)
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2. Create private doctor_credentials table for license_number
CREATE TABLE IF NOT EXISTS public.doctor_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL UNIQUE REFERENCES public.doctor_details(id) ON DELETE CASCADE,
  license_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.doctor_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own credentials" ON public.doctor_credentials
FOR SELECT USING (
  auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_credentials.doctor_id
  )
);
CREATE POLICY "Doctors insert own credentials" ON public.doctor_credentials
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_credentials.doctor_id
  )
);
CREATE POLICY "Doctors update own credentials" ON public.doctor_credentials
FOR UPDATE USING (
  auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_credentials.doctor_id
  )
);

CREATE TRIGGER update_doctor_credentials_updated_at
BEFORE UPDATE ON public.doctor_credentials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing license_number values
INSERT INTO public.doctor_credentials (doctor_id, license_number)
SELECT id, license_number FROM public.doctor_details
WHERE license_number IS NOT NULL
ON CONFLICT (doctor_id) DO NOTHING;

ALTER TABLE public.doctor_details DROP COLUMN IF EXISTS license_number;

-- 3. Create private user_contacts table for phone
CREATE TABLE IF NOT EXISTS public.user_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own contact" ON public.user_contacts
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own contact" ON public.user_contacts
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own contact" ON public.user_contacts
FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_contacts_updated_at
BEFORE UPDATE ON public.user_contacts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.user_contacts (user_id, phone)
SELECT user_id, phone FROM public.profiles
WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- 4. Restrict profiles SELECT: own profile OR profile of a doctor (needed for public discovery)
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Own profile or doctor profile viewable"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.doctor_details dd WHERE dd.profile_id = profiles.id)
);
