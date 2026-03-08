-- Status dictionaries: configurable lookup for all entity statuses
CREATE TABLE public.status_dictionaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  status_key text NOT NULL,
  display_label text NOT NULL,
  description text,
  color text DEFAULT '#6b7280',
  display_order integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  is_terminal boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, status_key)
);

-- Status transitions: valid state changes per entity
CREATE TABLE public.status_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  from_status text NOT NULL,
  to_status text NOT NULL,
  required_role public.app_role,
  label text,
  auto_trigger text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, from_status, to_status)
);

-- RLS
ALTER TABLE public.status_dictionaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage status dictionaries" ON public.status_dictionaries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read status dictionaries" ON public.status_dictionaries FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage status transitions" ON public.status_transitions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read status transitions" ON public.status_transitions FOR SELECT TO authenticated USING (true);

-- Updated_at trigger
CREATE TRIGGER update_status_dictionaries_updated_at
  BEFORE UPDATE ON public.status_dictionaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: Referral statuses
INSERT INTO public.status_dictionaries (entity_type, status_key, display_label, color, display_order, is_default, is_terminal) VALUES
  ('referral', 'pending', 'Pending', '#f59e0b', 0, true, false),
  ('referral', 'under_review', 'Under Review', '#3b82f6', 1, false, false),
  ('referral', 'accepted', 'Accepted', '#10b981', 2, false, false),
  ('referral', 'info_requested', 'Info Requested', '#8b5cf6', 3, false, false),
  ('referral', 'rejected', 'Rejected', '#ef4444', 4, false, true),
  ('referral', 'cancelled', 'Cancelled', '#6b7280', 5, false, true);

-- Seed: Treatment Course statuses
INSERT INTO public.status_dictionaries (entity_type, status_key, display_label, color, display_order, is_default, is_terminal) VALUES
  ('treatment_course', 'draft', 'Draft', '#6b7280', 0, true, false),
  ('treatment_course', 'onboarding', 'Onboarding', '#f59e0b', 1, false, false),
  ('treatment_course', 'ready', 'Ready', '#3b82f6', 2, false, false),
  ('treatment_course', 'active', 'Active', '#10b981', 3, false, false),
  ('treatment_course', 'paused', 'Paused', '#f97316', 4, false, false),
  ('treatment_course', 'completing', 'Completing', '#8b5cf6', 5, false, false),
  ('treatment_course', 'completed', 'Completed', '#059669', 6, false, true),
  ('treatment_course', 'cancelled', 'Cancelled', '#ef4444', 7, false, true);

-- Seed: Appointment statuses
INSERT INTO public.status_dictionaries (entity_type, status_key, display_label, color, display_order, is_default, is_terminal) VALUES
  ('appointment', 'scheduled', 'Scheduled', '#3b82f6', 0, true, false),
  ('appointment', 'confirmed', 'Confirmed', '#10b981', 1, false, false),
  ('appointment', 'checked_in', 'Checked In', '#8b5cf6', 2, false, false),
  ('appointment', 'in_progress', 'In Progress', '#f59e0b', 3, false, false),
  ('appointment', 'completed', 'Completed', '#059669', 4, false, true),
  ('appointment', 'cancelled', 'Cancelled', '#ef4444', 5, false, true),
  ('appointment', 'no_show', 'No Show', '#6b7280', 6, false, true);

-- Seed: Treatment statuses
INSERT INTO public.status_dictionaries (entity_type, status_key, display_label, color, display_order, is_default, is_terminal) VALUES
  ('treatment', 'pending', 'Pending', '#f59e0b', 0, true, false),
  ('treatment', 'pre_assessment', 'Pre-Assessment', '#3b82f6', 1, false, false),
  ('treatment', 'in_progress', 'In Progress', '#8b5cf6', 2, false, false),
  ('treatment', 'post_assessment', 'Post-Assessment', '#6366f1', 3, false, false),
  ('treatment', 'completed', 'Completed', '#059669', 4, false, true),
  ('treatment', 'cancelled', 'Cancelled', '#ef4444', 5, false, true);

-- Seed: Referral transitions
INSERT INTO public.status_transitions (entity_type, from_status, to_status, label) VALUES
  ('referral', 'pending', 'under_review', 'Start Review'),
  ('referral', 'pending', 'rejected', 'Reject'),
  ('referral', 'under_review', 'accepted', 'Accept'),
  ('referral', 'under_review', 'info_requested', 'Request Info'),
  ('referral', 'under_review', 'rejected', 'Reject'),
  ('referral', 'info_requested', 'under_review', 'Info Received'),
  ('referral', 'info_requested', 'cancelled', 'Cancel'),
  ('referral', 'accepted', 'cancelled', 'Cancel');

-- Seed: Treatment Course transitions
INSERT INTO public.status_transitions (entity_type, from_status, to_status, label) VALUES
  ('treatment_course', 'draft', 'onboarding', 'Start Onboarding'),
  ('treatment_course', 'draft', 'cancelled', 'Cancel'),
  ('treatment_course', 'onboarding', 'ready', 'Mark Ready'),
  ('treatment_course', 'onboarding', 'cancelled', 'Cancel'),
  ('treatment_course', 'ready', 'active', 'Activate'),
  ('treatment_course', 'ready', 'cancelled', 'Cancel'),
  ('treatment_course', 'active', 'paused', 'Pause'),
  ('treatment_course', 'active', 'completing', 'Begin Completion'),
  ('treatment_course', 'active', 'cancelled', 'Cancel'),
  ('treatment_course', 'paused', 'active', 'Resume'),
  ('treatment_course', 'paused', 'cancelled', 'Cancel'),
  ('treatment_course', 'completing', 'completed', 'Complete');

-- Seed: Appointment transitions
INSERT INTO public.status_transitions (entity_type, from_status, to_status, label) VALUES
  ('appointment', 'scheduled', 'confirmed', 'Confirm'),
  ('appointment', 'scheduled', 'cancelled', 'Cancel'),
  ('appointment', 'scheduled', 'no_show', 'No Show'),
  ('appointment', 'confirmed', 'checked_in', 'Check In'),
  ('appointment', 'confirmed', 'cancelled', 'Cancel'),
  ('appointment', 'confirmed', 'no_show', 'No Show'),
  ('appointment', 'checked_in', 'in_progress', 'Start'),
  ('appointment', 'in_progress', 'completed', 'Complete');

-- Seed: Treatment transitions
INSERT INTO public.status_transitions (entity_type, from_status, to_status, label) VALUES
  ('treatment', 'pending', 'pre_assessment', 'Begin Pre-Assessment'),
  ('treatment', 'pending', 'cancelled', 'Cancel'),
  ('treatment', 'pre_assessment', 'in_progress', 'Start Treatment'),
  ('treatment', 'in_progress', 'post_assessment', 'Begin Post-Assessment'),
  ('treatment', 'in_progress', 'cancelled', 'Cancel'),
  ('treatment', 'post_assessment', 'completed', 'Complete');
