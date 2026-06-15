import { supabaseServer } from "@/lib/supabase-server";
import AddWorkerForm from "./AddWorkerForm";
import EditWorkerButton from "./EditWorkerButton";

export const dynamic = "force-dynamic";

export default async function WorkersPage() {
  const { data: workers } = await supabaseServer
    .from("workers")
    .select("*")
    .order("name");

  const totalWorkers = workers?.length || 0;

  const activeWorkers =
    workers?.filter((w) => w.active).length || 0;

  const inactiveWorkers =
    workers?.filter((w) => !w.active).length || 0;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Worker Management
        </h1>

        <p className="text-slate-500">
          Add and manage workers and pay rates
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Workers
          </p>

          <h2 className="text-3xl font-bold">
            {totalWorkers}
          </h2>
        </div>

        <div className="bg-green-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Active Workers
          </p>

          <h2 className="text-3xl font-bold">
            {activeWorkers}
          </h2>
        </div>

        <div className="bg-red-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Inactive Workers
          </p>

          <h2 className="text-3xl font-bold">
            {inactiveWorkers}
          </h2>
        </div>
      </div>

      {/* Add Worker */}
      <AddWorkerForm />

      {/* Workers Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Worker
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Day Rate
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Night Rate
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Status
              </th>

              <th className="px-4 py-3 border-b text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {workers?.map((worker, index) => (
              <tr
                key={worker.id}
                className={
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50"
                }
              >
                <td className="px-4 py-3 border-b border-r font-medium">
                  {worker.name}
                </td>

                <td className="px-4 py-3 border-b border-r">
                  ${Number(worker.day_rate).toFixed(2)}
                </td>

                <td className="px-4 py-3 border-b border-r">
                  ${Number(worker.night_rate).toFixed(2)}
                </td>

                <td className="px-4 py-3 border-b border-r">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      worker.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {worker.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td className="px-4 py-3 border-b">
                  <EditWorkerButton worker={worker} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {workers?.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No workers found.
          </div>
        )}
      </div>
    </div>
  );
}