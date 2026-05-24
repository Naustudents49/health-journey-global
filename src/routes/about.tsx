import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { HeartPulse } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Tabibi" },
      { name: "description", content: "Learn about Tabibi and our mission." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <HeartPulse className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          {t("About Tabibi", "عن طبيبي")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Coming soon in v0.3", "قادم قريباً في الإصدار ٠.٣")}
        </p>
      </div>
    </div>
  );
}
