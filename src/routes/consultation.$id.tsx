import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Loader2, Video } from "lucide-react";

export const Route = createFileRoute("/consultation/$id")({
  head: () => ({
    meta: [
      { title: "Video Consultation — Tabibi" },
      { name: "description", content: "Secure video consultation room on Tabibi." },
    ],
  }),
  component: ConsultationPage,
});

function ConsultationPage() {
  const { id } = Route.useParams();
  const { t } = useLanguage();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  const { data: appt, isLoading } = useQuery({
    queryKey: ["consultation", id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{t("Appointment not found", "الموعد غير موجود")}</p>
      </div>
    );
  }

  const isParticipant =
    profile?.id === appt.patient_id || profile?.id === appt.doctor_id;

  if (!isParticipant) {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-muted-foreground">
          {t("You are not authorized to join this consultation.", "غير مصرح لك بدخول هذه الاستشارة.")}
        </p>
        <Link to="/appointments" className="mt-4 inline-block text-primary hover:underline">
          {t("Back to appointments", "العودة للمواعيد")}
        </Link>
      </div>
    );
  }

  if (appt.appointment_type !== "video") {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-muted-foreground">
          {t("This is an in-person appointment.", "هذا موعد في العيادة وليس عن بُعد.")}
        </p>
      </div>
    );
  }

  if (appt.status === "cancelled") {
    return (
      <div className="text-center py-20 px-4">
        <p className="text-muted-foreground">{t("This appointment has been cancelled.", "تم إلغاء هذا الموعد.")}</p>
      </div>
    );
  }

  const roomName = `Tabibi-${id}`;
  const displayName = encodeURIComponent(profile?.full_name ?? user?.email ?? "Guest");
  const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName=%22${displayName}%22&config.prejoinPageEnabled=true`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/appointments" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("Leave room", "مغادرة الغرفة")}
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-teal animate-pulse" />
            <Video className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">
              {t("Video consultation", "استشارة عن بُعد")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-black">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-[calc(100vh-57px)] border-0"
          title="Video consultation"
        />
      </div>
    </div>
  );
}
