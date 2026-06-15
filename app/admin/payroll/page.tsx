import { supabaseServer } from "@/lib/supabase-server";
import PayrollExportButton from "./PayrollExportButton";

export const dynamic = "force-dynamic";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{
    start?: string;
    end?: string;
  }>;
}) {
  const params = await searchParams;

  const today = new Date();

  // Current Week (Monday → Today)
  const monday = new Date(today);

  const day = monday.getDay();
  const diff = day === 0 ? 6 : day - 1;

  monday.setDate(today.getDate() - diff);

  const defaultStart = monday
    .toISOString()
    .split("T")[0];

  const defaultEnd = today
    .toISOString()
    .split("T")[0];

  const start =
    params.start || defaultStart;

  const end =
    params.end || defaultEnd;

  // Last Week dates
  const lastMonday = new Date(monday);
  lastMonday.setDate(
    lastMonday.getDate() - 7
  );

  const lastSunday = new Date(monday);
  lastSunday.setDate(
    lastSunday.getDate() - 1
  );

  const lastWeekStart = lastMonday
    .toISOString()
    .split("T")[0];

  const lastWeekEnd = lastSunday
    .toISOString()
    .split("T")[0];

  // This Month dates
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  )
    .toISOString()
    .split("T")[0];

  const { data: entries, error } =
    await supabaseServer
      .from("work_entries")
      .select(`
        hours_worked,
        shift,
        workers!work_entries_worker_id_fkey (
          id,
          name,
          day_rate,
          night_rate
        )
      `)
      .gte("work_date", start)
      .lte("work_date", end);

  if (error) {
    return (
      <div className="p-8 text-red-600">
        Error loading payroll data:
        {" "}
        {error.message}
      </div>
    );
  }

  const payrollMap = new Map();

  entries?.forEach((entry: any) => {
    const worker = entry.workers;

    if (!worker) return;

    if (!payrollMap.has(worker.id)) {
      payrollMap.set(worker.id, {
        name: worker.name,
        dayHours: 0,
        nightHours: 0,
        dayRate: Number(
          worker.day_rate || 0
        ),
        nightRate: Number(
          worker.night_rate || 0
        ),
      });
    }

    const row =
      payrollMap.get(worker.id);

    if (entry.shift === "Day") {
      row.dayHours += Number(
        entry.hours_worked
      );
    } else {
      row.nightHours += Number(
        entry.hours_worked
      );
    }
  });

  const payroll = Array.from(
    payrollMap.values()
  ).map((row: any) => {
    const dayAmount =
      row.dayHours * row.dayRate;

    const nightAmount =
      row.nightHours *
      row.nightRate;

    return {
      ...row,
      totalHours:
        row.dayHours +
        row.nightHours,
      dayAmount,
      nightAmount,
      amount:
        dayAmount + nightAmount,
    };
  });

  const totalPayroll =
    payroll.reduce(
      (
        sum: number,
        row: any
      ) => sum + row.amount,
      0
    );

  const totalHours =
    payroll.reduce(
      (
        sum: number,
        row: any
      ) => sum + row.totalHours,
      0
    );

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Payroll
        </h1>

        <p className="text-slate-500">
          Worker payroll summary
        </p>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <a
          href="/admin/payroll"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Current Week
        </a>

        <a
          href={`/admin/payroll?start=${lastWeekStart}&end=${lastWeekEnd}`}
          className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
        >
          Last Week
        </a>

        <a
          href={`/admin/payroll?start=${monthStart}&end=${defaultEnd}`}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          This Month
        </a>
      </div>

      {/* Date Filter */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <form className="flex gap-4 flex-wrap">
          <input
            type="date"
            name="start"
            defaultValue={start}
            className="border p-2 rounded"
          />

          <input
            type="date"
            name="end"
            defaultValue={end}
            className="border p-2 rounded"
          />

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Filter
          </button>
        </form>

        <PayrollExportButton
          payroll={payroll}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Hours
          </p>

          <h2 className="text-3xl font-bold">
            {totalHours.toFixed(2)}
          </h2>
        </div>

        <div className="bg-blue-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Payroll
          </p>

          <h2 className="text-3xl font-bold">
            ${totalPayroll.toFixed(2)}
          </h2>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Worker
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Day Hours
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Day Rate
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Night Hours
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Night Rate
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Total Hours
              </th>

              <th className="px-4 py-3 border-b text-left font-semibold">
                Amount
              </th>
            </tr>
          </thead>

          <tbody>
            {payroll.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No payroll data found for selected dates.
                </td>
              </tr>
            ) : (
              payroll.map(
                (
                  row: any,
                  index
                ) => (
                  <tr
                    key={row.name}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                    }
                  >
                    <td className="px-4 py-3 border-b border-r">
                      {row.name}
                    </td>

                    <td className="px-4 py-3 border-b border-r">
                      {row.dayHours.toFixed(
                        2
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-r">
                      $
                      {row.dayRate.toFixed(
                        2
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-r">
                      {row.nightHours.toFixed(
                        2
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-r">
                      $
                      {row.nightRate.toFixed(
                        2
                      )}
                    </td>

                    <td className="px-4 py-3 border-b border-r font-medium">
                      {row.totalHours.toFixed(
                        2
                      )}
                    </td>

                    <td className="px-4 py-3 border-b font-semibold">
                      $
                      {row.amount.toFixed(
                        2
                      )}

                      <div className="text-xs text-gray-500 mt-1">
                        D: $
                        {row.dayAmount.toFixed(
                          2
                        )}
                        {" | "}
                        N: $
                        {row.nightAmount.toFixed(
                          2
                        )}
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}