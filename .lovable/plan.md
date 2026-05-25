## الهدف
1. **عرض الأسعار بعملة المريض** حسب موقعه الجغرافي (geo-IP) مع تحويل من العملة الأصلية للطبيب.
2. **ملف طبيب موسّع**: بيانات شخصية كاملة + عيادات متعددة + مواقع (خريطة) + أوقات تواجد لكل عيادة.
3. **بحث المريض**: حسب التخصص، المدينة، القرب الجغرافي، اليوم/الوقت المتاح، السعر.

---

## 1. تعدد العملات (Multi-currency)

**Backend:**
- جدول `exchange_rates` (currency_code, rate_to_usd, updated_at) — يُحدَّث يومياً عبر cron أو server fn يدوي.
- إضافة `currency` للـ `doctor_details` (default: 'EGP') ليحدد الطبيب عملته.

**Frontend:**
- Hook `useUserCurrency()` يكتشف العملة عبر `Intl.NumberFormat` + `navigator.language` كـ fallback، أو عبر geo-IP خفيف (مثل `ipapi.co` مجاناً، أو من Cloudflare headers `cf-ipcountry` لو متاح).
- Helper `formatPrice(amount, fromCurrency, toCurrency)` يستخدم جدول الأسعار.
- يعرض السعر الأصلي + المحوّل: `300 EGP (~$6.10)`.

---

## 2. ملف الطبيب الموسّع

**Migration:**
- توسعة `doctor_details`: `languages[]`, `education`, `certifications[]`, `currency`, `about_ar/en`, `years_experience`.
- جدول جديد `clinics`:
  - `doctor_id`, `name`, `address`, `city`, `country`, `lat`, `lng`, `phone`, `consultation_fee`, `currency`, `is_primary`.
- جدول جديد `clinic_schedules`:
  - `clinic_id`, `day_of_week` (0-6), `start_time`, `end_time`, `slot_duration_minutes`.

**RLS:** الطبيب يدير عياداته/جدوله؛ القراءة عامة.

**صفحات:**
- `/dashboard/doctor/profile` — تحرير البيانات الكاملة.
- `/dashboard/doctor/clinics` — إضافة/تعديل/حذف عيادات، اختيار موقع على خريطة Google Maps، تحديد أوقات لكل يوم.
- `/doctor/$id` — عرض كل العيادات + الخريطة + الجدول الأسبوعي.

**خرائط:** سأستخدم Google Maps Platform connector (موصول).

---

## 3. بحث متقدم للمريض

**صفحة `/doctors` محدّثة:**
- فلاتر إضافية: نطاق سعري، اليوم المتاح، "قريب مني" (geolocation API + حساب المسافة).
- ترتيب: الأقرب، الأرخص، الأعلى تقييماً.
- بحث جغرافي عبر Postgres function تحسب المسافة بصيغة Haversine.

**Server function:** `searchDoctors({ specialty, city, lat?, lng?, maxDistanceKm?, dayOfWeek?, minFee?, maxFee? })`.

---

## التنفيذ على دفعات

**الدفعة 1 (هذه الرسالة):** Migration للجداول الجديدة + توسعة doctor_details + بذر exchange_rates ببعض العملات الشائعة.

**الدفعة 2:** Hook العملة + helper التنسيق + تحديث عرض الأسعار في `/doctors` و `/doctor/$id`.

**الدفعة 3:** صفحات إدارة الطبيب (clinics + schedules) مع خريطة.

**الدفعة 4:** البحث المتقدم (geo + schedule + price).

---

## ملاحظات تقنية (للمراجعة)
- تفعيل Google Maps connector لازم — لو مش مفعّل هطلب التفعيل في الدفعة 3.
- أسعار الصرف ثابتة في الجدول، تحديثها يدوي أو عبر API لاحقاً (مثل exchangerate.host).
- الـ geo-IP المجاني (`ipapi.co`) محدود؛ بديل أفضل: Cloudflare `cf-ipcountry` لو الموقع منشور على Lovable.

---

موافق نبدأ بالدفعة 1 (Migration)؟ أو تحب تعدّل ترتيب الدفعات؟
