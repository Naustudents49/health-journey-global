import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Tabibi" },
      { name: "description", content: "Tabibi privacy policy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          {t("Privacy Policy", "سياسة الخصوصية")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Coming soon", "قادم قريباً")}
        </p>
      </div>
    </div>
  );
}
