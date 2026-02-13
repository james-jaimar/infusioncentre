
-- Add is_approved column to profiles
ALTER TABLE public.profiles ADD COLUMN is_approved boolean NOT NULL DEFAULT false;

-- Set all existing profiles to approved
UPDATE public.profiles SET is_approved = true;

-- Update the handle_new_user trigger to keep is_approved = false for self-registrations (default)
-- No change needed since default is false

-- Update the handle_new_user function to NOT set is_approved (it stays false by default)
-- The existing function doesn't touch is_approved, so it will default to false. Good.
