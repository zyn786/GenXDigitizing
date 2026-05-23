-- ============================================================
-- STITCHPRO SETUP — STEP 1 of 5
-- Paste this in Supabase SQL Editor and click RUN
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- Enums (safe to re-run)
do $$ begin
  create type user_role      as enum ('admin','crm','client','designer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status   as enum ('submitted','assigned','in_progress','review','approved','delivered','revision','refunded','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_cat    as enum ('digitizing','vector','sewout');
exception when duplicate_object then null; end $$;

do $$ begin
  create type output_fmt     as enum ('DST','PES','EMB','JEF','XXX','VIP','HUS','EXP','VP3','SEW','AI','SVG','EPS','PDF');
exception when duplicate_object then null; end $$;

do $$ begin
  create type client_tier    as enum ('new','active','vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type priority_lvl   as enum ('low','medium','high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pay_status     as enum ('pending','paid','refunded','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_stage     as enum ('lead','contacted','quote_sent','negotiation','won','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notif_type     as enum ('order_update','message','payment','system','sla_warning','review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type file_type      as enum ('artwork','output','revision');
exception when duplicate_object then null; end $$;

do $$ begin
  create type turnaround_opt as enum ('standard','rush','urgent');
exception when duplicate_object then null; end $$;

-- Confirm
select 'Step 1 done ✓ — enums created' as status;
