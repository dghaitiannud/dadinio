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

COMMIT;

-- After applying, test:
-- 1) anon/authenticated SELECT on public.videos.video_url must fail.
-- 2) free user sees video_catalog.video_url = NULL for VIP videos.
-- 3) active VIP/admin sees video_catalog.video_url.
-- 4) request_video_download(uuid) enforces VIP and free quota server-side.
-- 5) normal user UPDATE users SET is_admin=true / plan='vip' / blocked=false must fail.
-- 6) push_subscriptions insert with user_id != auth.uid() and anonymous insert must fail.
