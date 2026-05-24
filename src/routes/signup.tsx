import { createFileRoute, Link } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { HeartPulse } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Tabibi" },
      { name: "description", content: "Create your Tabibi account to connect with trusted doctors." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
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
            {t("Get Started", "ابدأ الآن")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("Create your account and connect with trusted doctors", "أنشئ حسابك وتواصل مع أطباء موثوق بهم")}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-center text-sm text-muted-foreground">
            {t("Sign up coming soon in v0.2", "التسجيل قادم قريباً في الإصدار ٠.٢")}
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
