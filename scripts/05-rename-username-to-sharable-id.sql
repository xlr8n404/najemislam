-- Migration: Ensure profiles table has sharable_id column
-- This aligns the app branding with "Sharable ID" instead of "username"

-- Check if username column exists and rename it to sharable_id
DO $$ 
BEGIN
  -- If username column exists, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='profiles' AND column_name='username'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN username TO sharable_id;
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
    ALTER TABLE profiles ADD CONSTRAINT profiles_sharable_id_key UNIQUE (sharable_id);
    DROP INDEX IF EXISTS profiles_username_idx;
    CREATE INDEX profiles_sharable_id_idx ON profiles(sharable_id);
  END IF;
END $$;

-- Ensure communities table has sharable_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name='communities'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name='communities' AND column_name='username'
    ) THEN
      ALTER TABLE communities RENAME COLUMN username TO sharable_id;
      DROP INDEX IF EXISTS idx_communities_username;
      CREATE INDEX idx_communities_sharable_id ON communities(sharable_id);
    END IF;
  END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN profiles.sharable_id IS 'User Sharable ID - unique identifier used for sharing and profile links';
