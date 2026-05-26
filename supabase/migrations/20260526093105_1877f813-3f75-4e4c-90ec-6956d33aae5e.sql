
-- Admin role helper (security definer to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Extend doctor_details with review tracking
ALTER TABLE public.doctor_details
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS verification_notes text;

-- Admin can update doctor verification
CREATE POLICY "Admins update doctor verification"
ON public.doctor_details
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin can view all audit logs
CREATE POLICY "Admins view all audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Patient consent per appointment (telemedicine 2023 + data protection 151/2020)
CREATE TABLE IF NOT EXISTS public.patient_appointment_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  telemedicine_consent boolean NOT NULL DEFAULT false,
  data_processing_consent boolean NOT NULL DEFAULT false,
  recording_consent boolean NOT NULL DEFAULT false,
  consent_text_version text NOT NULL DEFAULT 'v1-2026',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_appointment_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients insert own consent"
ON public.patient_appointment_consent
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = patient_id));

CREATE POLICY "Patients view own consent"
ON public.patient_appointment_consent
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = patient_id));

CREATE POLICY "Doctors view their patient consents"
ON public.patient_appointment_consent
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = doctor_id));

CREATE INDEX IF NOT EXISTS idx_pac_appointment ON public.patient_appointment_consent(appointment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_details_verif_status ON public.doctor_details(verification_status);
