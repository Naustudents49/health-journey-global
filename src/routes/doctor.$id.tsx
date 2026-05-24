import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, BadgeCheck, Calendar, Clock, ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/doctor/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Doctor Profile — Tabibi` },
      { name: "description", content: `View doctor profile and book an appointment on Tabibi. ID: ${params.id}` },
    ],
  }),
  component: DoctorDetailPage,
});

function DoctorDetailPage() {
  const { id } = Route.useParams();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => {
      const { data: d, error } = await supabase.from("doctor_details").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", d.profile_id).single();
      return { ...d, profile: p };
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("doctor_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Login required");
      if (!selectedDate || !selectedTime) throw new Error("Pick date & time");
      const scheduled = new Date(`${selectedDate}T${selectedTime}`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        patient_id: profile.id,
        doctor_id: id,
        scheduled_at: scheduled,
        fee: doctor?.consultation_fee ?? 0,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Appointment booked successfully", "تم حجز الموعد بنجاح"));
      setSelectedDate("");
      setSelectedTime("");
      setNotes("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !profile) throw new Error("Login required");
      const { error } = await supabase.from("reviews").insert({
        doctor_id: id,
        patient_id: profile.id,
        rating: reviewRating,
        comment: reviewText || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Review submitted", "تم إرسال التقييم"));
      setReviewText("");
      queryClient.invalidateQueries({ queryKey: ["reviews", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("Doctor not found", "الطبيب غير موجود")}</p>
        <Link to="/doctors" className="mt-4 inline-block text-primary hover:underline">
          {t("Back to doctors", "العودة لقائمة الأطباء")}
        </Link>
      </div>
    );
  }

  const name = doctor.profile?.full_name ?? t("Doctor", "طبيب");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/doctors" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t("Back to doctors", "العودة لقائمة الأطباء")}
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-teal flex items-center justify-center text-primary-foreground text-3xl font-semibold shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground">{name}</h1>
                    {doctor.is_verified && <BadgeCheck className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="text-muted-foreground">{doctor.specialty}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-current text-amber-500" />
                      <span className="font-medium">{Number(doctor.rating ?? 0).toFixed(1)}</span>
                      <span className="text-muted-foreground">({reviews.length})</span>
                    </div>
                    {doctor.years_experience ? (
                      <div className="text-muted-foreground">
                        {doctor.years_experience} {t("years exp.", "سنة خبرة")}
                      </div>
                    ) : null}
                    {doctor.profile?.city && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {doctor.profile.city}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h2 className="font-semibold text-foreground mb-2">{t("About", "نبذة")}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{doctor.bio}</p>
                </div>
              )}

              {doctor.clinic_name && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h2 className="font-semibold text-foreground mb-2">{t("Clinic", "العيادة")}</h2>
                  <p className="text-sm text-foreground">{doctor.clinic_name}</p>
                  {doctor.clinic_address && <p className="text-sm text-muted-foreground mt-1">{doctor.clinic_address}</p>}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> {t("Reviews", "التقييمات")}
              </h2>

              {user && profile && (
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" onClick={() => setReviewRating(n)}>
                        <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-current text-amber-500" : "text-muted-foreground"}`} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder={t("Share your experience...", "شارك تجربتك...")}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => reviewMutation.mutate()}
                    disabled={reviewMutation.isPending}
                    className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {reviewMutation.isPending ? t("Sending...", "جارٍ الإرسال...") : t("Submit review", "إرسال التقييم")}
                  </button>
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("No reviews yet.", "لا توجد تقييمات بعد.")}</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-border last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-current text-amber-500" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      {r.comment && <p className="mt-2 text-sm text-foreground">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Booking column */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl p-6 sticky top-4">
              <div className="text-center pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground">{t("Consultation fee", "رسوم الكشف")}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {doctor.consultation_fee ?? 0} <span className="text-base font-normal">{t("EGP", "ج.م")}</span>
                </p>
              </div>

              {!user ? (
                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("Login to book an appointment", "سجّل الدخول لحجز موعد")}
                  </p>
                  <button
                    onClick={() => navigate({ to: "/login" })}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
                  >
                    {t("Login", "تسجيل الدخول")}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
                      <Calendar className="h-4 w-4" /> {t("Date", "التاريخ")}
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
                      <Clock className="h-4 w-4" /> {t("Time", "الوقت")}
                    </label>
                    <input
                      type="time"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      {t("Notes (optional)", "ملاحظات (اختياري)")}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => bookMutation.mutate()}
                    disabled={bookMutation.isPending || !selectedDate || !selectedTime}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {bookMutation.isPending ? t("Booking...", "جارٍ الحجز...") : t("Book appointment", "احجز موعداً")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
