import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import ApprovalButtons from "./ApprovalButtons";
import { getInvoiceSignedUrl } from "@/lib/expense-storage";
export const dynamic = "force-dynamic";

type ExpenseListItem = {
  id: string;
  amount: number | null;
  approval_status: string | null;
  created_at: string | null;
  vendor_name: string | null;
  uploaded_by_worker_name: string | null;
  storage_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  projects: {
    name: string | null;
  } | null;
  invoiceUrl?: string | null;
};
function getStatusBadge(status: string | null) {
  const value = (status || "pending").toLowerCase();

  if (value === "approved") {
    return (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
        Approved
      </span>
    );
  }

  if (value === "rejected") {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
      Pending
    </span>
  );
}

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;

  const page = parseInt(resolvedSearchParams?.page || "1", 10);
  const search = (
    resolvedSearchParams?.search || ""
  ).trim().toLowerCase();

  const status = (
    resolvedSearchParams?.status || "all"
  ).toLowerCase();

  const pageSize = 10;

  const { data: expenses, error } = await supabaseServer
    .from("expenses")
    .select(`
      id,
      amount,
      approval_status,
      created_at,
      vendor_name,
      uploaded_by_worker_name,
      storage_path,
      file_name,
      mime_type,
      projects(name)
    `)
    .order("created_at", { ascending: false });
  console.log(
    "FIRST EXPENSE PROJECT SHAPE:",
    JSON.stringify(expenses?.[0]?.projects, null, 2)
  );  
  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-100">
        <div className="bg-white rounded-xl shadow p-6">
          Error loading expenses
        </div>
      </div>
    );
  }

  

  const filteredExpenses = (
    (expenses || []) as unknown as ExpenseListItem[]
  ).filter((expense) => {
    const workerName = (
      expense.uploaded_by_worker_name || ""
    ).toLowerCase();
    
    const projectName = (
      expense.projects?.name || "-"
    ).toLowerCase();

    const vendorName = (
      expense.vendor_name || ""
    ).toLowerCase();

    const matchesSearch =
      !search ||
      workerName.includes(search) ||
      projectName.includes(search) ||
      vendorName.includes(search);

    const expenseStatus = (
      expense.approval_status || "pending"
    ).toLowerCase();

    const matchesStatus =
      status === "all"
        ? true
        : expenseStatus === status;

    return matchesSearch && matchesStatus;
  });

  const expensesWithUrls = await Promise.all(
    filteredExpenses.map(async (expense) => ({
      ...expense,
      invoiceUrl: await getInvoiceSignedUrl(
        expense.storage_path
      ),
    }))
  );
  const totalRecords = filteredExpenses.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const startIndex = (page - 1) * pageSize;

  const paginatedExpenses = expensesWithUrls.slice(
    startIndex,
    startIndex + pageSize
  );

  return (
    <div className="min-h-screen p-8 bg-slate-100">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-slate-500">
          Uploaded expenses
        </p>
      </div>

      {/* Search + Filter */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <form className="flex flex-wrap items-end gap-3">

          <div>
            <label className="block text-sm font-medium mb-1">
              Search
            </label>

            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Contractor, project or vendor"
              className="border rounded-lg px-3 py-2 w-96"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Approval Status
            </label>

            <select
              name="status"
              defaultValue={status}
              className="border rounded-lg px-3 py-2 w-40"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Apply
          </button>

          <Link
            href="/admin/expenses"
            className="border border-slate-300 px-4 py-2 rounded-lg bg-white hover:bg-slate-50"
          >
            Clear
          </Link>

        </form>
      </div>

      {totalRecords === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center">
          <h2 className="text-xl font-semibold mb-2">
            No expenses found
          </h2>

          <p className="text-slate-500">
            No expense submissions have been uploaded yet.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  
                  <th className="px-4 py-3 border-b text-left">
                    Contractor Name
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Project Name
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Vendor
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Amount
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Approval Status
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Uploaded On
                  </th>

                  <th className="w-24 px-4 py-3 border-b text-center">
                    Invoice
                  </th>

                  <th className="w-24 px-4 py-3 border-b text-center">
                    Decision
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedExpenses.map(
                  (expense, index: number) => (
                    <tr
                      key={expense.id}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3 border-b">
                        <Link
                          href={`/admin/expenses/${expense.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {expense.uploaded_by_worker_name || "-"}
                        </Link>
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.projects?.name || "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.vendor_name || "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {typeof expense.amount === "number"
                          ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(expense.amount)
                          : "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {getStatusBadge(expense.approval_status)}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.created_at
                          ? new Date(
                              expense.created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="w-24 px-4 py-3 border-b text-center">
                        {expense.invoiceUrl ? (
                          <Link
                            href={expense.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="px-4 py-3 border-b text-center">
                        {expense.approval_status === "pending" ||
                        !expense.approval_status ? (
                          <ApprovalButtons id={expense.id} />
                        ) : expense.approval_status === "approved" ? (
                          <span className="text-green-600 font-medium">
                            Approved
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Rejected
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-500">
              Showing{" "}
              {totalRecords === 0
                ? 0
                : startIndex + 1}
              –
              {Math.min(
                startIndex + pageSize,
                totalRecords
              )}{" "}
              of {totalRecords}
            </div>

            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`?page=${
                    page - 1
                  }&search=${encodeURIComponent(
                    search
                  )}&status=${status}`}
                  className="border rounded-lg px-3 py-2 bg-white"
                >
                  Previous
                </Link>
              )}

              {page < totalPages && (
                <Link
                  href={`?page=${
                    page + 1
                  }&search=${encodeURIComponent(
                    search
                  )}&status=${status}`}
                  className="border rounded-lg px-3 py-2 bg-white"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
