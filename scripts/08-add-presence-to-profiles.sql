-- Add presence columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline';

-- Create index for faster presence queries
CREATE INDEX IF NOT EXISTS profiles_last_seen_idx ON profiles(last_seen);
