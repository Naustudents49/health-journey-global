import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, XCircle, Calendar, Clock, Users, DollarSign, Stethoscope, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Doctor Dashboard — Tabibi" },
      { name: "description", content: "Manage your schedule, appointments, and clinic profile on Tabibi." },
    ],
  }),
  component: DashboardPage,
});

interface DoctorDetails {
  id: string;
  profile_id: string;
  specialty: string | null;
  bio: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  consultation_fee: number | null;
  years_experience: number | null;
  license_number: string | null;
  is_verified: boolean | null;
  verification_status: string | null;
}

function DashboardPage() {
  const { t } = useLanguage();
  const { user, role, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: "/login" });
    else if (role && role !== "doctor") navigate({ to: "/appointments" });
  }, [authLoading, user, role, navigate]);

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ["doctor_details", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctor_details")
        .select("*")
        .eq("profile_id", profile!.id)
        .maybeSingle();
      if (error) throw error;
      return data as DoctorDetails | null;
    },
  });

  const { data: appointments = [], isLoading: aptLoading } = useQuery({
    queryKey: ["doctor_appointments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("doctor_id", profile!.id)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.status === "confirmed"
          ? t("Appointment confirmed", "تم تأكيد الموعد")
          : vars.status === "completed"
          ? t("Marked as completed", "تم تمييزه كمكتمل")
          : t("Appointment cancelled", "تم إلغاء الموعد"),
      );
      queryClient.invalidateQueries({ queryKey: ["doctor_appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const pending = appointments.filter((a) => a.status === "pending").length;
    const confirmed = appointments.filter((a) => a.status === "confirmed").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const revenue = appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + Number(a.fee ?? 0), 0);
    return { pending, confirmed, completed, revenue };
  }, [appointments]);

  if (authLoading || detailsLoading || aptLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {t("Doctor Dashboard", "لوحة تحكم الطبيب")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("Welcome back", "مرحبًا بعودتك")}, {profile?.full_name ?? user?.email}
        </p>
        {details && !details.is_verified && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            {t(
              "Your account is pending verification. You'll appear in search results once approved.",
              "حسابك قيد المراجعة. سيظهر ملفك في نتائج البحث بعد الموافقة.",
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Clock} label={t("Pending", "قيد الانتظار")} value={stats.pending} color="amber" />
        <StatCard icon={Calendar} label={t("Confirmed", "مؤكدة")} value={stats.confirmed} color="primary" />
        <StatCard icon={Users} label={t("Completed", "مكتملة")} value={stats.completed} color="teal" />
        <StatCard
          icon={DollarSign}
          label={t("Revenue", "الإيرادات")}
          value={`${stats.revenue} ${t("EGP", "ج.م")}`}
          color="teal"
        />
      </div>

      {/* Profile editor */}
      <DoctorProfileEditor details={details} profileId={profile?.id ?? null} />

      {/* Pending appointments */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("Pending Requests", "طلبات قيد الانتظار")}
        </h2>
        {appointments.filter((a) => a.status === "pending").length === 0 ? (
          <p className="text-muted-foreground text-sm border border-dashed border-border rounded-xl p-6 text-center">
            {t("No pending requests.", "لا توجد طلبات قيد الانتظار.")}
          </p>
        ) : (
          <div className="space-y-3">
            {appointments
              .filter((a) => a.status === "pending")
              .map((a) => (
                <AppointmentRow
                  key={a.id}
                  appt={a}
                  onConfirm={() => updateStatus.mutate({ id: a.id, status: "confirmed" })}
                  onReject={() => updateStatus.mutate({ id: a.id, status: "cancelled" })}
                  t={t}
                />
              ))}
          </div>
        )}
      </section>

      {/* Upcoming confirmed */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t("Upcoming Appointments", "المواعيد القادمة")}
        </h2>
        {appointments.filter((a) => a.status === "confirmed").length === 0 ? (
          <p className="text-muted-foreground text-sm border border-dashed border-border rounded-xl p-6 text-center">
            {t("No upcoming appointments.", "لا توجد مواعيد قادمة.")}
          </p>
        ) : (
          <div className="space-y-3">
            {appointments
              .filter((a) => a.status === "confirmed")
              .map((a) => (
                <AppointmentRow
                  key={a.id}
                  appt={a}
                  onComplete={() => updateStatus.mutate({ id: a.id, status: "completed" })}
                  onReject={() => updateStatus.mutate({ id: a.id, status: "cancelled" })}
                  t={t}
                />
              ))}
          </div>
        )}

        <div className="mt-6">
          <Link
            to="/appointments"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("View all appointments →", "عرض كل المواعيد ←")}
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: "primary" | "teal" | "amber";
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-teal/10 text-teal",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function AppointmentRow({
  appt,
  onConfirm,
  onComplete,
  onReject,
  t,
}: {
  appt: { id: string; scheduled_at: string; fee: number; status: string; notes: string | null };
  onConfirm?: () => void;
  onComplete?: () => void;
  onReject?: () => void;
  t: (en: string, ar: string) => string;
}) {
  const date = new Date(appt.scheduled_at);
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-foreground text-sm">
            {date.toLocaleDateString()} ·{" "}
            {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {appt.fee} {t("EGP", "ج.م")}
            {appt.notes && ` · ${appt.notes}`}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("Confirm", "تأكيد")}
          </button>
        )}
        {onComplete && (
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-medium hover:bg-teal/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("Complete", "إكمال")}
          </button>
        )}
        {onReject && (
          <button
            onClick={onReject}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-destructive text-xs font-medium hover:bg-destructive/10"
          >
            <XCircle className="h-3.5 w-3.5" />
            {t("Cancel", "إلغاء")}
          </button>
        )}
      </div>
    </div>
  );
}

