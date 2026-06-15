import { supabaseServer } from "@/lib/supabase-server";
import AddProjectForm from "./AddProjectForm";
import EditProjectButton from "./EditProjectButton";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabaseServer
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        Error loading projects
      </div>
    );
  }

  const totalProjects = projects?.length || 0;

  const activeProjects =
    projects?.filter((p) => p.active).length || 0;

  const inactiveProjects =
    projects?.filter((p) => !p.active).length || 0;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Project Management
        </h1>

        <p className="text-slate-500">
          Add and manage projects
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Total Projects
          </p>

          <h2 className="text-3xl font-bold">
            {totalProjects}
          </h2>
        </div>

        <div className="bg-green-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Active Projects
          </p>

          <h2 className="text-3xl font-bold">
            {activeProjects}
          </h2>
        </div>

        <div className="bg-red-600 text-white rounded-xl p-5 shadow">
          <p className="text-sm opacity-80">
            Inactive Projects
          </p>

          <h2 className="text-3xl font-bold">
            {inactiveProjects}
          </h2>
        </div>
      </div>

      {/* Add Form */}
      <AddProjectForm />

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Project Name
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Status
              </th>

              <th className="px-4 py-3 border-b border-r text-left font-semibold">
                Created
              </th>

              <th className="px-4 py-3 border-b text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {projects?.map((project, index) => (
              <tr
                key={project.id}
                className={
                  index % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50"
                }
              >
                <td className="px-4 py-3 border-b border-r">
                  {project.name}
                </td>

                <td className="px-4 py-3 border-b border-r">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      project.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {project.active
                      ? "Active"
                      : "Inactive"}
                  </span>
                </td>

                <td className="px-4 py-3 border-b border-r">
                  {new Date(
                    project.created_at
                  ).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 border-b">
                  <EditProjectButton
                    project={project}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {projects?.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            No projects found.
          </div>
        )}
      </div>
    </div>
  );
}