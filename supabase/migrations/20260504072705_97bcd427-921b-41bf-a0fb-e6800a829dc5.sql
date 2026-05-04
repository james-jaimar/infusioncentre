WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY scheduled_start) AS rn
  FROM appointments
  WHERE treatment_course_id = 'c3526ef1-5e1e-46a3-97e6-a8b5144948ff'
    AND status NOT IN ('cancelled', 'rescheduled')
)
UPDATE appointments a
SET session_number = r.rn
FROM ranked r
WHERE a.id = r.id;