import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, Stethoscope, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: "خطط الأطباء - طبيبي" },
      {
        name: "description",
        content:
          "خطط Doctor Pro و Pro+ على منصة طبيبي: شارة موثّق، ترتيب أعلى، تحليلات، وكشف أون لاين. اشترك بالشهر وألغِ في أي وقت.",
      },
    ],
  }),
});

interface PlanRow {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[];
  sort_order: number;
}

const PRICE_BY_CODE: Record<string, string> = {
  doctor_pro_monthly: "doctor_pro_monthly",
  doctor_pro_plus_monthly: "doctor_pro_plus_monthly",
};

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return "مجاني";
  const value = (cents / 100).toLocaleString("ar-EG");
  return `${value} ${currency === "EGP" ? "ج.م" : currency}`;
}

function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const { subscription, isActive } = useSubscription(user?.id);
  const { openCheckout, checkoutElement, isOpen, closeCheckout } = useStripeCheckout();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("subscription_plans")
      .select("id,code,name_ar,name_en,description_ar,price_cents,currency,interval,features,sort_order")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (!mounted) return;
        const rows: PlanRow[] = (data ?? []).map((r) => ({
          ...r,
          name_ar: r.name_ar as string,
          name_en: r.name_en as string,
          description_ar: (r.description_ar as string | null) ?? null,
          features: Array.isArray(r.features) ? (r.features as string[]) : [],
        })) as PlanRow[];
        setPlans(rows);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubscribe = (planCode: string) => {
    if (!isAuthenticated || !user) {
      navigate({ to: "/login" });
      return;
    }
    const priceId = PRICE_BY_CODE[planCode];
    if (!priceId) return;
    openCheckout({
      priceId,
      planCode,
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />

      <section className="container mx-auto max-w-6xl px-4 py-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" /> خطط الأطباء
          </span>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">اختر خطتك على طبيبي</h1>
          <p className="mt-3 text-muted-foreground">
            ابدأ مجاناً، ثم انتقل إلى Pro أو Pro+ لزيادة وصولك وتفعيل الكشف أون لاين.
          </p>
          {isActive && subscription?.plan_code && (
            <p className="mt-2 text-sm text-success">
              خطتك الحالية: <strong>{subscription.plan_code}</strong>
            </p>
          )}
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = isActive && subscription?.plan_code === plan.code;
              const isFree = plan.price_cents === 0;
              const highlight = plan.code === "doctor_pro_monthly";
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border bg-card p-6 shadow-sm ${
                    highlight ? "border-primary ring-2 ring-primary/20" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {plan.code.includes("plus") ? (
                      <Video className="h-5 w-5 text-primary" />
                    ) : (
                      <Stethoscope className="h-5 w-5 text-primary" />
                    )}
                    <h3 className="text-xl font-semibold">{plan.name_ar}</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description_ar}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan.price_cents, plan.currency)}</span>
                    {!isFree && <span className="text-sm text-muted-foreground">/ شهرياً</span>}
                  </div>

                  <ul className="mt-6 space-y-2 text-sm">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isFree ? (
                      <Link
                        to="/join-doctor"
                        className="block w-full rounded-lg border border-border bg-background py-2.5 text-center text-sm font-medium hover:bg-muted"
                      >
                        ابدأ مجاناً
                      </Link>
                    ) : isCurrent ? (
                      <button
                        disabled
                        className="block w-full cursor-default rounded-lg bg-muted py-2.5 text-center text-sm font-medium text-muted-foreground"
                      >
                        خطتك الحالية
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(plan.code)}
                        className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium ${
                          highlight
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-foreground text-background hover:opacity-90"
                        }`}
                      >
                        اشترك الآن
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          الأسعار شاملة جميع الضرائب المطبقة. يمكنك الإلغاء في أي وقت من لوحة التحكم. للاطلاع على شروط الكشف
          أون لاين راجع{" "}
          <Link to="/terms" className="underline">
            الشروط
          </Link>{" "}
          و{" "}
          <Link to="/privacy" className="underline">
            سياسة الخصوصية
          </Link>
          .
        </p>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-xl rounded-xl bg-background p-4 shadow-2xl">
            <button
              onClick={closeCheckout}
              className="absolute -top-3 -end-3 rounded-full bg-foreground px-3 py-1 text-sm text-background"
            >
              إغلاق
            </button>
            {checkoutElement}
          </div>
        </div>
      )}
    </div>
  );
}
