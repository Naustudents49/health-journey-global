import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import type { Database } from "@/integrations/supabase/types";

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

function resolvePriceId(item: any): string | null {
  return (
    item?.price?.lookup_key ||
    item?.price?.metadata?.lovable_external_id ||
    item?.price?.id ||
    null
  );
}

const PRICE_TO_PLAN: Record<string, string> = {
  doctor_pro_monthly: "doctor_pro_monthly",
  doctor_pro_plus_monthly: "doctor_pro_plus_monthly",
};

async function syncDoctorProFlags(userId: string, env: StripeEnv) {
  const sb = getSupabase();
  // Check current active sub for this user/env
  const { data: sub } = await sb
    .from("subscriptions")
    .select("plan_code,status,current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const periodEnd = sub?.current_period_end ? new Date(sub.current_period_end as string).getTime() : null;
  const isActive = Boolean(
    sub &&
      ((["active", "trialing", "past_due"].includes(sub.status as string) && (!periodEnd || periodEnd > now)) ||
        (sub.status === "canceled" && periodEnd && periodEnd > now)),
  );

  const plan = isActive ? (sub?.plan_code as string | null) : null;
  const isPro = Boolean(isActive && (plan === "doctor_pro_monthly" || plan === "doctor_pro_plus_monthly"));
  const isProPlus = Boolean(isActive && plan === "doctor_pro_plus_monthly");

  // Find doctor_details for this user
  const { data: profile } = await sb
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile) return;

  await sb
    .from("doctor_details")
    .update({
      is_pro: isPro,
      pro_plus_active: isProPlus,
      telemedicine_enabled: isProPlus,
    })
    .eq("profile_id", profile.id as string);
}

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = resolvePriceId(item);
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const planCode = subscription.metadata?.planCode || (priceId ? PRICE_TO_PLAN[priceId] : null);

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId,
        price_id: priceId ?? "",
        plan_code: planCode,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  await syncDoctorProFlags(userId, env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) await syncDoctorProFlags(userId, env);
}

async function handleInvoicePaid(invoice: any, env: StripeEnv) {
  const userId = invoice.subscription_details?.metadata?.userId || invoice.metadata?.userId;
  if (!userId) {
    console.warn("Invoice without userId metadata, skipping");
    return;
  }

  const sb = getSupabase();
  let subscriptionId: string | null = null;
  if (invoice.subscription) {
    const { data: subRow } = await sb
      .from("subscriptions")
      .select("id")
      .eq("stripe_subscription_id", invoice.subscription as string)
      .eq("environment", env)
      .maybeSingle();
    subscriptionId = (subRow?.id as string | undefined) ?? null;
  }

  const amount = invoice.amount_paid ?? invoice.amount_due ?? 0;
  const issuedAt = invoice.status_transitions?.finalized_at
    ? new Date(invoice.status_transitions.finalized_at * 1000).toISOString()
    : new Date().toISOString();
  const paidAt = invoice.status_transitions?.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
    : null;

  // De-duplicate by Stripe invoice id stored in eta_payload->>'stripe_invoice_id'
  const { data: existing } = await sb
    .from("invoices")
    .select("id")
    .eq("user_id", userId)
    .eq("environment", env)
    .filter("eta_payload->>stripe_invoice_id", "eq", invoice.id)
    .maybeSingle();

  const row = {
    user_id: userId,
    subscription_id: subscriptionId,
    amount_cents: amount,
    net_cents: amount,
    currency: (invoice.currency || "egp").toUpperCase(),
    status: invoice.status === "paid" ? "paid" : (invoice.status as string),
    description: invoice.lines?.data?.[0]?.description ?? "Subscription invoice",
    customer_name: invoice.customer_name ?? null,
    issued_at: issuedAt,
    paid_at: paidAt,
    pdf_url: invoice.invoice_pdf ?? invoice.hosted_invoice_url ?? null,
    eta_payload: { stripe_invoice_id: invoice.id } as any,
    environment: env,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await sb.from("invoices").update(row).eq("id", existing.id as string);
  } else {
    await sb.from("invoices").insert(row);
  }
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.paid":
    case "invoice.payment_succeeded":
      await handleInvoicePaid(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
