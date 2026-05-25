import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { PlacePicker } from "@/components/maps/PlacePicker";
import { ClinicMap } from "@/components/maps/ClinicMap";
import { Building2, Plus, Trash2, Save, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Clinic {
  id: string;
  doctor_id: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  consultation_fee: number | null;
  currency: string | null;
  is_primary: boolean | null;
}

interface Schedule {
  id: string;
  clinic_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function ClinicsManager({ doctorDetailsId }: { doctorDetailsId: string }) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [addingClinic, setAddingClinic] = useState(false);

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ["clinics", doctorDetailsId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinics")
        .select("*")
        .eq("doctor_id", doctorDetailsId)
        .order("is_primary", { ascending: false });
      if (error) throw error;
      return data as Clinic[];
    },
  });

  const createClinic = useMutation({
    mutationFn: async (payload: Partial<Clinic>) => {
      const { error } = await supabase.from("clinics").insert({
        doctor_id: doctorDetailsId,
        name: payload.name ?? t("New Clinic", "عيادة جديدة"),
        address: payload.address ?? null,
        city: payload.city ?? null,
        country: payload.country ?? "Egypt",
        lat: payload.lat ?? null,
        lng: payload.lng ?? null,
        is_primary: clinics.length === 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Clinic added", "تمت إضافة العيادة"));
      setAddingClinic(false);
      queryClient.invalidateQueries({ queryKey: ["clinics", doctorDetailsId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteClinic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("Clinic deleted", "تم حذف العيادة"));
      queryClient.invalidateQueries({ queryKey: ["clinics", doctorDetailsId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="bg-card border border-border rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            {t("Clinics & Schedules", "العيادات والمواعيد")}
          </h2>
        </div>
        <button
          onClick={() => setAddingClinic(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t("Add clinic", "إضافة عيادة")}
        </button>
      </div>

      {addingClinic && (
        <NewClinicForm
          onCancel={() => setAddingClinic(false)}
          onSave={(p) => createClinic.mutate(p)}
          pending={createClinic.isPending}
        />
      )}

      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : clinics.length === 0 && !addingClinic ? (
        <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          {t("No clinics yet. Add your first location.", "لا توجد عيادات بعد. أضف موقعك الأول.")}
        </p>
      ) : (
        <div className="space-y-4">
          {clinics.map((c) => (
            <ClinicCard
              key={c.id}
              clinic={c}
              days={language === "ar" ? DAYS_AR : DAYS_EN}
              onDelete={() => deleteClinic.mutate(c.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NewClinicForm({
  onCancel,
  onSave,
  pending,
}: {
  onCancel: () => void;
  onSave: (p: Partial<Clinic>) => void;
  pending: boolean;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [picked, setPicked] = useState<{
    address: string;
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  } | null>(null);

  return (
    <div className="border border-border rounded-xl p-4 mb-4 bg-muted/20">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t("Clinic name", "اسم العيادة")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("e.g. Heliopolis Branch", "مثال: فرع مصر الجديدة")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t("Address (search)", "العنوان (ابحث)")}
          </label>
          <PlacePicker
            placeholder={t("Type address...", "اكتب العنوان...")}
            onPick={setPicked}
          />
        </div>
      </div>
      {picked && (
        <div className="mt-3">
          <ClinicMap markers={[{ lat: picked.lat, lng: picked.lng }]} className="h-40" />
          <p className="mt-2 text-xs text-muted-foreground">{picked.address}</p>
        </div>
      )}
      <div className="mt-3 flex gap-2">
        <button
          onClick={() =>
            onSave({
              name: name || t("Main Clinic", "العيادة الرئيسية"),
              address: picked?.address ?? null,
              lat: picked?.lat ?? null,
              lng: picked?.lng ?? null,
              city: picked?.city ?? null,
              country: picked?.country ?? null,
            })
          }
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Save clinic", "حفظ العيادة")}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
        >
          {t("Cancel", "إلغاء")}
        </button>
      </div>
    </div>
  );
}

function ClinicCard({
  clinic,
  days,
  onDelete,
}: {
  clinic: Clinic;
  days: string[];
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: schedules = [] } = useQuery({
    queryKey: ["schedules", clinic.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_schedules")
        .select("*")
        .eq("clinic_id", clinic.id)
        .order("day_of_week");
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const addSlot = useMutation({
    mutationFn: async (payload: Omit<Schedule, "id">) => {
      const { error } = await supabase.from("clinic_schedules").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules", clinic.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinic_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["schedules", clinic.id] }),
  });

  const [day, setDay] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  return (
    <div className="border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{clinic.name}</h3>
          {clinic.address && <p className="text-sm text-muted-foreground mt-0.5">{clinic.address}</p>}
        </div>
        <button
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg"
          aria-label={t("Delete", "حذف")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {clinic.lat != null && clinic.lng != null && (
        <ClinicMap
          markers={[{ lat: clinic.lat, lng: clinic.lng, title: clinic.name }]}
          className="h-36 mt-3"
        />
      )}

      <div className="mt-4">
        <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
          <Clock className="h-4 w-4" /> {t("Weekly schedule", "الجدول الأسبوعي")}
        </p>
        {schedules.length === 0 ? (
          <p className="text-xs text-muted-foreground mb-2">
            {t("No working hours yet.", "لم تُضف أوقات بعد.")}
          </p>
        ) : (
          <ul className="space-y-1 mb-3">
            {schedules.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-sm bg-muted/30 px-3 py-1.5 rounded-lg">
                <span>
                  <span className="font-medium">{days[s.day_of_week]}</span> · {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)}
                </span>
                <button onClick={() => delSlot.mutate(s.id)} className="text-destructive hover:opacity-80">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-2">
          <select
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          >
            {days.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <input
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          <button
            onClick={() =>
              addSlot.mutate({
                clinic_id: clinic.id,
                day_of_week: day,
                start_time: start,
                end_time: end,
                slot_duration_minutes: 30,
              })
            }
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> {t("Add slot", "إضافة")}
          </button>
        </div>
      </div>
    </div>
  );
}
