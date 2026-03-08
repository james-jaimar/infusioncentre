-- Audit trigger function: logs status changes on any table to audit_log
CREATE OR REPLACE FUNCTION public.log_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (user_id, action, details)
    VALUES (
      auth.uid(),
      TG_ARGV[0] || '.status_changed',
      jsonb_build_object(
        'entity_type', TG_ARGV[0],
        'entity_id', NEW.id,
        'from_status', OLD.status::text,
        'to_status', NEW.status::text,
        'changed_at', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Attach to treatment_courses
CREATE TRIGGER trg_audit_treatment_course_status
  AFTER UPDATE ON treatment_courses
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change('treatment_course');

-- Attach to referrals
CREATE TRIGGER trg_audit_referral_status
  AFTER UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change('referral');

-- Attach to appointments
CREATE TRIGGER trg_audit_appointment_status
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change('appointment');

-- Attach to treatments
CREATE TRIGGER trg_audit_treatment_status
  AFTER UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION log_status_change('treatment');