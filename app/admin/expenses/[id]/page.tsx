import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { getInvoiceDownloadUrl, getInvoiceSignedUrl } from "@/lib/expense-storage";
import ExpenseEditForm from "./ExpenseEditForm";

export const dynamic = "force-dynamic";

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

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

  const previewUrl = await getInvoiceSignedUrl(expense.storage_path);
  const downloadUrl = await getInvoiceDownloadUrl(
    expense.storage_path,
    expense.file_name
  );
  const isPdf = expense.mime_type === "application/pdf";
  const isImage = IMAGE_MIME_TYPES.has(expense.mime_type || "");

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expense Detail</h1>
          <p className="text-slate-500">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 bg-white p-4 rounded-xl shadow">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Invoice Preview</h2>

            {downloadUrl ? (
              <Link
                href={downloadUrl}
                target="_blank"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
              >
                Download Invoice
              </Link>
            ) : null}
          </div>

          {previewUrl && isPdf ? (
            <iframe
              src={previewUrl}
              title="Invoice PDF preview"
              className="h-[32rem] w-full rounded-lg border"
            />
          ) : null}

          {previewUrl && isImage ? (
            // The preview uses a short-lived signed URL, so a standard img tag is the simplest safe option here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Invoice preview"
              className="h-auto w-full rounded-lg border object-contain"
            />
          ) : null}

          {!previewUrl || (!isPdf && !isImage) ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Invoice preview unavailable
            </div>
          ) : null}
        </div>

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
                  expense.workers?.[0]?.name ||
                  "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Project
              </p>
              <p>{expense.projects?.[0]?.name || "-"}</p>
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
              <p className="whitespace-pre-wrap">
                {expense.notes || "-"}
              </p>
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
              <p>{formatCurrency(expense.amount)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Vendor
              </p>
              <p>{expense.vendor_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Invoice Number
              </p>
              <p>{expense.invoice_number || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Invoice Date
              </p>
              <p>{formatDate(expense.invoice_date)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="mb-4 font-semibold">
            OCR Results
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">
                Vendor Name
              </p>
              <p>{expense.vendor_name || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Invoice Number
              </p>
              <p>{expense.invoice_number || "-"}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Invoice Date
              </p>
              <p>{formatDate(expense.invoice_date)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Amount
              </p>
              <p>{formatCurrency(expense.amount)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                Tax Amount
              </p>
              <p>{formatCurrency(expense.tax_amount)}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                OCR Confidence
              </p>
              <p>
                {typeof expense.ocr_confidence === "number"
                  ? `${expense.ocr_confidence}%`
                  : "-"}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">
                OCR Status
              </p>
              <p>{expense.ocr_status || "-"}</p>
            </div>
          </div>

          <details className="mt-4 rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer font-medium">
              Raw OCR Text
            </summary>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-700">
              {expense.ocr_text || "No OCR text available."}
            </pre>
          </details>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="mb-4 font-semibold">
            Manual Correction
          </h2>
          <ExpenseEditForm expense={expense} />
        </div>
      </div>
    </div>
  );
}
