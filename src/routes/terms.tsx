import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Tabibi" },
      { name: "description", content: "Tabibi terms of service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          {t("Terms of Service", "شروط الخدمة")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Coming soon", "قادم قريباً")}
        </p>
      </div>
    </div>
  );
}
