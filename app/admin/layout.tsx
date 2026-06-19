import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4 flex gap-6">
          <Link
            href="/admin"
            className="text-blue-600 font-medium hover:underline"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/workers"
            className="text-blue-600 font-medium hover:underline"
          >
            Workers
          </Link>

          <Link
            href="/admin/projects"
            className="text-blue-600 font-medium hover:underline"
          >
            Projects
          </Link>

          <Link
            href="/admin/payroll"
            className="text-blue-600 font-medium hover:underline"
          >
            Payroll
          </Link>

          <Link
            href="/admin/expenses"
            className="text-blue-600 font-medium hover:underline"
          >
            Expenses
          </Link>
        </div>
      </nav>

      {children}
    </div>
  );
}