export type Expense = {
  id: string;
  worker_id?: string | null;
  project_id?: string | null;
  category?: 'Material' | 'Tools' | 'Fuel' | 'Misc' | null;
  uploaded_by_worker_name?: string | null;
  vendor_name?: string | null;
  invoice_date?: string | null;
  amount?: number | null;
  tax_amount?: number | null;
  file_name?: string | null;
  mime_type?: string | null;
  invoice_file_url?: string | null; // storage path or public URL
  storage_path?: string | null; // path inside storage bucket
  ocr_text?: string | null;
  ocr_confidence?: number | null;
  ocr_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ExpenseInsert = {
  worker_id?: string | null;
  project_id?: string | null;
  uploaded_by_worker_name?: string | null;
  category?: 'Material' | 'Tools' | 'Fuel' | 'Misc' | null;
  file_name?: string | null;
  mime_type?: string | null;
  invoice_file_url?: string | null;
  storage_path?: string | null;
  notes?: string | null;
  ocr_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
};

export type ExpenseUploadForm = {
  worker_id?: string;
  uploaded_by_worker_name?: string;
  project_id?: string;
  category: 'Material' | 'Tools' | 'Fuel' | 'Misc';
  invoice_file: File;
  notes?: string;
};
