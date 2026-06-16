import Link from "next/link";
import { supabaseServer } from "../../lib/supabase-server";
import ExportButton from "./ExportButton";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
      searchParams: Promise<{
      search?: string;
      page?: string;
    }>;
}) {
  const params = await searchParams;

  const search =
    params.search?.trim() || "";

  const page = Number(params.page || "1");
  const PAGE_SIZE = 10;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseServer
      .from("work_entries")
      .select(
        `
          *,
          workers(name),
          projects(name)
        `,
        { count: "exact" }
      );

    if (search) {
      query = query.ilike(
        "workers.name",
        `%${search}%`
      );
    }

    const {
      data: entries,
      error,
      count,
    } = await query
      .order("work_date", {
        ascending: false,
      })
      .range(from, to);

    const totalPages = Math.ceil(
      (count || 0) / PAGE_SIZE
    );

  // Get counts for menu cards
  const [{ count: workerCount }, { count: projectCount }] =
    await Promise.all([
      supabaseServer
        .from("workers")
        .select("*", { count: "exact", head: true }),

      supabaseServer
        .from("projects")
        .select("*", { count: "exact", head: true }),
    ]);

  
  const filteredEntries = entries || [];

  const totalEntries =
  filteredEntries?.length || 0;

  const totalHours =
    filteredEntries?.reduce(
      (sum, entry) => sum + Number(entry.hours_worked),
      0
    ) || 0;

  const uniqueWorkers =
    new Set(
      filteredEntries?.map((entry) => entry.workers?.name)
    ).size || 0;

  if (error) {
    return <div>Error loading records</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Work Entries Dashboard
          </h1>

          <p className="text-slate-500">
            View and manage worker submissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Entries
          </p>
          <h2 className="text-3xl font-bold">
            {totalEntries}
          </h2>
        </div>

        <div className="bg-green-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Hours
          </p>
          <h2 className="text-3xl font-bold">
            {totalHours}
          </h2>
        </div>

        <div className="bg-purple-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Active Workers
          </p>
          <h2 className="text-3xl font-bold">
            {uniqueWorkers}
          </h2>
        </div>
      </div>

      {/* MENU CARDS */}
      {/* MENU CARDS */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

  <Link
    href="/admin/workers"
    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl p-6 shadow hover:scale-105 transition"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="opacity-80">
          Workers
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {workerCount || 0}
        </h2>

        <p className="text-sm mt-3 opacity-80">
          Manage workers
        </p>
      </div>

      <div className="text-4xl">
        👷
      </div>
    </div>
  </Link>

  <Link
    href="/admin/projects"
    className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-xl p-6 shadow hover:scale-105 transition"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="opacity-80">
          Projects
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {projectCount || 0}
        </h2>

        <p className="text-sm mt-3 opacity-80">
          Job sites
        </p>
      </div>

      <div className="text-4xl">
        🏗️
      </div>
    </div>
  </Link>

  <Link
    href="/admin/payroll"
    className="bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-xl p-6 shadow hover:scale-105 transition"
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="opacity-80">
          Payroll
        </p>

        <h2 className="text-3xl font-bold mt-2">
          💵
        </h2>

        <p className="text-sm mt-3 opacity-80">
          Weekly payroll reports
        </p>
      </div>

      <div className="text-4xl">
        📄
      </div>
    </div>
  </Link>

</div>

      {/* Actions */}
      <form className="flex gap-3 mb-4">
        <ExportButton
          entries={filteredEntries || []}
        />

        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="Search worker..."
          className="border p-2 rounded w-64"
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Search
        </button>

        {search && (
          <a
            href="/admin"
            className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
          >
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="px-4 py-3 border-b border-r text-left font-semibold">
                  Worker
                </th>

                <th className="px-4 py-3 border-b border-r text-left font-semibold">
                  Job Site
                </th>

                <th className="px-4 py-3 border-b border-r text-left font-semibold">
                  Date (MM-DD-YYYY)
                </th>

                <th className="px-4 py-3 border-b border-r text-left font-semibold">
                  Hours
                </th>

                <th className="px-4 py-3 border-b border-r text-left font-semibold">
                  Shift
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries?.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50"
                  }
                >
                  <td className="px-4 py-3 border-b border-r">
                    {entry.workers?.name}
                  </td>

                  <td className="px-4 py-3 border-b border-r">
                    {entry.projects?.name}
                  </td>

                  <td className="px-4 py-3 border-b border-r">
                    {new Date(entry.work_date).toLocaleDateString(
                      "en-US",
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      }
                    ).replace(/\//g, "-")}
                  </td>

                  <td className="px-4 py-3 border-b border-r">
                    {entry.hours_worked}
                  </td>

                  <td className="px-4 py-3 border-b border-r">
                    {entry.shift}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 text-sm text-gray-500 text-center">
            Showing {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, count || 0)}
            {" "}of {count || 0} records
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-3 mt-6">
            {page > 1 && (
              <a
                href={`/admin?search=${search}&page=${page - 1}`}
                className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
              >
                ← Previous
              </a>
            )}

            <span className="font-medium">
              Page {page} of {totalPages}
            </span>

            {page < totalPages && (
              <a
                href={`/admin?search=${search}&page=${page + 1}`}
                className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}