ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS invoice_number text;

CREATE INDEX IF NOT EXISTS idx_expenses_vendor_name
  ON public.expenses(vendor_name);
