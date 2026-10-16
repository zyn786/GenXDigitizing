-- ============================================================
-- Migration 066 — SEO keywords on portfolio projects
-- ============================================================
-- STATUS: additive, safe, idempotent. Not yet applied.
--
-- WHY
-- ---
-- The portfolio admin has had a "Keywords — comma-separated, for SEO" field
-- for a while, and it has never saved, for three separate reasons that all had
-- to be true at once:
--
--   1. No column here. `portfolios` was built without `keywords`, so the admin
--      form collected them, the API dropped them, and nothing was ever stored.
--   2. The API routes never read `body.keywords` — the blog routes do, the
--      portfolio routes never did. (Fixed alongside this migration.)
--   3. The input could not accept a comma. It rendered
--      `form.keywords.join(", ")` and rebuilt the array on every keystroke with
--      `.filter(Boolean)`, which deleted the trailing empty entry that a comma
--      produces — so the comma vanished as you typed it and you could only ever
--      enter one keyword. (Also fixed alongside this.)
--
-- The type matches `blog_posts.keywords` (migration 003) so the two SEO fields
-- behave the same way. `not null default '{}'` rather than nullable: an empty
-- array and "no keywords" are the same thing to every reader, and a nullable
-- array means every consumer needs a null check for no benefit.

alter table public.portfolios
  add column if not exists keywords text[] not null default '{}';

comment on column public.portfolios.keywords is
  'Per-project SEO keywords, entered in the portfolio admin. Merged into the /portfolio page metadata.';

-- ============================================================
-- VERIFY AFTER APPLYING
-- ============================================================
--   select column_name, data_type, is_nullable
--   from information_schema.columns
--   where table_schema = 'public' and table_name = 'portfolios'
--     and column_name = 'keywords';
--   -- expect: keywords | ARRAY | NO
--
-- Then save a project in the admin with several comma-separated keywords,
-- reopen it, and confirm all of them are still there.
