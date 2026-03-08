
-- Add 'draft' to referral_status enum (must be in its own transaction)
ALTER TYPE public.referral_status ADD VALUE IF NOT EXISTS 'draft';
