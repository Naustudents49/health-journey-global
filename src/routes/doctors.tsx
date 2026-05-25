import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useCurrency } from "@/hooks/useCurrency";
import { supabase } from "@/integrations/supabase/client";
import { Search, MapPin, Star, Stethoscope, BadgeCheck, Loader2 } from "lucide-react";

export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Find a Doctor — Tabibi" },
      { name: "description", content: "Search and book appointments with verified doctors on Tabibi." },
    ],
  }),
  component: DoctorsPage,
});

type Specialty = { id: string; name_ar: string; name_en: string; slug: string };
type DoctorRow = {
  id: string;
  specialty: string | null;
  bio: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  consultation_fee: number | null;
  years_experience: number | null;
  rating: number | null;
  is_verified: boolean | null;
  profile_id: string;
  profiles: { id: string; full_name: string | null; city: string | null; avatar_url: string | null } | null;
};

function DoctorsPage() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<string>("");
  const [city, setCity] = useState("");

  const { data: specialties = [] } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data, error } = await supabase.from("specialties").select("*").order("name_en");
      if (error) throw error;
      return data as Specialty[];
    },
  });

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_details")
        .select("*, profiles!doctor_details_profile_id_fkey(id, full_name, city, avatar_url)")
        .order("rating", { ascending: false })
        .limit(100);
      if (error) {
        // Fallback if foreign-key embed name differs
        const { data: d2, error: e2 } = await supabase.from("doctor_details").select("*").limit(100);
        if (e2) throw e2;
        // hydrate profiles separately
        const ids = (d2 || []).map((d) => d.profile_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, city, avatar_url")
          .in("id", ids);
        return (d2 || []).map((d) => ({
          ...d,
          profiles: profs?.find((p) => p.id === d.profile_id) ?? null,
        })) as DoctorRow[];
      }
      return data as unknown as DoctorRow[];
    },
  });

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const name = d.profiles?.full_name?.toLowerCase() ?? "";
      const matchesSearch = !search || name.includes(search.toLowerCase()) || (d.specialty ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesSpec = !specialty || d.specialty === specialty;
      const matchesCity = !city || (d.profiles?.city ?? "").toLowerCase().includes(city.toLowerCase());
      return matchesSearch && matchesSpec && matchesCity;
    });
  }, [doctors, search, specialty, city]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-teal/10 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {t("Find your doctor", "ابحث عن طبيبك")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("Browse verified doctors and book in seconds.", "تصفح أطباء موثقين واحجز في ثوانٍ.")}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3 bg-card p-4 rounded-xl shadow-sm border border-border">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Doctor name or specialty", "اسم الطبيب أو التخصص")}
                className="w-full ps-10 pe-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">{t("All specialties", "كل التخصصات")}</option>
              {specialties.map((s) => (
                <option key={s.id} value={language === "ar" ? s.name_ar : s.name_en}>
                  {language === "ar" ? s.name_ar : s.name_en}
                </option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-muted-foreground" />
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t("City (e.g. Cairo)", "المدينة (مثال: القاهرة)")}
                className="w-full ps-10 pe-3 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Specialty chips */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSpecialty("")}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${
              !specialty ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"
            }`}
          >
            {t("All", "الكل")}
          </button>
          {specialties.map((s) => {
            const label = language === "ar" ? s.name_ar : s.name_en;
            const active = specialty === label;
            return (
              <button
                key={s.id}
                onClick={() => setSpecialty(label)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-xl">
            <Stethoscope className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">
              {t("No doctors match your search yet.", "لا يوجد أطباء يطابقون بحثك بعد.")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("Be the first — invite doctors to join Tabibi.", "كن البادئ — ادعُ الأطباء للانضمام إلى طبيبي.")}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <DoctorCard key={d.id} doctor={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor }: { doctor: DoctorRow }) {
  const { t } = useLanguage();
  const name = doctor.profiles?.full_name ?? t("Doctor", "طبيب");
  const initial = name.charAt(0).toUpperCase();
  return (
    <Link
      to="/doctor/$id"
      params={{ id: doctor.id }}
      className="group block bg-card border border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-primary-foreground text-xl font-semibold shrink-0">
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {doctor.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground truncate">{doctor.specialty}</p>
          {doctor.profiles?.city && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {doctor.profiles.city}
            </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-foreground">
          <Star className="h-4 w-4 fill-current text-amber-500" />
          <span className="font-medium">{Number(doctor.rating ?? 0).toFixed(1)}</span>
        </div>
        <div className="text-muted-foreground">
          {doctor.consultation_fee ? `${doctor.consultation_fee} ${t("EGP", "ج.م")}` : t("Free", "مجاناً")}
        </div>
      </div>
    </Link>
  );
}
