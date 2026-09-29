-- ============================================================
-- Migration 047: Idempotency key for order creation
-- ============================================================
--
-- SAFE TO APPLY BEFORE THE CODE DEPLOY — additive only.
--
-- This was originally one migration that also dropped the client order-insert
-- policies. Those drops were split out into 049 because production is still
-- running the pre-refactor code, which creates orders by inserting directly from
-- the browser. Dropping `orders_client_insert` while that code is live would
-- break order placement outright.
--
-- Making order creation safe to retry: without a key, a double-click, a flaky
-- connection, or our own retry creates a second order — and under the old
-- fire-and-forget notification the team was told about it twice or not at all.
--
-- The server route tolerates this column being absent (it retries the insert
-- without it and logs a warning), so applying this late is not fatal — only
-- retry protection is lost.

alter table public.orders
  add column if not exists idempotency_key text;

comment on column public.orders.idempotency_key is
  'Client-supplied key making POST /api/orders/create safe to retry.';

create unique index if not exists idx_orders_idempotency_key
  on public.orders (idempotency_key)
  where idempotency_key is not null;

-- Verification (expect 0 rows): any order whose price does not match its tier ×
-- quantity is evidence the direct-insert path was abused, since the browser used
-- to state its own price.
--   select o.id, o.order_number, o.price, t.price as tier_price, o.created_at
--   from orders o join service_tiers t on t.id = o.service_tier_id
--   where o.price > 0 and o.price <> t.price;
