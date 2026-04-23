-- Create profiles table (must exist before communities tables)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  sharable_id TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  password_hash TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_sharable_id_idx ON profiles(sharable_id);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);
