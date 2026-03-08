-- Add converted_to_course status dictionary entry
INSERT INTO public.status_dictionaries (entity_type, status_key, display_label, description, color, display_order, is_terminal, is_default, is_active)
VALUES ('referral', 'converted_to_course', 'Converted to Course', 'Referral has been converted to a treatment course', '#10b981', 60, true, false, true)
ON CONFLICT DO NOTHING;

-- Add transition: accepted → converted_to_course
INSERT INTO public.status_transitions (entity_type, from_status, to_status, label, required_role, auto_trigger)
VALUES ('referral', 'accepted', 'converted_to_course', 'Convert to Course', 'admin', 'course_created')
ON CONFLICT DO NOTHING;