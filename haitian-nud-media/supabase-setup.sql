-- ========================================================
-- HAITIAN NUD MÉDIA - SQL COMPLET POUR SUPABASE
-- Projet : https://lcfnjxqademkrcocvtlo.supabase.co
-- Copier-coller TOUT ce bloc dans SQL Editor > Run
-- ========================================================
-- ⚠️  IMPORTANT AVANT D'EXECUTER:
-- 1. Supabase > Authentication > Providers > Email
--    → "Confirm email" = OFF (pour connexion instantanée)
-- 2. Supabase > Authentication > URL Configuration
--    → Site URL = https://haitiannud12345.vercel.app
--    → Redirect URLs = https://haitiannud12345.vercel.app/reset-password
-- ========================================================

-- 1. Accès schema public pour anon et authenticated
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 2. Créer les tables
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

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Trigger: créer automatiquement la ligne users quand compte Auth créé
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, plan, is_admin, blocked, age_confirmed, free_downloads_used, subscription_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'free',
    CASE WHEN NEW.email = 'dghaitiannud@gmail.com' THEN true ELSE false END,
    false,
    false,
    0,
    null
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    is_admin = CASE WHEN EXCLUDED.email = 'dghaitiannud@gmail.com' THEN true ELSE users.is_admin END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Activer RLS
ALTER TABLE users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE views             ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets           ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4b. Fonction helper is_admin() — évite la boucle infinie RLS
-- SECURITY DEFINER = cette fonction BYPASSE les policies RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Supprimer les anciennes policies (éviter les conflits)
DROP POLICY IF EXISTS "videos_public_read"    ON videos;
DROP POLICY IF EXISTS "videos_admin_all"      ON videos;
DROP POLICY IF EXISTS "users_self_read"       ON users;
DROP POLICY IF EXISTS "users_self_update"     ON users;
DROP POLICY IF EXISTS "users_admin_all"       ON users;
DROP POLICY IF EXISTS "users_insert_self"     ON users;
DROP POLICY IF EXISTS "comments_public_read"  ON comments;
DROP POLICY IF EXISTS "comments_insert"       ON comments;
DROP POLICY IF EXISTS "comments_admin_all"    ON comments;
DROP POLICY IF EXISTS "downloads_self_read"   ON downloads;
DROP POLICY IF EXISTS "downloads_insert"      ON downloads;
DROP POLICY IF EXISTS "downloads_admin_all"   ON downloads;
DROP POLICY IF EXISTS "views_public_read"     ON views;
DROP POLICY IF EXISTS "views_insert"          ON views;
DROP POLICY IF EXISTS "tickets_self_read"     ON tickets;
DROP POLICY IF EXISTS "tickets_self_insert"   ON tickets;
DROP POLICY IF EXISTS "tickets_admin_all"              ON tickets;
DROP POLICY IF EXISTS "push_subs_self_insert"          ON push_subscriptions;
DROP POLICY IF EXISTS "push_subs_self_read"            ON push_subscriptions;
DROP POLICY IF EXISTS "push_subs_self_delete"          ON push_subscriptions;
DROP POLICY IF EXISTS "push_subs_service_all"          ON push_subscriptions;

-- 6. Créer les policies RLS

-- VIDEOS
CREATE POLICY "videos_public_read" ON videos
  FOR SELECT USING (published = true);

CREATE POLICY "videos_admin_all" ON videos
  FOR ALL USING (public.is_admin());

-- USERS
CREATE POLICY "users_self_read" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_self_update" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "users_insert_self" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (public.is_admin());

-- COMMENTS
CREATE POLICY "comments_public_read" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "comments_admin_all" ON comments
  FOR ALL USING (public.is_admin());

-- DOWNLOADS
CREATE POLICY "downloads_self_read" ON downloads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "downloads_insert" ON downloads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "downloads_admin_all" ON downloads
  FOR ALL USING (public.is_admin());

-- VIEWS
CREATE POLICY "views_public_read" ON views
  FOR SELECT USING (true);

CREATE POLICY "views_insert" ON views
  FOR INSERT WITH CHECK (true);

-- TICKETS
CREATE POLICY "tickets_self_read" ON tickets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tickets_self_insert" ON tickets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_admin_all" ON tickets
  FOR ALL USING (public.is_admin());

-- PUSH SUBSCRIPTIONS
-- Anyone can insert their own subscription (anon or authenticated)
CREATE POLICY "push_subs_self_insert" ON push_subscriptions
  FOR INSERT WITH CHECK (true);

-- Users can read their own subscriptions
CREATE POLICY "push_subs_self_read" ON push_subscriptions
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Users can delete their own subscriptions
CREATE POLICY "push_subs_self_delete" ON push_subscriptions
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

-- Service role (api-server with SUPABASE_SERVICE_KEY) bypasses RLS automatically
-- But we add an admin policy just in case
CREATE POLICY "push_subs_admin_all" ON push_subscriptions
  FOR ALL USING (public.is_admin());

-- 7. Rendre dghaitiannud@gmail.com admin (si le compte existe déjà)
UPDATE users SET is_admin = true WHERE email = 'dghaitiannud@gmail.com';

-- 8. Vidéo de test
INSERT INTO videos (title, description, thumbnail_url, video_url, category, duration_sec, is_vip, published)
VALUES (
  'Vidéo de test',
  'Vidéo de démonstration pour tester la plateforme.',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'video',
  596,
  false,
  true
)
ON CONFLICT DO NOTHING;

-- 9. Vérification finale
SELECT 'TABLES' AS check, count(*) AS count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name IN ('users','videos','comments','downloads','views','tickets','push_subscriptions');
SELECT 'ADMIN EMAIL' AS check, email, is_admin FROM users WHERE email = 'dghaitiannud@gmail.com';
SELECT 'VIDEOS' AS check, count(*) AS count FROM videos;
SELECT 'PUSH SUBS TABLE' AS check, count(*) AS count FROM push_subscriptions;
