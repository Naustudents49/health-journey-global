import { useState } from "react";
import { Shield, X } from "lucide-react";

interface Props {
  open: boolean;
  doctorName: string;
  onCancel: () => void;
  onConfirm: (consents: {
    telemedicine_consent: boolean;
    data_processing_consent: boolean;
    recording_consent: boolean;
  }) => void;
  isSubmitting?: boolean;
}

export const CONSENT_TEXT_VERSION = "v1-2026";

export function PatientConsentModal({ open, doctorName, onCancel, onConfirm, isSubmitting }: Props) {
  const [tele, setTele] = useState(false);
  const [data, setData] = useState(false);
  const [rec, setRec] = useState(false);

  if (!open) return null;
  const canSubmit = tele && data && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-card shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute end-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">موافقة الكشف أون لاين</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            قبل حجز جلسة فيديو مع <strong>{doctorName}</strong> نحتاج موافقتك الصريحة.
          </p>

          <div className="mt-5 space-y-3 text-sm">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30">
              <input
                type="checkbox"
                checked={tele}
                onChange={(e) => setTele(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong>الموافقة على الكشف عن بُعد</strong> طبقاً للائحة نقابة الأطباء المصرية 2023.
                الكشف أون لاين لا يُغني عن الكشف الإكلينيكي عند الحاجة.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30">
              <input
                type="checkbox"
                checked={data}
                onChange={(e) => setData(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong>الموافقة على معالجة بياناتي الصحية</strong> طبقاً لقانون حماية البيانات
                الشخصية رقم 151/2020. تُحفظ البيانات بشكل آمن ولا تُشارك بدون إذني.
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/30">
              <input
                type="checkbox"
                checked={rec}
                onChange={(e) => setRec(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                <strong>(اختياري)</strong> الموافقة على تسجيل الجلسة لأغراض المتابعة الطبية فقط.
              </span>
            </label>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={() =>
                onConfirm({
                  telemedicine_consent: tele,
                  data_processing_consent: data,
                  recording_consent: rec,
                })
              }
              disabled={!canSubmit}
              className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? "جارٍ التأكيد..." : "أوافق وأكمل الحجز"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
