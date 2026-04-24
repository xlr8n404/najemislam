-- Create posts table with post_number field
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  post_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id and post_number for efficient lookups
CREATE INDEX IF NOT EXISTS posts_user_id_post_number_idx ON posts(user_id, post_number DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_created_at_idx ON posts(user_id, created_at DESC);

-- Create a function to auto-increment post_number
CREATE OR REPLACE FUNCTION increment_post_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.post_number := (
    SELECT COALESCE(MAX(post_number), 0) + 1
    FROM posts
    WHERE user_id = NEW.user_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment post_number
DROP TRIGGER IF EXISTS posts_increment_post_number ON posts;
CREATE TRIGGER posts_increment_post_number
BEFORE INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION increment_post_number();
