Expense Storage Bucket Setup

Bucket name: expense-invoices

- Purpose: store uploaded invoice images and PDFs for admin review.
- Visibility: PRIVATE. Use signed URLs to preview files in admin UI.
- Allowed formats: jpg, jpeg, png, webp, pdf

Server-side notes:
- Use Supabase service role key for server operations that require signed URLs or moving files.
- Ensure the Supabase client used on the server has permissions to upload to the bucket and to create signed URLs.
- When generating signed URLs, set a short expiry (e.g., 60 seconds) for preview endpoints.

Security:
- Do NOT expose service role key to client-side code.
- Validate file types and sizes before uploading (e.g., max 10MB).

Next steps after review:
- Add upload endpoint and public expense-upload page.
- Add OCR processing and admin flows.
