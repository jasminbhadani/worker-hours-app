import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "../../lib/supabase-server";
import ExportButton from "./ExportButton";
import WorkEntryActions from "./WorkEntryActions";

export const dynamic = "force-dynamic";

type AdminSearchParams = Promise<{
  search?: string;
  project?: string;
  from?: string;
  to?: string;
  page?: string;
  status?: string;
  message?: string;
}>;

type WorkerOption = {
  id: string;
  name: string;
  active: boolean;
};

type ProjectOption = {
  id: string;
  name: string;
  active: boolean;
};

type WorkEntryRow = {
  id: string;
  worker_id: string;
  project_id: string;
  work_date: string;
  hours_worked: number;
  shift: string;
  workers: {
    name: string;
  } | null;
  projects: {
    name: string;
  } | null;
};

const PAGE_SIZE = 10;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: AdminSearchParams;
}) {
  const params = await searchParams;
  const search = params.search?.trim() || "";
  const projectFilter =
    params.project?.trim() || "";
  const fromDate =
    params.from?.trim() || "";
  const toDate = params.to?.trim() || "";

  const requestedPage = Number(
    params.page || "1"
  );
  const page = Number.isNaN(requestedPage)
    ? 1
    : Math.max(requestedPage, 1);

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseServer
    .from("work_entries")
    .select(
      `
        id,
        worker_id,
        project_id,
        work_date,
        hours_worked,
        shift,
        workers(name),
        projects(name)
      `,
      { count: "exact" }
    )
    .order("work_date", {
      ascending: false,
    });

  if (search) {
    query = query.eq("worker_id", search);
  }

  if (projectFilter) {
    query = query.eq(
      "project_id",
      projectFilter
    );
  }

  if (fromDate) {
    query = query.gte("work_date", fromDate);
  }

  if (toDate) {
    query = query.lte("work_date", toDate);
  }

  if (!search) {
    query = query.range(from, to);
  }

  const {
    data: entries,
    error,
    count,
  } = await query;

  if (error) {
    return <div>Error loading records</div>;
  }

  const totalPages = search
    ? Math.max(
        1,
        Math.ceil((count || 0) / PAGE_SIZE)
      )
    : Math.max(
        1,
        Math.ceil((count || 0) / PAGE_SIZE)
      );

  if (page > totalPages) {
    const redirectParams =
      new URLSearchParams();

    if (search) {
      redirectParams.set("search", search);
    }

    if (projectFilter) {
      redirectParams.set(
        "project",
        projectFilter
      );
    }

    if (fromDate) {
      redirectParams.set("from", fromDate);
    }

    if (toDate) {
      redirectParams.set("to", toDate);
    }

    if (totalPages > 1) {
      redirectParams.set(
        "page",
        String(totalPages)
      );
    }

    const redirectQuery =
      redirectParams.toString();

    redirect(
      redirectQuery
        ? `/admin?${redirectQuery}`
        : "/admin"
    );
  }

  const [
    { count: activeWorkerCount },
    { count: activeProjectCount },
    { data: workers },
    { data: projects },
  ] = await Promise.all([
    supabaseServer
      .from("workers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),
    supabaseServer
      .from("projects")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("active", true),
    supabaseServer
      .from("workers")
      .select("id, name, active")
      .order("name"),
    supabaseServer
      .from("projects")
      .select("id, name, active")
      .order("name"),
  ]);

  const safeEntries =
    (entries || []) as unknown as WorkEntryRow[];

  const filteredEntries = safeEntries;

  const totalEntries =
    filteredEntries.length;

  const totalHours = filteredEntries.reduce(
    (sum, entry) =>
      sum + Number(entry.hours_worked),
    0
  );

  const uniqueWorkers = new Set(
    filteredEntries.map(
      (entry) => entry.workers?.name
    )
  ).size;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Work Entries Dashboard
          </h1>

          <p className="text-slate-500">
            View and manage Contractor submissions
          </p>
        </div>
      </div>

      {params.message && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
            params.status === "error"
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {params.message}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-blue-600 p-5 text-white shadow">
          <p className="text-sm opacity-80">
            Total Entries
          </p>
          <h2 className="text-3xl font-bold">
            {totalEntries}
          </h2>
        </div>

        <div className="rounded-xl bg-green-600 p-5 text-white shadow">
          <p className="text-sm opacity-80">
            Total Hours
          </p>
          <h2 className="text-3xl font-bold">
            {totalHours}
          </h2>
        </div>

        <div className="rounded-xl bg-purple-600 p-5 text-white shadow">
          <p className="text-sm opacity-80">
            Active Contractors
          </p>
          <h2 className="text-3xl font-bold">
            {activeWorkerCount || 0}
          </h2>
        </div>

        <div className="rounded-xl bg-emerald-600 p-5 text-white shadow">
          <p className="text-sm opacity-80">
            Active Projects
          </p>
          <h2 className="text-3xl font-bold">
            {activeProjectCount || 0}
          </h2>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Link
          href="/admin/workers"
          className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 p-6 text-white shadow transition hover:scale-105"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="opacity-80">
                Contractors
              </p>  

              <h2 className="mt-2 text-3xl font-bold">
                View
              </h2>

              <p className="mt-3 text-sm opacity-80">
                Manage contractors
              </p>
            </div>

            <div className="text-4xl">
              👷
            </div>
          </div>
        </Link>

        <Link
          href="/admin/projects"
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 p-6 text-white shadow transition hover:scale-105"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="opacity-80">
                Projects
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                View
              </h2>

              <p className="mt-3 text-sm opacity-80">
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
          className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 p-6 text-white shadow transition hover:scale-105"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="opacity-80">
                Payroll
              </p>

              <h2 className="mt-2 text-3xl font-bold">
                View
              </h2>

              <p className="mt-3 text-sm opacity-80">
                Weekly payroll reports
              </p>
            </div>

            <div className="text-4xl">
              💵
            </div>
          </div>
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="worker-filter"
              className="text-sm font-medium text-slate-700"
            >
              Contractor
            </label>

            <select
              id="worker-filter"
              name="search"
              defaultValue={search}
              className="w-64 rounded border p-2"
            >
              <option value="">
                All contractors
              </option>

              {((workers || []) as WorkerOption[]).map(
                (worker) => (
                  <option
                    key={worker.id}
                    value={worker.id}
                  >
                    {worker.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="project-filter"
              className="text-sm font-medium text-slate-700"
            >
              Project
            </label>

            <select
              id="project-filter"
              name="project"
              defaultValue={projectFilter}
              className="w-64 rounded border p-2"
            >
              <option value="">
                All projects
              </option>

              {((projects || []) as ProjectOption[]).map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="from-date"
              className="text-sm font-medium text-slate-700"
            >
              From
            </label>

            <input
              id="from-date"
              type="date"
              name="from"
              defaultValue={fromDate}
              className="rounded border p-2"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="to-date"
              className="text-sm font-medium text-slate-700"
            >
              To
            </label>

            <input
              id="to-date"
              type="date"
              name="to"
              defaultValue={toDate}
              className="rounded border p-2"
            />
          </div>

          <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Search
          </button>

          {(search ||
            projectFilter ||
            fromDate ||
            toDate) && (
            <a
              href="/admin"
              className="rounded bg-slate-500 px-4 py-2 text-white hover:bg-slate-600"
            >
              Clear
            </a>
          )}
        </form>

        <div className="flex items-end">
          <ExportButton
            entries={filteredEntries || []}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="border-b border-r px-4 py-3 text-left font-semibold">
                  Contractor
                </th>

                <th className="border-b border-r px-4 py-3 text-left font-semibold">
                  Job Site
                </th>

                <th className="border-b border-r px-4 py-3 text-left font-semibold">
                  Date (MM/DD/YYYY)
                </th>

                <th className="border-b border-r px-4 py-3 text-left font-semibold">
                  Hours
                </th>

                <th className="border-b border-r px-4 py-3 text-left font-semibold">
                  Shift
                </th>

                <th className="border-b px-4 py-3 text-left font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No work entries found.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(
                  (entry, index) => (
                    <tr
                      key={entry.id}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-slate-50"
                      }
                    >
                      <td className="border-b border-r px-4 py-3">
                        {entry.workers?.name}
                      </td>

                      <td className="border-b border-r px-4 py-3">
                        {entry.projects?.name}
                      </td>

                      <td className="border-b border-r px-4 py-3">
                        {new Date(
                          entry.work_date
                        )
                          .toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            }
                          )}
                      </td>

                      <td className="border-b border-r px-4 py-3">
                        {entry.hours_worked}
                      </td>

                      <td className="border-b border-r px-4 py-3">
                        {entry.shift}
                      </td>

                      <td className="border-b px-4 py-3">
                        <WorkEntryActions
                          entry={entry}
                          workers={
                            (workers ||
                              []) as WorkerOption[]
                          }
                          projects={
                            (projects ||
                              []) as ProjectOption[]
                          }
                          currentPage={page}
                          search={search}
                          project={projectFilter}
                          from={fromDate}
                          to={toDate}
                        />
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>

          <div className="mt-4 text-center text-sm text-gray-500">
            <>
              Showing{" "}
              {count
                ? (page - 1) * PAGE_SIZE + 1
                : 0}
              -
              {Math.min(
                page * PAGE_SIZE,
                count || 0
              )}{" "}
              of {count || 0} records
            </>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
              {page > 1 && (
                <a
                  href={`/admin?${new URLSearchParams({
                    ...(search
                      ? { search }
                      : {}),
                    ...(projectFilter
                      ? {
                          project:
                            projectFilter,
                        }
                      : {}),
                    ...(fromDate
                      ? { from: fromDate }
                      : {}),
                    ...(toDate
                      ? { to: toDate }
                      : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="rounded bg-slate-200 px-4 py-2 hover:bg-slate-300"
                >
                  Previous
                </a>
              )}

              <span className="font-medium">
                Page {page} of {totalPages}
              </span>

              {page < totalPages && (
                <a
                  href={`/admin?${new URLSearchParams({
                    ...(search
                      ? { search }
                      : {}),
                    ...(projectFilter
                      ? {
                          project:
                            projectFilter,
                        }
                      : {}),
                    ...(fromDate
                      ? { from: fromDate }
                      : {}),
                    ...(toDate
                      ? { to: toDate }
                      : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="rounded bg-slate-200 px-4 py-2 hover:bg-slate-300"
                >
                  Next
                </a>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}
