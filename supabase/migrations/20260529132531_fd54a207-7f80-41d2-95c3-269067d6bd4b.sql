CREATE TABLE IF NOT EXISTS public.doctor_billing_settings (
  doctor_details_id UUID PRIMARY KEY REFERENCES public.doctor_details(id) ON DELETE CASCADE,
  payout_method TEXT NOT NULL DEFAULT 'bank'
    CHECK (payout_method IN ('bank','instapay','vodafone_cash','wise','manual')),
  account_holder TEXT,
  bank_name TEXT,
  iban_or_account TEXT,
  swift TEXT,
  vodafone_number TEXT,
  instapay_handle TEXT,
  tax_id TEXT,
  vat_registered BOOLEAN NOT NULL DEFAULT false,
  platform_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 100),
  minimum_payout NUMERIC(10,2) NOT NULL DEFAULT 500.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_billing_settings TO authenticated;
GRANT ALL ON public.doctor_billing_settings TO service_role;

CREATE TRIGGER trg_doctor_billing_settings_updated_at
  BEFORE UPDATE ON public.doctor_billing_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.doctor_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_details_id UUID NOT NULL REFERENCES public.doctor_details(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  type TEXT NOT NULL
    CHECK (type IN ('consultation','refund','adjustment','withdrawal','bonus','chargeback')),
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending','completed','reversed','cancelled')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.doctor_transactions TO authenticated;
GRANT ALL ON public.doctor_transactions TO service_role;

CREATE INDEX IF NOT EXISTS idx_doctor_tx_doctor ON public.doctor_transactions(doctor_details_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_tx_appt ON public.doctor_transactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_doctor_tx_status ON public.doctor_transactions(status);

CREATE TABLE IF NOT EXISTS public.doctor_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_details_id UUID NOT NULL REFERENCES public.doctor_details(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'EGP',
  method TEXT NOT NULL,
  payout_details_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','processing','paid','rejected','cancelled')),
  reference TEXT,
  doctor_note TEXT,
  admin_note TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.doctor_withdrawals TO authenticated;
GRANT ALL ON public.doctor_withdrawals TO service_role;

CREATE INDEX IF NOT EXISTS idx_doctor_wd_doctor ON public.doctor_withdrawals(doctor_details_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_doctor_wd_status ON public.doctor_withdrawals(status, created_at DESC);

CREATE TRIGGER trg_doctor_withdrawals_updated_at
  BEFORE UPDATE ON public.doctor_withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.doctor_billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor reads own billing" ON public.doctor_billing_settings FOR SELECT
  USING (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctor manages own billing" ON public.doctor_billing_settings FOR ALL
  USING (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid()));

CREATE POLICY "admin manages all billing" ON public.doctor_billing_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctor reads own tx" ON public.doctor_transactions FOR SELECT
  USING (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin manages tx" ON public.doctor_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctor reads own wd" ON public.doctor_withdrawals FOR SELECT
  USING (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctor requests own wd" ON public.doctor_withdrawals FOR INSERT
  WITH CHECK (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid())
    AND status = 'requested');

CREATE POLICY "doctor cancels own pending wd" ON public.doctor_withdrawals FOR UPDATE
  USING (doctor_details_id IN (SELECT dd.id FROM public.doctor_details dd JOIN public.profiles p ON p.id = dd.profile_id WHERE p.user_id = auth.uid())
    AND status = 'requested');

CREATE POLICY "admin manages wd" ON public.doctor_withdrawals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-generate consultation transactions on appointment completion
-- Note: appointments.doctor_id refers to profiles.id, so we resolve doctor_details via profile_id
CREATE OR REPLACE FUNCTION public.create_transaction_on_appointment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_details_id UUID;
  v_fee_pct NUMERIC(5,2);
  v_fee NUMERIC(10,2);
  v_net NUMERIC(10,2);
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT id INTO v_doctor_details_id
      FROM public.doctor_details
      WHERE profile_id = NEW.doctor_id
      LIMIT 1;

    IF v_doctor_details_id IS NULL THEN
      RETURN NEW;
    END IF;

    IF EXISTS (
      SELECT 1 FROM public.doctor_transactions
      WHERE appointment_id = NEW.id AND type = 'consultation'
    ) THEN
      RETURN NEW;
    END IF;

    SELECT COALESCE(platform_fee_pct, 15.00) INTO v_fee_pct
      FROM public.doctor_billing_settings
      WHERE doctor_details_id = v_doctor_details_id;

    IF v_fee_pct IS NULL THEN v_fee_pct := 15.00; END IF;

    v_fee := ROUND((COALESCE(NEW.fee, 0) * v_fee_pct / 100)::numeric, 2);
    v_net := COALESCE(NEW.fee, 0) - v_fee;

    INSERT INTO public.doctor_transactions(
      doctor_details_id, appointment_id, type,
      gross_amount, platform_fee, net_amount, currency, status, description
    ) VALUES (
      v_doctor_details_id, NEW.id, 'consultation',
      COALESCE(NEW.fee, 0), v_fee, v_net, 'EGP', 'completed',
      'Auto: appointment completed'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_appt_completion_tx ON public.appointments;
CREATE TRIGGER trg_appt_completion_tx
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.create_transaction_on_appointment_completion();