import { supabaseServer } from "../../lib/supabase-server";
import ExportButton from "./ExportButton";

export default async function AdminPage() {
  const { data: entries, error } = await supabaseServer
    .from("work_entries")
    .select("*")
    .order("work_date", { ascending: false });

const totalEntries = entries?.length || 0;

const totalHours =
  entries?.reduce(
    (sum, entry) => sum + Number(entry.hours_worked),
    0
  ) || 0;

const uniqueWorkers =
  new Set(entries?.map((entry) => entry.worker_name))
    .size || 0;


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
            Workers
            </p>
            <h2 className="text-3xl font-bold">
            {uniqueWorkers}
            </h2>
        </div>
        </div>  
    
    <div className="flex gap-3 mb-4">
        <ExportButton entries={entries || []} 
        />
        
    
    <input
        type="text"
        placeholder="Search worker..."
        className="border p-2 rounded w-64"
        />
    </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            <th className="px-4 py-3 border-b border-r text-left font-semibold">Worker</th>
            <th className="px-4 py-3 border-b border-r text-left font-semibold">Job Site</th>
            <th className="px-4 py-3 border-b border-r text-left font-semibold">Date</th>
            <th className="px-4 py-3 border-b border-r text-left font-semibold">Hours</th>
            <th className="px-4 py-3 border-b border-r text-left font-semibold">Shift</th>
          </tr>
        </thead>

        <tbody>
            {entries?.map((entry, index) => (
                <tr
                    key={entry.id}
                    className={
                        index % 2 === 0
                        ? "bg-white"
                        : "bg-slate-50"
                    }
                >
              <td className="px-4 py-3 border-b border-r">
                {entry.worker_name}
              </td>

              <td className="px-4 py-3 border-b border-r">
                {entry.job_site}
              </td>

              <td className="px-4 py-3 border-b border-r">
                {entry.work_date}
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
      </div>
      </div>
    </div>
  );
}