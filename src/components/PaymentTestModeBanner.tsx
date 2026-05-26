const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2 text-center text-sm text-foreground">
      وضع الاختبار: جميع المدفوعات هنا هي مدفوعات وهمية بدون أي خصم فعلي.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        اعرف المزيد
      </a>
    </div>
  );
}
