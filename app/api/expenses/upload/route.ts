import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ['image/jpeg','image/png','image/webp','application/pdf','image/jpg'];

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const file = form.get('invoice_file') as any;
    const worker_id = (form.get('worker_id') as string) || null;
    let uploaded_by_worker_name = (form.get('uploaded_by_worker_name') as string) || null;
    const project_id = (form.get('project_id') as string) || null;
    const category = (form.get('category') as string) || null;
    const notes = (form.get('notes') as string) || null;

    console.log('Received upload request');
    console.log('worker_id:', worker_id);
    console.log('project_id:', project_id);
    console.log('category:', category);
    console.log('notes present:', !!notes);

    if (!file || typeof file === 'string') {
      console.error('No file provided in form data');
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    console.log('File name:', file.name, 'type:', file.type);
    const arrayBuffer = await file.arrayBuffer();
    console.log('File size bytes:', arrayBuffer.byteLength);

    if (!ALLOWED.includes(file.type)) {
      console.error('File type not allowed:', file.type);
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    if (arrayBuffer.byteLength > MAX_SIZE) {
      console.error('File too large:', arrayBuffer.byteLength);
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${year}/${month}/${unique}_${safeName}`;
    const bucket = 'expense-invoices';

    console.log('Uploading to bucket:', bucket, 'storagePath:', storagePath);

    // If worker_id provided, fetch worker name to populate uploaded_by_worker_name
    try {
      if (worker_id) {
        const { data: workerData, error: workerErr } = await supabaseServer.from('workers').select('name').eq('id', worker_id).single();
        if (workerErr) console.error('Failed to fetch worker name:', workerErr);
        if (workerData?.name) uploaded_by_worker_name = workerData.name;
        console.log('resolved uploaded_by_worker_name:', uploaded_by_worker_name);
      }
    } catch (err) {
      console.error('Error fetching worker name:', err);
    }

    // Upload
    try {
      const uploadRes = await supabaseServer.storage.from(bucket).upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type });
      console.log('Storage upload response:', uploadRes);
      if (uploadRes.error) {
        console.error('Storage upload failed:', uploadRes.error);
        return NextResponse.json({ error: 'Upload failed', details: uploadRes.error.message ?? String(uploadRes.error) }, { status: 500 });
      }
    } catch (err) {
      console.error('Exception during storage upload:', err);
      return NextResponse.json({ error: 'Upload failed', details: (err as any)?.message ?? String(err) }, { status: 500 });
    }

    // Create DB record
    try {
      const insertPayload: any = {
        worker_id: worker_id || null,
        project_id: project_id || null,
        uploaded_by_worker_name: uploaded_by_worker_name || null,
        category: category || null,
        file_name: file.name,
        mime_type: file.type,
        storage_path: storagePath,
        invoice_file_url: storagePath,
        notes: notes || null,
        ocr_status: 'pending',
        approval_status: 'pending'
      };

      console.log('Inserting DB record payload:', insertPayload);
      const { data, error } = await supabaseServer.from('expenses').insert(insertPayload).select('id').single();
      console.log('DB insert response:', { data, error });
      if (error) {
        console.error('DB insert error:', error);
        return NextResponse.json({ error: 'Failed to create expense record', details: error?.message ?? String(error) }, { status: 500 });
      }

      return NextResponse.json({ ok: true, id: data.id, redirect: '/expense-upload/success' });
    } catch (err) {
      console.error('Exception during DB insert:', err);
      return NextResponse.json({ error: 'Failed to create expense record', details: (err as any)?.message ?? String(err) }, { status: 500 });
    }
  } catch (err) {
    console.error('Unhandled exception in upload route:', err);
    return NextResponse.json({ error: 'Upload failed', details: (err as any)?.message ?? String(err) }, { status: 500 });
  }
}
