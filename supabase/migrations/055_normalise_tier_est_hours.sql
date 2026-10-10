-- Migration 055: retire the "12–24h" turnaround from service_tiers.est_hours.
--
-- The site said "12-hour turnaround" in about twenty places, the scheduler in
-- lib/sla.ts uses 24 for standard, and the order email said "12–24h". Those are
-- now reconciled on the marketing side to the range the tiers actually cover.
-- `service_tiers.est_hours` was the last place still carrying the old wording,
-- and it is the worst place to leave it: this value is what get_service_prices
-- returns, so it is what the AI sales assistant quotes to a customer in a draft.
--
-- A live draft asked "how much for a 3-colour logo on 12 caps?" answered
-- "digitizing is $7.00 and takes about 12–24 hours" — read straight out of this
-- column. It had not invented anything; the stored data was simply wrong.
--
-- What the values should be: a tier does not encode speed — the customer picks
-- standard / rush / urgent at order time — so the estimate must be the range
-- across those speeds, 3–24h, which is also the figure the site publishes
-- (TURNAROUND_RANGE_LABEL, lib/site-config.ts). Quoting only the 24-hour
-- standard window would understate what the shop offers and disagree with the
-- page the customer just read.
--
-- Big designs are the exception: lib/sla.ts gives them 12 hours whatever the
-- speed, so they are marked `is_big_design` and already read ~12h.
--
-- Scoped deliberately to rows still carrying the retired range. A tier with a
-- hand-set estimate is left exactly as it is.

update public.service_tiers
set est_hours = case
      when is_big_design then '~12h'
      else '3–24h'
    end
where est_hours like '%12–24%'
   or est_hours like '%12-24%';

-- Same figure, same reasoning, wherever else it is still stored as text.
update public.service_tiers
set size_desc = replace(size_desc, '12–24h', '3–24h')
where size_desc like '%12–24%';

comment on column public.service_tiers.est_hours is
  'Turnaround shown to customers and returned to the AI assistant by get_service_prices: the range across the speed options (3–24h), or ~12h for a big design, which lib/sla.ts schedules at 12 hours whatever the speed. Keep in step with TURNAROUND_RANGE_LABEL in lib/site-config.ts.';
