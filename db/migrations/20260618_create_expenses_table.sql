-- Migration: create expenses table
-- Run this against your Supabase/Postgres database

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES public.workers(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('Material','Tools','Fuel','Misc')),
  uploaded_by_worker_name text,
  vendor_name text,
  invoice_date date,
  amount numeric(12,2),
  tax_amount numeric(12,2),
  file_name text,
  mime_type text,
  invoice_file_url text,
  ocr_text text,
  ocr_confidence numeric,
  ocr_status text NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending','processing','completed','failed')),
  approval_status text NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','rejected')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_worker ON public.expenses(worker_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(invoice_date);
CREATE INDEX IF NOT EXISTS idx_expenses_ocr ON public.expenses(ocr_status);
CREATE INDEX IF NOT EXISTS idx_expenses_approval ON public.expenses(approval_status);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
