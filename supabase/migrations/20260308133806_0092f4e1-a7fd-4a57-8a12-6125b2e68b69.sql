
-- Phase 4: Extended chair states and reschedule tracking

-- 1. Add chair_status enum
CREATE TYPE public.chair_status AS ENUM (
  'available', 'occupied', 'cleaning', 'blocked', 'reserved', 'out_of_service'
);

-- 2. Add status column to treatment_chairs
ALTER TABLE public.treatment_chairs 
  ADD COLUMN status public.chair_status NOT NULL DEFAULT 'available';

-- 3. Add reschedule tracking columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN reschedule_reason text,
  ADD COLUMN rescheduled_from_id uuid REFERENCES public.appointments(id),
  ADD COLUMN session_number integer;

-- 4. Add appointment_status enum value 'rescheduled' if not present
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'rescheduled';
