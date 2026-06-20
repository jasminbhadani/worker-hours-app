"use client";

export default function PayrollExportButton({
  payroll,
}: {
  payroll: any[];
}) {
  const downloadCSV = () => {
    if (!payroll?.length) {
      return;
    }

    const headers = [
      "Contractor",
      "Project",
      "Day Hours",
      "Day Rate",
      "Night Hours",
      "Night Rate",
      "Total Hours",
      "Amount",
    ];

    const rows = payroll.map((row) => [
      row.workerName ||
        row.contractorName ||
        row.name ||
        "",

      row.projectName ||
        row.project ||
        "",

      Number(row.dayHours || 0).toFixed(2),
      Number(row.dayHours || 0) > 0
        ? Number(row.dayRate || 0).toFixed(2)
        : "-",
      Number(row.nightHours || 0).toFixed(2),
      Number(row.nightHours || 0) > 0
      ? Number(row.nightRate || 0).toFixed(2)
      : "-",
      Number(row.totalHours || 0).toFixed(2),
      Number(row.amount || 0).toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `payroll-${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={downloadCSV}
      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
    >
      Export Payroll CSV
    </button>
  );
}