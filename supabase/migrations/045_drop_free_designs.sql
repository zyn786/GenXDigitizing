-- ============================================================
-- Migration 045: Remove the free designs feature
-- ============================================================
--
-- ⚠️  DO NOT APPLY UNTIL THE NEW CODE IS DEPLOYED AND LIVE.  ⚠️
--
-- The free-designs removal is code + schema together. As of writing, production
-- still serves the feature — GET /api/free-designs returns 200 with live rows —
-- so dropping these tables now takes down a working public page and the admin
-- screens that manage it.
--
-- Confirm the deploy first:
--
--   curl -s -o /dev/null -w "%{http_code}\n" https://www.genxdigitizing.com/api/free-designs
--
--   200  → old code is still live. DO NOT APPLY.
--   404  → the route is gone. Safe to apply.
--
-- Forward-only reversal of 009 (tables) and 031 (storage bucket + policies).
-- Migrations 009 and 031 stay in history; this migration is the drop.
--
-- Data at the time of writing: 3 rows in free_designs, 9 in free_design_images,
-- and the storage bucket already empty — the recorded files were gone, so the
-- rows pointed at nothing. Still irreversible; take a dump if that matters.
--
-- ORDER MATTERS. The stored objects are NOT deleted here: dropping the bucket
-- row while objects still exist orphans the blobs, and an orphaned object can no
-- longer be listed or removed through the Storage API. Purge the objects first:
--
--     node --env-file=.env.local scripts/purge-free-designs-bucket.mjs            # dry run
--     node --env-file=.env.local scripts/purge-free-designs-bucket.mjs --confirm  # delete files
--
-- ...then uncomment the bucket delete at the bottom of this file and push again.

-- ── Storage policies (from 031) ────────────────────────────
drop policy if exists "free_designs_upload" on storage.objects;
drop policy if exists "free_designs_read"   on storage.objects;
drop policy if exists "free_designs_admin"  on storage.objects;
drop policy if exists "free_designs_delete" on storage.objects;

-- ── Tables (from 009) ──────────────────────────────────────
-- free_design_images holds the FK, so it goes first. Its RLS policies, index
-- and the FK constraint are dropped with the table.
drop table if exists public.free_design_images;
drop table if exists public.free_designs;

-- ── Bucket ─────────────────────────────────────────────────
-- Uncomment ONLY after the purge script has run and reports 0 objects remaining.
-- delete from storage.buckets where id = 'free-designs';
