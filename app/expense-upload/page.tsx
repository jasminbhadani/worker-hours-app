import { supabaseServer } from "@/lib/supabase-server";
export const dynamic = "force-dynamic";

import ClientUploadWrapper from './ClientUploadWrapper';

export default async function ExpenseUploadPage() {
  const { data: workers } = await supabaseServer.from('workers').select('id, name');
  const { data: projects } = await supabaseServer.from('projects').select('id, name');

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-2">Upload Expense Invoice</h1>
        <p className="text-sm text-slate-500 mb-4">Upload purchase invoices for Materials, Tools, Fuel or Misc expenses. No login required.</p>

        {/* Client-side upload form component */}
        <ClientUploadWrapper workers={workers || []} projects={projects || []} />
      </div>
    </div>
  );
}
