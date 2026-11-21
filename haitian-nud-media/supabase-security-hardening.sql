-- DADINIO security hardening migration
-- Apply ONCE to the existing Supabase/Postgres database after reviewing the current schema.
-- This migration does not rotate or modify any API keys or .env values.

BEGIN;

-- The admin predicate runs with the function owner's privileges to avoid recursive RLS checks.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND is_admin IS TRUE
      AND COALESCE(blocked, FALSE) IS FALSE
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Remove any older permissive policies on the core application tables before
-- recreating a known least-privilege policy set.
DO $core$
DECLARE
  table_name TEXT;
  policy_record RECORD;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'videos', 'comments', 'downloads', 'views',
    'tickets', 'push_subscriptions'
  ] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', policy_record.policyname, table_name);
      END LOOP;
    END IF;
  END LOOP;
END;
$core$;

-- USERS: self read/update (the trigger above restricts which columns may change),
-- and full access only for an active administrator.
CREATE POLICY "users_self_read" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

CREATE POLICY "users_self_update" ON public.users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "users_admin_all" ON public.users
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- VIDEOS: published catalog for everyone; administrator CRUD.
CREATE POLICY "videos_public_read" ON public.videos
FOR SELECT TO anon, authenticated
USING (published IS TRUE);

CREATE POLICY "videos_admin_all" ON public.videos
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- COMMENTS: public read, owner-only inserts, admin moderation.
CREATE POLICY "comments_public_read" ON public.comments
FOR SELECT TO anon, authenticated
USING (TRUE);

CREATE POLICY "comments_admin_all" ON public.comments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- DOWNLOADS: users can read their own download history; inserts are only via RPC.
CREATE POLICY "downloads_self_read" ON public.downloads
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "downloads_admin_all" ON public.downloads
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- VIEWS: public read only; counters are updated through the database RPC.
CREATE POLICY "views_public_read" ON public.views
FOR SELECT TO anon, authenticated
USING (TRUE);
CREATE POLICY "views_insert_limited" ON public.views
FOR INSERT TO anon, authenticated
WITH CHECK (
  public.can_insert_view(video_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);

-- TICKETS: user-owned tickets and administrator support access.
CREATE POLICY "tickets_self_read" ON public.tickets
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "tickets_self_insert" ON public.tickets
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_admin_all" ON public.tickets
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- Admin status must come from the database, not from an email string supplied by the browser.
-- Preserve the current configured administrator if their account already exists.
UPDATE public.users
SET is_admin = TRUE
WHERE lower(email) = lower('dghaitiannud@gmail.com');

-- Ordinary users may update display_name and confirm their age, but never their role,
-- plan, block state, quota, subscription dates, email, or identity.
CREATE OR REPLACE FUNCTION public.guard_user_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.is_admin IS DISTINCT FROM OLD.is_admin
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.blocked IS DISTINCT FROM OLD.blocked
     OR NEW.free_downloads_used IS DISTINCT FROM OLD.free_downloads_used
     OR NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'USER_PRIVILEGED_FIELDS_PROTECTED'
      USING ERRCODE = '42501';
  END IF;

  IF OLD.age_confirmed IS TRUE AND NEW.age_confirmed IS DISTINCT FROM OLD.age_confirmed THEN
    RAISE EXCEPTION 'AGE_CONFIRMATION_CANNOT_BE_REVERSED'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_privileged_fields ON public.users;
CREATE TRIGGER guard_user_privileged_fields
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_privileged_fields();

-- Users are created by the auth.users trigger; do not let clients create their own
-- profile rows with privileged values.
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_self_insert" ON public.users;

-- Fix comment ownership; previously any logged-in user could insert a comment
-- with another user's user_id.
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
CREATE POLICY "comments_insert_own"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND char_length(trim(body)) BETWEEN 1 AND 500
  AND COALESCE(char_length(display_name), 0) <= 100
);

-- Push subscriptions can only be registered, read, and deleted by their owner.
-- The Node API uses the service role and therefore continues to manage delivery.
DROP POLICY IF EXISTS "push_subs_self_insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_self_read" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_self_delete" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_admin_all" ON public.push_subscriptions;
DROP POLICY IF EXISTS "push_subs_service_all" ON public.push_subscriptions;

CREATE POLICY "push_subs_insert_own"
ON public.push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_read_own"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "push_subs_delete_own"
ON public.push_subscriptions
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Free-download quota is enforced atomically inside the database RPC, not by
-- client-supplied isVip/freeDownloadsUsed/userId values.
DROP POLICY IF EXISTS "downloads_insert" ON public.downloads;
DROP POLICY IF EXISTS "downloads_self_insert" ON public.downloads;

