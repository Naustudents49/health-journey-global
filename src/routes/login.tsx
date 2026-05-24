import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { HeartPulse } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Tabibi" },
      { name: "description", content: "Sign in to your Tabibi account to manage your health." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-teal">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">Tabibi</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            {t("Welcome back", "مرحباً بعودتك")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Sign in to continue your healthcare journey", "سجل الدخول لمتابعة رحلتك الصحية")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-center text-sm text-muted-foreground">
            {t("Authentication coming soon in v0.2", "المصادقة قادمة قريباً في الإصدار ٠.٢")}
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              {t("Back to home", "العودة للرئيسية")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
