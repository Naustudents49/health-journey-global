
CREATE TABLE public.specialties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Specialties viewable by everyone" ON public.specialties FOR SELECT USING (true);

INSERT INTO public.specialties (name_ar, name_en, slug, icon) VALUES
('طب عام', 'General Practice', 'general', 'Stethoscope'),
('طب أطفال', 'Pediatrics', 'pediatrics', 'Baby'),
('أمراض القلب', 'Cardiology', 'cardiology', 'Heart'),
('أمراض جلدية', 'Dermatology', 'dermatology', 'Sparkles'),
('عظام', 'Orthopedics', 'orthopedics', 'Bone'),
('نساء وتوليد', 'Obstetrics & Gynecology', 'gynecology', 'Baby'),
('أنف وأذن وحنجرة', 'ENT', 'ent', 'Ear'),
('عيون', 'Ophthalmology', 'ophthalmology', 'Eye'),
('أسنان', 'Dentistry', 'dentistry', 'Smile'),
('باطنة', 'Internal Medicine', 'internal', 'Activity'),
('نفسية', 'Psychiatry', 'psychiatry', 'Brain'),
('مخ وأعصاب', 'Neurology', 'neurology', 'Brain');

CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  appointment_type TEXT NOT NULL DEFAULT 'in_person',
  status TEXT NOT NULL DEFAULT 'pending',
  fee NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = patient_id OR id = doctor_id));

CREATE POLICY "Patients create appointments" ON public.appointments FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = patient_id));

CREATE POLICY "Doctors and patients update appointments" ON public.appointments FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = patient_id OR id = doctor_id));

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  appointment_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(patient_id, doctor_id, appointment_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Patients create own reviews" ON public.reviews FOR INSERT
WITH CHECK (auth.uid() IN (SELECT user_id FROM profiles WHERE id = patient_id));
CREATE POLICY "Patients update own reviews" ON public.reviews FOR UPDATE
USING (auth.uid() IN (SELECT user_id FROM profiles WHERE id = patient_id));

CREATE INDEX idx_appointments_doctor ON public.appointments(doctor_id, scheduled_at);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id, scheduled_at);
CREATE INDEX idx_reviews_doctor ON public.reviews(doctor_id);
