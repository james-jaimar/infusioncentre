
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit contact form"
  ON public.contact_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    name IS NOT NULL AND length(btrim(name)) BETWEEN 1 AND 200
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
    AND subject IS NOT NULL AND length(btrim(subject)) BETWEEN 1 AND 300
    AND message IS NOT NULL AND length(message) BETWEEN 1 AND 5000
    AND (phone IS NULL OR length(phone) <= 50)
  );

DROP POLICY IF EXISTS "Anyone can submit bookings" ON public.course_bookings;
CREATE POLICY "Anyone can submit bookings"
  ON public.course_bookings FOR INSERT TO anon, authenticated
  WITH CHECK (
    course_id IS NOT NULL
    AND participant_name IS NOT NULL AND length(btrim(participant_name)) BETWEEN 1 AND 200
    AND email IS NOT NULL AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' AND length(email) <= 320
    AND (phone IS NULL OR length(phone) <= 50)
    AND (organisation IS NULL OR length(organisation) <= 200)
    AND (notes IS NULL OR length(notes) <= 2000)
  );

DROP POLICY IF EXISTS "Authenticated can read form pdf pages metadata" ON storage.objects;
