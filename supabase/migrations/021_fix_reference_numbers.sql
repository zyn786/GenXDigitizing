-- Migration 021: Standardize reference number formats
-- Orders:    ORD-XXXX  → OD-GX00000
-- Quotes:    NEW       → QT-GX00000
-- Subscriptions: NEW   → SB-GX00000

-- 1. Fix order_number format (5-digit zero-padded)
ALTER TABLE public.orders ALTER COLUMN order_number DROP DEFAULT;
ALTER TABLE public.orders ALTER COLUMN order_number SET DEFAULT ('OD-GX' || lpad(nextval('order_number_seq')::text, 5, '0'));

UPDATE public.orders
SET order_number = 'OD-GX' || lpad(substring(order_number FROM 5)::int::text, 5, '0')
WHERE order_number LIKE 'ORD-%';

-- 2. Quote numbers for crm_leads
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1000;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS quote_number TEXT UNIQUE
  DEFAULT ('QT-GX' || lpad(nextval('quote_number_seq')::text, 5, '0'));

UPDATE public.crm_leads
SET quote_number = 'QT-GX' || lpad(nextval('quote_number_seq')::text, 5, '0')
WHERE quote_number IS NULL;

-- 3. Subscription numbers
CREATE SEQUENCE IF NOT EXISTS subscription_number_seq START 1000;
ALTER TABLE public.client_subscriptions ADD COLUMN IF NOT EXISTS subscription_number TEXT UNIQUE
  DEFAULT ('SB-GX' || lpad(nextval('subscription_number_seq')::text, 5, '0'));

UPDATE public.client_subscriptions
SET subscription_number = 'SB-GX' || lpad(nextval('subscription_number_seq')::text, 5, '0')
WHERE subscription_number IS NULL;
