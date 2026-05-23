-- Add design_name column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS design_name text;
COMMENT ON COLUMN public.orders.design_name IS 'Optional name/description of the design for reference';
