
-- Add 'checked_in' to treatment_status enum (pre_assessment, in_progress, post_assessment, completed already exist)
ALTER TYPE treatment_status ADD VALUE IF NOT EXISTS 'checked_in' BEFORE 'pre_assessment';
