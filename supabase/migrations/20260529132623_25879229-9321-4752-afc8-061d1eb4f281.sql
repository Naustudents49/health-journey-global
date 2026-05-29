-- Medical attachments storage bucket + RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-attachments',
  'medical-attachments',
  false,
  20971520,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','application/pdf']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "patient_upload_own_attachment" ON storage.objects;
CREATE POLICY "patient_upload_own_attachment"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'medical-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "doctor_upload_patient_attachment" ON storage.objects;
CREATE POLICY "doctor_upload_patient_attachment"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'medical-attachments'
    AND EXISTS (
      SELECT 1 FROM public.medical_records mr
      JOIN public.profiles dp ON dp.id = mr.doctor_profile_id
      WHERE dp.user_id = auth.uid()
        AND mr.patient_profile_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "patient_read_own_attachment" ON storage.objects;
CREATE POLICY "patient_read_own_attachment"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "doctor_read_patient_attachment" ON storage.objects;
CREATE POLICY "doctor_read_patient_attachment"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND EXISTS (
      SELECT 1 FROM public.medical_records mr
      JOIN public.profiles dp ON dp.id = mr.doctor_profile_id
      WHERE dp.user_id = auth.uid()
        AND mr.patient_profile_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "admin_read_attachments" ON storage.objects;
CREATE POLICY "admin_read_attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "patient_delete_own_attachment" ON storage.objects;
CREATE POLICY "patient_delete_own_attachment"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'medical-attachments'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM public.profiles WHERE user_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin')
    )
  );