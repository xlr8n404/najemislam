-- Create comments table for post comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create comment_votes table for voting on comments
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS comment_votes_comment_id_idx ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS comment_votes_user_id_idx ON comment_votes(user_id);

-- Disable RLS for these tables since the app uses custom auth and server-side validation is handled in API routes
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;

-- Grant access to anon role (used by the frontend client)
GRANT ALL ON comments TO anon;
GRANT ALL ON comment_votes TO anon;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON comment_votes TO authenticated;
GRANT ALL ON comments TO service_role;
GRANT ALL ON comment_votes TO service_role;

