-- ============================================================
-- STORIES FEATURE — run this in Supabase SQL Editor
-- Safe to run even if tables already exist
-- ============================================================

-- 1. stories table — create fresh or add missing columns
CREATE TABLE IF NOT EXISTS stories (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content              TEXT DEFAULT '',
  bg_color             TEXT DEFAULT '#18181b',
  photo_url            TEXT,
  likes_count          INTEGER DEFAULT 0,
  comments_count       INTEGER DEFAULT 0,
  reposts_count        INTEGER DEFAULT 0,
  reposted_id          UUID,
  reposted_at          TIMESTAMPTZ,
  reposted_by_user_id  UUID,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if the table already existed with fewer columns
ALTER TABLE stories ADD COLUMN IF NOT EXISTS content             TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS bg_color            TEXT DEFAULT '#18181b';
ALTER TABLE stories ADD COLUMN IF NOT EXISTS photo_url           TEXT;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS likes_count         INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS comments_count      INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reposts_count       INTEGER DEFAULT 0;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reposted_id         UUID;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reposted_at         TIMESTAMPTZ;
ALTER TABLE stories ADD COLUMN IF NOT EXISTS reposted_by_user_id UUID;

-- 2. story_likes
CREATE TABLE IF NOT EXISTS story_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- 3. story_comments
CREATE TABLE IF NOT EXISTS story_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. story_reposts
CREATE TABLE IF NOT EXISTS story_reposts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- 5. story_saves
CREATE TABLE IF NOT EXISTS story_saves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  story_id   UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, story_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS stories_user_id_idx     ON stories(user_id);
CREATE INDEX IF NOT EXISTS stories_created_at_idx  ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS story_saves_user_id_idx ON story_saves(user_id);

-- Enable RLS
ALTER TABLE stories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_likes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_reposts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_saves    ENABLE ROW LEVEL SECURITY;

-- RLS Policies (DROP first to avoid duplicate errors)
DROP POLICY IF EXISTS "stories_authenticated_all"       ON stories;
DROP POLICY IF EXISTS "stories_anon_read"               ON stories;
DROP POLICY IF EXISTS "story_likes_authenticated_all"   ON story_likes;
DROP POLICY IF EXISTS "story_comments_authenticated_all" ON story_comments;
DROP POLICY IF EXISTS "story_reposts_authenticated_all" ON story_reposts;
DROP POLICY IF EXISTS "story_saves_authenticated_all"   ON story_saves;
DROP POLICY IF EXISTS "story_saves_anon_read"           ON story_saves;

CREATE POLICY "stories_authenticated_all"        ON stories        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "stories_anon_read"                ON stories        FOR SELECT TO anon USING (true);
CREATE POLICY "story_likes_authenticated_all"    ON story_likes    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "story_comments_authenticated_all" ON story_comments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "story_reposts_authenticated_all"  ON story_reposts  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "story_saves_authenticated_all"    ON story_saves    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "story_saves_anon_read"            ON story_saves    FOR SELECT TO anon USING (true);

-- ============================================================
-- STORAGE — create 'stories' bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories',
  'stories',
  true,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "stories_bucket_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "stories_bucket_public_read"          ON storage.objects;
DROP POLICY IF EXISTS "stories_bucket_owner_delete"         ON storage.objects;

CREATE POLICY "stories_bucket_authenticated_upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories');

CREATE POLICY "stories_bucket_public_read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'stories');

CREATE POLICY "stories_bucket_owner_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
