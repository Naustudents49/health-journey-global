import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Loader2, X, CheckCircle2, Video } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/appointments")({
  head: () => ({
    meta: [
      { title: "My Appointments — Tabibi" },
      { name: "description", content: "Manage your appointments on Tabibi." },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const { t } = useLanguage();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["appointments", profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .or(`patient_id.eq.${profile!.id},doctor_id.eq.${profile!.id}`)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Appointment cancelled", "تم إلغاء الموعد"));
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground mb-2">{t("My Appointments", "مواعيدي")}</h1>
      <p className="text-muted-foreground mb-8">{t("Manage your upcoming and past appointments.", "تابع مواعيدك القادمة والسابقة.")}</p>

      {appointments.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("No appointments yet.", "لا توجد مواعيد بعد.")}</p>
          <Link to="/doctors" className="mt-4 inline-block px-5 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90">
            {t("Find a doctor", "ابحث عن طبيب")}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const date = new Date(a.scheduled_at);
            const isPast = date < new Date();
            const statusColor = {
              pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
              confirmed: "bg-primary/10 text-primary",
              completed: "bg-teal/10 text-teal",
              cancelled: "bg-destructive/10 text-destructive",
            }[a.status] ?? "bg-muted text-muted-foreground";

            return (
              <div key={a.id} className="bg-card border border-border rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${a.appointment_type === "video" ? "bg-teal/10 text-teal" : "bg-primary/10 text-primary"}`}>
                    {a.appointment_type === "video" ? <Video className="h-6 w-6" /> : <Calendar className="h-6 w-6" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {date.toLocaleDateString()} <span className="text-muted-foreground"> · </span>
                      <Clock className="inline h-3 w-3 mx-1" />
                      {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{a.status}</span>
                      <span className="text-muted-foreground">{a.fee} {t("EGP", "ج.م")}</span>
                      {a.appointment_type === "video" && (
                        <span className="text-xs text-teal font-medium">{t("Video call", "مكالمة فيديو")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {a.appointment_type === "video" && a.status === "confirmed" && (
                    <Link
                      to="/consultation/$id"
                      params={{ id: a.id }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal text-white text-sm font-medium hover:opacity-90"
                    >
                      <Video className="h-4 w-4" />
                      {t("Join", "ادخل")}
                    </Link>
                  )}
                  {a.status !== "cancelled" && a.status !== "completed" && !isPast && (
                    <button
                      onClick={() => cancelMutation.mutate(a.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                      title={t("Cancel", "إلغاء")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {a.status === "completed" && <CheckCircle2 className="h-5 w-5 text-teal" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
