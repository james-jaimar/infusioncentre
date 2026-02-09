
-- Training courses table
CREATE TABLE public.training_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration_hours INTEGER,
  max_participants INTEGER DEFAULT 8,
  includes TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;

-- Anyone can view active courses
CREATE POLICY "Anyone can view active courses" ON public.training_courses
  FOR SELECT USING (is_active = true);

-- Admins can manage courses
CREATE POLICY "Admins can manage courses" ON public.training_courses
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Course booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Course bookings table
CREATE TABLE public.course_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.training_courses(id),
  participant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  organisation TEXT,
  preferred_dates TEXT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.course_bookings ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a booking (public form)
CREATE POLICY "Anyone can submit bookings" ON public.course_bookings
  FOR INSERT WITH CHECK (true);

-- Admins can manage all bookings
CREATE POLICY "Admins can manage bookings" ON public.course_bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Seed default courses
INSERT INTO public.training_courses (name, description, price, duration_hours, max_participants, includes) VALUES
  ('IV Line Insertion Training', 'Comprehensive one-day course for healthcare professionals on peripheral IV cannulation techniques. Combines theoretical knowledge with extensive practical training using simulation models.', 2500.00, 8, 8, ARRAY['Certificate of Competency', 'CPD Points', 'Course Materials', 'Simulation Practice', 'Competency Assessment']),
  ('Anaphylaxis Training', 'Essential half-day course on the recognition and management of anaphylaxis. Learn emergency protocols, adrenaline administration, and patient monitoring.', 1500.00, 4, 12, ARRAY['Certificate of Completion', 'CPD Points', 'Course Materials', 'Practical Scenarios']);

-- Triggers for updated_at
CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_bookings_updated_at
  BEFORE UPDATE ON public.course_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
