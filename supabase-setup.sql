-- HAITIAN NUD - Supabase Schema
-- Run this in Supabase SQL Editor

-- Users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  plan TEXT DEFAULT 'free',
  is_admin BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  age_confirmed BOOLEAN DEFAULT false,
  free_downloads_used INTEGER DEFAULT 0,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  category TEXT DEFAULT 'general',
  duration_sec INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_vip BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views table
CREATE TABLE IF NOT EXISTS views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Videos: public read published
CREATE POLICY "videos_public_read" ON videos
  FOR SELECT USING (published = true);

-- Videos: admin full access
CREATE POLICY "videos_admin_all" ON videos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Users: self read
CREATE POLICY "users_self_read" ON users
  FOR SELECT USING (id = auth.uid());

-- Users: admin full access
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );

-- Comments: public read
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (true);

-- Comments: insert (signed-in)
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Downloads: self read
CREATE POLICY "downloads_self_read" ON downloads
  FOR SELECT USING (user_id = auth.uid());

-- Downloads: self insert
CREATE POLICY "downloads_insert" ON downloads
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Views: public read
CREATE POLICY "views_public_read" ON views
  FOR SELECT USING (true);

-- Views: insert (anyone)
CREATE POLICY "views_insert" ON views
  FOR INSERT WITH CHECK (true);

-- Tickets: self read
CREATE POLICY "tickets_self_read" ON tickets
  FOR SELECT USING (user_id = auth.uid());

-- Tickets: self insert
CREATE POLICY "tickets_self_insert" ON tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tickets: admin full access
CREATE POLICY "tickets_admin_all" ON tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true)
  );
