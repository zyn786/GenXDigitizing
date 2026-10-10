-- Migration 056: service_tiers.credit_cost.
--
-- The application has read this column in four places since it was written —
-- the credit price shown on the client dashboard, the quick-order wizard, its
-- per-tier list, and the server-side charge in app/api/orders/create — but no
-- migration ever created it. Reads returned undefined, `getCreditCost` fell
-- through to the plan default, and a per-tier credit price set anywhere would
-- have been ignored. Nothing was broken by its absence; a price simply could
-- not be configured.
--
-- NULL is the meaningful default: it means "use the plan's default for this
-- design size", which is what every tier does today. The column exists so the
-- value can be set per tier from Admin → Pricing without a deploy, which is a
-- pricing decision and therefore not one to hardcode here.
--
-- A CHECK rather than a default: 0 or a negative would silently mean "free" or
-- nonsense, and getCreditCost's `> 0` guard would fall through to the plan
-- default — so a bad value would look like it worked. Rejecting it at the
-- column is louder.
--
-- Idempotent: safe to re-run.

alter table public.service_tiers
  add column if not exists credit_cost int;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'service_tiers_credit_cost_positive'
  ) then
    alter table public.service_tiers
      add constraint service_tiers_credit_cost_positive
      check (credit_cost is null or credit_cost >= 1);
  end if;
end $$;

comment on column public.service_tiers.credit_cost is
  'Credits charged per design at this tier. NULL means fall back to the plan default (see getCreditCost in lib/plans.ts) — every tier is NULL unless an admin sets one in Admin → Pricing.';
