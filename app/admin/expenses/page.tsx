import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      invoice_date,
      amount,
      approval_status,
      created_at,
      vendor_name,
      uploaded_by_worker_name,
      workers(name),
      projects(name)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen p-8 bg-slate-100">
        <div className="bg-white rounded-xl shadow p-6">
          Error loading expenses
        </div>
      </div>
    );
  }

  const filteredExpenses = (expenses || []).filter((expense: any) => {
    const workerName = (
      expense.uploaded_by_worker_name ||
      expense.workers?.name ||
      ""
    ).toLowerCase();

    const projectName = (
      expense.projects?.name || ""
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

  const totalRecords = filteredExpenses.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalRecords / pageSize)
  );

  const startIndex = (page - 1) * pageSize;

  const paginatedExpenses = filteredExpenses.slice(
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
              placeholder="Worker, project or vendor"
              className="border rounded-lg px-3 py-2 w-96"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Status
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
                    Expense ID
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Worker Name
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Project Name
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Expense Date
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Amount
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Status
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Uploaded On
                  </th>

                  <th className="px-4 py-3 border-b text-left">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedExpenses.map(
                  (expense: any, index: number) => (
                    <tr
                      key={expense.id}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="px-4 py-3 border-b">
                        {expense.id.slice(0, 6).toUpperCase()}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.uploaded_by_worker_name ||
                          expense.workers?.name ||
                          "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.projects?.name || "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.invoice_date
                          ? new Date(
                              expense.invoice_date
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.amount ?? "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.approval_status ||
                          "pending"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        {expense.created_at
                          ? new Date(
                              expense.created_at
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3 border-b">
                        <Link
                          href={`/admin/expenses/${expense.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </Link>
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