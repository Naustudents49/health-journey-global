import { createFileRoute } from "@tanstack/react-router";
import { useLanguage } from "@/hooks/useLanguage";
import { Search, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Find a Doctor — Tabibi" },
      { name: "description", content: "Search and book appointments with verified doctors on Tabibi." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">
          {t("Find a Doctor", "ابحث عن طبيب")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("Coming soon in v0.3", "قادم قريباً في الإصدار ٠.٣")}
        </p>
      </div>
    </div>
  );
}