CREATE OR REPLACE FUNCTION public.request_video_download(p_video_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user RECORD;
  v_video RECORD;
  v_has_vip BOOLEAN;
  v_remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE = '28000';
  END IF;

  SELECT id, plan, is_admin, blocked, free_downloads_used, subscription_ends_at
  INTO v_user
  FROM public.users
  WHERE id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_PROFILE_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_user.blocked, FALSE) THEN
    RAISE EXCEPTION 'ACCOUNT_BLOCKED' USING ERRCODE = '42501';
  END IF;

  SELECT id, video_url, is_vip
  INTO v_video
  FROM public.videos
  WHERE id = p_video_id
    AND (published IS TRUE OR v_user.is_admin IS TRUE);

  IF NOT FOUND OR v_video.video_url IS NULL OR v_video.video_url = '' THEN
    RAISE EXCEPTION 'VIDEO_NOT_AVAILABLE' USING ERRCODE = 'P0002';
  END IF;

  v_has_vip := v_user.is_admin IS TRUE
    OR (
      v_user.plan = 'vip'
      AND (v_user.subscription_ends_at IS NULL OR v_user.subscription_ends_at > now())
    );

  IF v_video.is_vip IS TRUE AND NOT v_has_vip THEN
    RAISE EXCEPTION 'VIP_REQUIRED' USING ERRCODE = '42501';
  END IF;

  IF v_has_vip THEN
    v_remaining := -1;
  ELSE
    IF COALESCE(v_user.free_downloads_used, 0) >= 3 THEN
      RAISE EXCEPTION 'DOWNLOAD_LIMIT_REACHED' USING ERRCODE = '42501';
    END IF;

    UPDATE public.users
    SET free_downloads_used = COALESCE(free_downloads_used, 0) + 1
    WHERE id = v_user.id
    RETURNING 3 - free_downloads_used INTO v_remaining;
  END IF;

  INSERT INTO public.downloads (user_id, video_id)
  VALUES (v_user.id, v_video.id);

  RETURN jsonb_build_object(
    'url', v_video.video_url,
    'remaining', v_remaining
  );
END;
$$;

REVOKE ALL ON FUNCTION public.request_video_download(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_video_download(UUID) TO authenticated;

-- Hide the raw video_url column from direct REST table reads. The catalog view below
-- only reveals a VIP URL to an active VIP member or an administrator.
REVOKE SELECT ON TABLE public.videos FROM anon, authenticated;
GRANT SELECT (
  id,
  title,
  description,
  thumbnail_url,
  category,
  duration_sec,
  views,
  is_vip,
  published,
  created_at
) ON TABLE public.videos TO anon, authenticated;

CREATE OR REPLACE VIEW public.video_catalog
WITH (security_barrier = TRUE)
AS
SELECT
  v.id,
  v.title,
  v.description,
  v.thumbnail_url,
  CASE
    WHEN v.is_vip IS NOT TRUE
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.id = auth.uid()
          AND COALESCE(u.blocked, FALSE) IS FALSE
          AND (
            u.is_admin IS TRUE
            OR (
              u.plan = 'vip'
              AND (u.subscription_ends_at IS NULL OR u.subscription_ends_at > now())
            )
          )
      )
    THEN v.video_url
    ELSE NULL
  END AS video_url,
  v.category,
  v.duration_sec,
  v.views,
  v.is_vip,
  v.published,
  v.created_at
FROM public.videos v
WHERE v.published IS TRUE OR public.is_admin();

REVOKE ALL ON public.video_catalog FROM PUBLIC;
GRANT SELECT ON public.video_catalog TO anon, authenticated;

-- Tables used by newer frontend modules are not present in the legacy bootstrap
-- files. Harden them when they exist, without assuming they are installed everywhere.
DO $optional$
DECLARE
  policy_record RECORD;
BEGIN
  IF to_regclass('public.vip_requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.vip_requests ENABLE ROW LEVEL SECURITY';
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'vip_requests'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.vip_requests', policy_record.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "vip_requests_select_own_or_admin" ON public.vip_requests
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_admin())';

    EXECUTE 'CREATE POLICY "vip_requests_insert_own_pending" ON public.vip_requests
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid() AND status = ''pending'')';

    EXECUTE 'CREATE POLICY "vip_requests_admin_update" ON public.vip_requests
      FOR UPDATE TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';

    EXECUTE 'CREATE POLICY "vip_requests_admin_delete" ON public.vip_requests
      FOR DELETE TO authenticated
      USING (public.is_admin())';
  END IF;

  IF to_regclass('public.video_ads') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.video_ads ENABLE ROW LEVEL SECURITY';
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'video_ads'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.video_ads', policy_record.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "video_ads_public_read_active" ON public.video_ads
      FOR SELECT TO anon, authenticated
      USING (is_active IS TRUE OR public.is_admin())';

    EXECUTE 'CREATE POLICY "video_ads_admin_all" ON public.video_ads
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;

  IF to_regclass('public.live_status') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.live_status ENABLE ROW LEVEL SECURITY';
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'live_status'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.live_status', policy_record.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "live_status_public_read" ON public.live_status
      FOR SELECT TO anon, authenticated
      USING (true)';

    EXECUTE 'CREATE POLICY "live_status_admin_all" ON public.live_status
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;

  IF to_regclass('public.app_settings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY';
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'app_settings'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.app_settings', policy_record.policyname);
    END LOOP;

    EXECUTE 'CREATE POLICY "app_settings_home_banner_read" ON public.app_settings
      FOR SELECT TO anon, authenticated
      USING (id = ''home_banner_video'')';

    EXECUTE 'CREATE POLICY "app_settings_admin_all" ON public.app_settings
      FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin())';
  END IF;
END;
$optional$;

COMMIT;

-- After applying, test:
-- 1) anon/authenticated SELECT on public.videos.video_url must fail.
-- 2) free user sees video_catalog.video_url = NULL for VIP videos.
-- 3) active VIP/admin sees video_catalog.video_url.
-- 4) request_video_download(uuid) enforces VIP and free quota server-side.
-- 5) normal user UPDATE users SET is_admin=true / plan='vip' / blocked=false must fail.
-- 6) push_subscriptions insert with user_id != auth.uid() and anonymous insert must fail.
