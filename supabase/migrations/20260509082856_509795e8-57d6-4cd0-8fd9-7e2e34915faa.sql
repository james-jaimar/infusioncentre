
ALTER TABLE public.treatments
  ADD COLUMN IF NOT EXISTS checked_in_by uuid,
  ADD COLUMN IF NOT EXISTS checked_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS pre_assessment_by uuid,
  ADD COLUMN IF NOT EXISTS pre_assessment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS post_assessment_by uuid,
  ADD COLUMN IF NOT EXISTS post_assessment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS discharged_by uuid,
  ADD COLUMN IF NOT EXISTS discharged_at timestamptz;

-- Backfill: existing in-progress / completed treatments get sensible defaults
UPDATE public.treatments
SET checked_in_at = COALESCE(checked_in_at, started_at, created_at),
    pre_assessment_completed_at = COALESCE(pre_assessment_completed_at, started_at)
WHERE started_at IS NOT NULL;

UPDATE public.treatments
SET post_assessment_completed_at = COALESCE(post_assessment_completed_at, ended_at),
    discharged_at = COALESCE(discharged_at, ended_at)
WHERE ended_at IS NOT NULL;
