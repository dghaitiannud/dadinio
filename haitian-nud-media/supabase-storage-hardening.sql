-- DADINIO Storage security hardening
-- Run AFTER supabase-security-hardening.sql has committed.
-- This file must be executed locally in the database container as supabase_admin.
-- supabase_admin is used only for Storage-owned tables; no application functions are created here.

BEGIN;

-- VIP payment proofs contain sensitive payment information. Make the bucket
-- private and remove the global public-read policy plus legacy vip-proofs
-- policies. The app uploads UUID-prefixed filenames, so ownership is checked
-- against the first filename segment.
DO $storage_acl$
DECLARE
  policy_record RECORD;
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    FOR policy_record IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND (
          policyname = 'Public Bucket Access'
          OR COALESCE(qual, '') ILIKE '%vip-proofs%'
          OR COALESCE(with_check, '') ILIKE '%vip-proofs%'
        )
    LOOP
      EXECUTE format('DROP POLICY %I ON storage.objects', policy_record.policyname);
    END LOOP;

    UPDATE storage.buckets
    SET public = FALSE
    WHERE id = 'vip-proofs';

    CREATE POLICY vip_proofs_upload_own
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'vip-proofs'
      AND left(name, 36) = auth.uid()::text
    );

    CREATE POLICY vip_proofs_read_own_or_admin
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'vip-proofs'
      AND (
        left(name, 36) = auth.uid()::text
        OR public.is_admin()
      )
    );

    CREATE POLICY vip_proofs_admin_delete
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'vip-proofs'
      AND public.is_admin()
    );
  END IF;
END;
$storage_acl$;

-- Notify Storage/PostgREST consumers that the bucket/policy state changed.
NOTIFY pgrst, 'reload schema';

COMMIT;
