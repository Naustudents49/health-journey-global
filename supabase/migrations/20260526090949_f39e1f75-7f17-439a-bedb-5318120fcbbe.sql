-- ============ subscription_plans ============
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description_en text,
  description_ar text,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  interval text NOT NULL DEFAULT 'month',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  stripe_price_id text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plans viewable by everyone"
  ON public.subscription_plans FOR SELECT USING (is_active = true);

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ subscriptions ============
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text,
  price_id text NOT NULL,
  plan_code text,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: check active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_plan(
  user_uuid uuid,
  plan text,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND plan_code = plan
      AND (
        (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

-- ============ invoices (الفاتورة الإلكترونية ETA-ready) ============
CREATE SEQUENCE public.invoice_number_seq START 1000;

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint NOT NULL DEFAULT nextval('public.invoice_number_seq') UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  appointment_id uuid,
  doctor_profile_id uuid,
  amount_cents integer NOT NULL,
  tax_cents integer NOT NULL DEFAULT 0,
  commission_cents integer NOT NULL DEFAULT 0,
  net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'draft',
  description text,
  customer_name text,
  customer_tax_id text,
  seller_name text,
  seller_tax_id text,
  issued_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  eta_payload jsonb,
  eta_submission_uuid text,
  eta_status text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_doctor_profile_id ON public.invoices(doctor_profile_id);
CREATE INDEX idx_invoices_number ON public.invoices(number);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors view their invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p WHERE p.id = invoices.doctor_profile_id
  ));

CREATE POLICY "Service role manages invoices"
  ON public.invoices FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ payments ============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'stripe',
  provider_payment_id text,
  provider_session_id text,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'EGP',
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  raw_payload jsonb,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages payments"
  ON public.payments FOR ALL
  USING (auth.role() = 'service_role');

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ doctor_consent (لائحة 2023 + قانون 151/2020) ============
CREATE TABLE public.doctor_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  telemedicine_2023_accepted boolean NOT NULL DEFAULT false,
  telemedicine_2023_signed_at timestamptz,
  data_protection_law_accepted boolean NOT NULL DEFAULT false,
  data_protection_law_signed_at timestamptz,
  electronic_billing_accepted boolean NOT NULL DEFAULT false,
  electronic_billing_signed_at timestamptz,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id)
);

ALTER TABLE public.doctor_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors view own consent"
  ON public.doctor_consent FOR SELECT
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_consent.doctor_id
  ));

CREATE POLICY "Doctors insert own consent"
  ON public.doctor_consent FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_consent.doctor_id
  ));

CREATE POLICY "Doctors update own consent"
  ON public.doctor_consent FOR UPDATE
  USING (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.doctor_details dd ON dd.profile_id = p.id
    WHERE dd.id = doctor_consent.doctor_id
  ));

CREATE TRIGGER update_doctor_consent_updated_at
  BEFORE UPDATE ON public.doctor_consent
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ audit_logs (قانون 151/2020) ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address text,
  user_agent text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages audit_logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============ doctor_details extensions ============
ALTER TABLE public.doctor_details
  ADD COLUMN IF NOT EXISTS syndicate_number text,
  ADD COLUMN IF NOT EXISTS national_id_last4 text,
  ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pro_plus_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS telemedicine_enabled boolean NOT NULL DEFAULT false;

-- ============ appointments extensions ============
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS consultation_fee_cents integer,
  ADD COLUMN IF NOT EXISTS commission_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS patient_consent_accepted boolean NOT NULL DEFAULT false;

-- ============ Seed initial subscription plans ============
INSERT INTO public.subscription_plans (code, name_en, name_ar, description_en, description_ar, price_cents, currency, interval, features, sort_order)
VALUES
  ('doctor_free', 'Free', 'مجاني', 'Basic profile and bookings', 'ملف أساسي وحجوزات', 0, 'EGP', 'month',
   '["Basic profile", "Accept in-person bookings", "Standard search ranking"]'::jsonb, 1),
  ('doctor_pro_monthly', 'Doctor Pro', 'الطبيب المحترف', 'Pro badge, higher ranking, analytics', 'شارة Pro، ترتيب أعلى، تحليلات', 49900, 'EGP', 'month',
   '["Pro badge", "Higher search ranking", "Analytics dashboard", "5 boosted posts/month"]'::jsonb, 2),
  ('doctor_pro_plus_monthly', 'Doctor Pro+', 'الطبيب المحترف بلس', 'Telemedicine + 0% booking commission + premium profile', 'الكشف أونلاين + 0% عمولة على الحجوزات + ملف مميز', 120000, 'EGP', 'month',
   '["All Pro features", "Telemedicine enabled", "0% commission on in-person bookings", "10% commission on telemedicine (vs 15%)", "Premium profile page", "Priority support"]'::jsonb, 3);