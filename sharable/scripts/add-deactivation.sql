-- Add is_deactivated column to profiles table
ALTER TABLE profiles ADD COLUMN is_deactivated BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_deactivated ON profiles(is_deactivated);
