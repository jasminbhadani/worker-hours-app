import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminExpenseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: expense, error } = await supabaseServer
    .from("expenses")
    .select("*, workers(name), projects(name)")
    .eq("id", id)
    .single();

  if (error || !expense) {
    return <div className="p-8">Expense not found</div>;
  }

  let signedUrl: string | null = null;

  try {
    console.log("Storage path:", expense.storage_path);

    const test = await supabaseServer.storage
      .from("expense-invoices")
      .list("2026/06");

    console.log("LIST TEST:", test);

    const res = await supabaseServer.storage
      .from("expense-invoices")
      .createSignedUrl(
        expense.storage_path,
        60
      );

    console.log("Signed URL response:", res);

    signedUrl = res.data?.signedUrl || null;
  } catch (err) {
    console.error("Signed URL error", err);
  }

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expense Detail</h1>
          <p className="text-slate-500">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Preview */}
        <div className="col-span-1 bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Invoice Preview</h2>

          {signedUrl ? (
            expense.mime_type?.includes("pdf") ? (
              <iframe
                src={signedUrl}
                className="w-full h-96"
              />
            ) : (
              <img
                src={signedUrl}
                alt="invoice"
                className="w-full h-auto"
              />
            )
          ) : (
            <div className="text-slate-500">
              Preview unavailable
            </div>
          )}
        </div>

        {/* Details */}
        <div className="col-span-2 bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">
            Expense Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Worker
              </p>
              <p>
                {expense.uploaded_by_worker_name ||
                  expense.workers?.name ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Project
              </p>
              <p>{expense.projects?.name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Category
              </p>
              <p>{expense.category || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Notes
              </p>
              <p>{expense.notes || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                OCR Status
              </p>
              <p>{expense.ocr_status || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Approval Status
              </p>
              <p>{expense.approval_status || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Amount
              </p>
              <p>{expense.amount ?? "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Vendor
              </p>
              <p>{expense.vendor_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Invoice Date
              </p>
              <p>{expense.invoice_date || "-"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}