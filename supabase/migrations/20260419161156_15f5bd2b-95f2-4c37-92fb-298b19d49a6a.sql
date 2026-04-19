-- 1. Service category enum + column on appointment_types
DO $$ BEGIN
  CREATE TYPE public.service_category AS ENUM ('infusion', 'care_pathway');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.appointment_types
  ADD COLUMN IF NOT EXISTS service_category public.service_category NOT NULL DEFAULT 'infusion';

-- 2. Make total_sessions_planned nullable on treatment_courses (ongoing pathways)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='treatment_courses' AND column_name='total_sessions_planned'
      AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.treatment_courses ALTER COLUMN total_sessions_planned DROP NOT NULL;
  END IF;
END $$;

-- 3. Extend course_frequency enum with as_needed + custom_schedule
ALTER TYPE public.course_frequency ADD VALUE IF NOT EXISTS 'as_needed';
ALTER TYPE public.course_frequency ADD VALUE IF NOT EXISTS 'custom_schedule';