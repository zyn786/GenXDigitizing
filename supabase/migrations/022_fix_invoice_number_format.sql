-- Migration 022: Invoice numbers INV-XXXX -> INV-GX00000
ALTER TABLE public.invoices ALTER COLUMN invoice_number DROP DEFAULT;
ALTER TABLE public.invoices ALTER COLUMN invoice_number SET DEFAULT ('INV-GX' || lpad(nextval('invoice_number_seq')::text, 5, '0'));

UPDATE public.invoices
SET invoice_number = 'INV-GX' || lpad(substring(invoice_number FROM 5)::int::text, 5, '0')
WHERE invoice_number LIKE 'INV-%';