function DoctorProfileEditor({
  details,
  profileId,
}: {
  details: DoctorDetails | null | undefined;
  profileId: string | null;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    specialty: details?.specialty ?? "",
    bio: details?.bio ?? "",
    clinic_name: details?.clinic_name ?? "",
    clinic_address: details?.clinic_address ?? "",
    consultation_fee: details?.consultation_fee?.toString() ?? "",
    years_experience: details?.years_experience?.toString() ?? "",
  });

  useEffect(() => {
    if (details) {
      setForm({
        specialty: details.specialty ?? "",
        bio: details.bio ?? "",
        clinic_name: details.clinic_name ?? "",
        clinic_address: details.clinic_address ?? "",
        consultation_fee: details.consultation_fee?.toString() ?? "",
        years_experience: details.years_experience?.toString() ?? "",
      });
    }
  }, [details]);

  const save = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error("No profile");
      const payload = {
        profile_id: profileId,
        specialty: form.specialty || null,
        bio: form.bio || null,
        clinic_name: form.clinic_name || null,
        clinic_address: form.clinic_address || null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        years_experience: form.years_experience ? Number(form.years_experience) : null,
      };
      if (details?.id) {
        const { error } = await supabase.from("doctor_details").update(payload).eq("id", details.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("doctor_details").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("Profile updated", "تم تحديث الملف"));
      queryClient.invalidateQueries({ queryKey: ["doctor_details"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <Stethoscope className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">
          {t("Clinic Profile", "ملف العيادة")}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("Specialty", "التخصص")}>
          <input
            type="text"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            placeholder={t("e.g. Cardiology", "مثال: قلب وأوعية دموية")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("Consultation Fee (EGP)", "سعر الكشف (ج.م)")}>
          <input
            type="number"
            min="0"
            value={form.consultation_fee}
            onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("Years of Experience", "سنوات الخبرة")}>
          <input
            type="number"
            min="0"
            value={form.years_experience}
            onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("Clinic Name", "اسم العيادة")}>
          <input
            type="text"
            value={form.clinic_name}
            onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("Clinic Address", "عنوان العيادة")} full>
          <input
            type="text"
            value={form.clinic_address}
            onChange={(e) => setForm({ ...form, clinic_address: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label={t("Bio", "نبذة")} full>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            placeholder={t("Brief description of your practice...", "وصف موجز لخبرتك وممارستك...")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {t("Save Changes", "حفظ التغييرات")}
      </button>
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
