import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { HeartPulse, User, Mail, Shield } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Tabibi" },
      { name: "description", content: "Manage your Tabibi profile and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">{t("Please sign in to view your profile", "يرجى تسجيل الدخول لعرض ملفك الشخصي")}</p>
          <Link to="/login" className="mt-4 inline-block text-primary hover:underline">
            {t("Sign In", "تسجيل الدخول")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {t("Your Profile", "ملفك الشخصي")}
            </h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-accent p-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("Email", "البريد الإلكتروني")}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-accent p-4">
            <Shield className="h-5 w-5 text-teal" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("Account Status", "حالة الحساب")}</p>
              <p className="text-sm text-muted-foreground">{t("Active", "نشط")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-accent p-4">
            <HeartPulse className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">{t("Member Since", "عضو منذ")}</p>
              <p className="text-sm text-muted-foreground">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
