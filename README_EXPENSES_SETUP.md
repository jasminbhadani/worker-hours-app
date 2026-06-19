Expense Module Setup Notes

1. Run SQL migration against Supabase/Postgres (db/migrations/20260618_create_expenses_table.sql).
2. Create a private Supabase Storage bucket named: expense-invoices
   - Keep the bucket private; admin pages use signed URLs to preview files.
   - Allowed formats: jpg,jpeg,png,webp,pdf
3. Ensure your server Supabase client (supabaseServer) uses a key with permissions to upload and create signed URLs (service role key recommended for signed URLs).
4. Environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY (current code uses this; replace with SUPABASE_SERVICE_ROLE_KEY if you need signed URL access from server)
5. After deploying, you may run OCR by POSTing to /api/admin/expenses/[id]/run-ocr which uses lib/ocr/expense-ocr.ts (placeholder).

Notes on future improvements:
- Integrate Tesseract or an OCR provider in lib/ocr/expense-ocr.ts
- Improve parsing heuristics and confidence scoring
- Add UI for editing parsed fields on the admin detail page
- Add pagination, filters, and CSV streaming improvements
