-- Add identity_tag column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_tag TEXT;

-- Create index for identity_tag
CREATE INDEX IF NOT EXISTS profiles_identity_tag_idx ON profiles(identity_tag);
