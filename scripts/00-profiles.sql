-- Create profiles table (must exist before communities tables)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  account_type TEXT DEFAULT 'personal',  -- 'personal' or 'brand'
  bio TEXT,                              -- Personal account biography
  description TEXT,                      -- Brand account description
  password_hash TEXT NOT NULL,
  date_of_birth DATE,                    -- Personal account date of birth
  gender TEXT,                           -- Personal account gender (Male/Female)
  since DATE,                            -- Brand account founding date
  org_type TEXT,                         -- Brand account type: 'Solo' or 'Organization'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at);
