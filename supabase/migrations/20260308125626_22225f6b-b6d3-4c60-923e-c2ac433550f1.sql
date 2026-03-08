-- Add new referral statuses to support triage workflow
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'info_requested';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'converted_to_course';