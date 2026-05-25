import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ExchangeRate = {
  currency_code: string;
  rate_to_usd: number;
  symbol: string | null;
  name_en: string | null;
  name_ar: string | null;
};

// Map common country codes to their default currency
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  EG: "EGP", SA: "SAR", AE: "AED", KW: "KWD", QA: "QAR", BH: "BHD",
  OM: "OMR", JO: "JOD", MA: "MAD", TN: "TND", DZ: "DZD",
  US: "USD", GB: "GBP", FR: "EUR", DE: "EUR", ES: "EUR", IT: "EUR",
};

const STORAGE_KEY = "tabibi.user_currency";

async function detectCurrency(): Promise<string> {
  // 1) Stored preference
  const stored = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored) return stored;

  // 2) Try geo-IP (free, no key)
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch("https://ipapi.co/json/", { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data?.currency && typeof data.currency === "string") return data.currency;
      if (data?.country_code && COUNTRY_TO_CURRENCY[data.country_code]) {
        return COUNTRY_TO_CURRENCY[data.country_code];
      }
    }
  } catch {
    /* offline or blocked */
  }

  // 3) Browser locale
  try {
    const region = new Intl.Locale(navigator.language).maximize().region;
    if (region && COUNTRY_TO_CURRENCY[region]) return COUNTRY_TO_CURRENCY[region];
  } catch {
    /* ignore */
  }

  return "EGP";
}

export function useCurrency() {
  const [userCurrency, setUserCurrency] = useState<string>("EGP");

  useEffect(() => {
    let mounted = true;
    detectCurrency().then((c) => {
      if (mounted) setUserCurrency(c);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const { data: rates = [] } = useQuery({
    queryKey: ["exchange_rates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("exchange_rates").select("*");
      if (error) throw error;
      return data as ExchangeRate[];
    },
    staleTime: 60 * 60 * 1000, // 1h
  });

  const ratesMap = new Map(rates.map((r) => [r.currency_code, r]));

  const setCurrency = (code: string) => {
    setUserCurrency(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  };

  /** Convert an amount in `fromCurrency` to `toCurrency` (defaults to user currency). */
  const convert = (amount: number, fromCurrency: string, toCurrency?: string): number | null => {
    const target = toCurrency ?? userCurrency;
    const from = ratesMap.get(fromCurrency.toUpperCase());
    const to = ratesMap.get(target.toUpperCase());
    if (!from || !to) return null;
    const usd = amount / Number(from.rate_to_usd);
    return usd * Number(to.rate_to_usd);
  };

  const format = (amount: number, currency: string): string => {
    const meta = ratesMap.get(currency.toUpperCase());
    const sym = meta?.symbol ?? currency;
    const rounded = amount >= 100 ? Math.round(amount) : Math.round(amount * 100) / 100;
    return `${rounded.toLocaleString()} ${sym}`;
  };

  /**
   * Format a price with optional conversion. Returns the original price and,
   * if different from user currency, a converted approximation in parentheses.
   */
  const formatPrice = (amount: number, fromCurrency: string): string => {
    const original = format(amount, fromCurrency);
    if (fromCurrency.toUpperCase() === userCurrency.toUpperCase()) return original;
    const converted = convert(amount, fromCurrency);
    if (converted == null) return original;
    return `${original} (~${format(converted, userCurrency)})`;
  };

  return { userCurrency, setCurrency, rates, convert, format, formatPrice };
}
