-- ============================================================
-- Storage bucket limits for S3 → Supabase Storage migration
-- ============================================================
-- outputs bucket now hosts: order outputs (≤100MB), chat attachments (≤250MB),
-- guest uploads (≤25MB), contact/request uploads (≤20MB).
-- Old limit was 20MB. Plan tier caps per-file size (current tier: 50MB),
-- so the bucket limit is set to the tier max — 250MB requests are rejected
-- by Supabase until the plan is upgraded. Applied via Storage API 2026-08-13.

update storage.buckets
set file_size_limit = 52428800  -- 50MB (tier max; raise after plan upgrade)
where id = 'outputs';

-- artwork bucket previously restricted MIME types to png/jpeg/webp/pdf/ps/svg.
-- The artwork upload route accepts any file type (embroidery source files:
-- DST/PES/EMB/JEF/XXX/VIP/HUS/EXP/VP3/SEW, vector AI/EPS/SVG, PSD, PDF).
-- Remove the allowlist so valid uploads aren't rejected.
update storage.buckets
set allowed_mime_types = null  -- any
where id = 'artwork';
