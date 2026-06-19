-- Migration: add storage_path column and updated_at trigger for expenses
-- GENERATED: 2026-06-18

ALTER TABLE IF EXISTS public.expenses
  ADD COLUMN IF NOT EXISTS storage_path text;

-- Trigger function to update updated_at timestamp on row update
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure any existing trigger is removed and recreate it
DROP TRIGGER IF EXISTS trg_update_updated_at ON public.expenses;
CREATE TRIGGER trg_update_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
